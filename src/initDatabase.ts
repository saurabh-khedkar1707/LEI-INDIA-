import 'dotenv/config'
import { Pool } from 'pg'
import { readFileSync, writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import net from 'net'
import bcrypt from 'bcryptjs'

const DATABASE_URL = process.env.DATABASE_URL
const START_PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000

function createPool(): Pool {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required but not set')
  }
  
  const dbUrl = DATABASE_URL
  
  // Optimized pool configuration for production-scale performance
  const poolConfig: any = {
    max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Max connections per instance
    min: parseInt(process.env.DB_POOL_MIN || '5', 10), // Min idle connections
    idleTimeoutMillis: 30000, // Close idle clients after 30s
    connectionTimeoutMillis: 10000, // Return error after 10s if connection cannot be established
    statement_timeout: 30000, // Query timeout (30s)
    query_timeout: 30000,
    // Enable prepared statements for better performance
    allowExitOnIdle: false,
  }
  
  if (dbUrl.match(/^postgresql:\/\/[^@]+@\/[^\/]+/)) {
    const match = dbUrl.match(/^postgresql:\/\/([^@]+)@\/(.+)$/)
    if (match) {
      const [, user, database] = match
      return new Pool({
        ...poolConfig,
        user: user || process.env.USER,
        database: database,
        password: undefined,
      })
    }
  }
  
  try {
    const url = new URL(dbUrl)
    if (url.hostname === 'localhost' && !url.port && url.pathname) {
      return new Pool({
        ...poolConfig,
        user: url.username || process.env.USER,
        database: url.pathname.slice(1),
      })
    }
  } catch (e) {
    const match = dbUrl.match(/^postgresql:\/\/(?:([^:]+):([^@]+)@)?([^\/]+)\/(.+)$/)
    if (match) {
      const [, user, password, host, database] = match
      return new Pool({
        ...poolConfig,
        user,
        password,
        host,
        database,
      })
    }
    throw new Error(`Invalid DATABASE_URL format: ${dbUrl}`)
  }
  
  return new Pool({
    ...poolConfig,
    connectionString: DATABASE_URL,
  })
}

// Pool will be created lazily after database is ensured to exist
let poolInstance: Pool | null = null

function getPool(): Pool {
  if (!poolInstance) {
    poolInstance = createPool()
  }
  return poolInstance
}

// Export pool as a getter that ensures database exists first
export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    return getPool()[prop as keyof Pool]
  }
}) as Pool

async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const checkPort = (port: number) => {
      const server = net.createServer()
      
      server.listen(port, () => {
        server.once('close', () => {
          resolve(port)
        })
        server.close()
      })
      
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          checkPort(port + 1)
        } else {
          reject(err)
        }
      })
    }
    
    checkPort(startPort)
  })
}

function parseDatabaseUrl(url: string): { user?: string; password?: string; host?: string; port?: number; database: string } | null {
  try {
    const parsed = new URL(url)
    return {
      user: parsed.username || undefined,
      password: parsed.password || undefined,
      host: parsed.hostname || undefined,
      port: parsed.port ? parseInt(parsed.port) : undefined,
      database: parsed.pathname.slice(1) || 'postgres',
    }
  } catch (e) {
    // Try regex parsing for postgresql:// format
    const match = url.match(/^postgresql:\/\/(?:([^:]+):([^@]+)@)?([^\/:]+)(?::(\d+))?\/(.+)$/)
    if (match) {
      const [, user, password, host, port, database] = match
      return {
        user: user || undefined,
        password: password || undefined,
        host: host || undefined,
        port: port ? parseInt(port) : undefined,
        database: database,
      }
    }
    return null
  }
}

async function ensureDatabaseExists(): Promise<void> {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required but not set')
  }

  const dbInfo = parseDatabaseUrl(DATABASE_URL)
  if (!dbInfo) {
    throw new Error(`Invalid DATABASE_URL format: ${DATABASE_URL}`)
  }

  const targetDatabase = dbInfo.database

  // Connect to default 'postgres' database to check/create target database
  const adminPool = new Pool({
    user: dbInfo.user || process.env.USER || 'postgres',
    password: dbInfo.password,
    host: dbInfo.host || 'localhost',
    port: dbInfo.port || 5432,
    database: 'postgres', // Connect to default database
  })

  try {
    // Check if database exists
    const result = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDatabase]
    )

    if (result.rows.length === 0) {
      // Database doesn't exist, create it
      console.log(`Creating database "${targetDatabase}"...`)
      await adminPool.query(`CREATE DATABASE "${targetDatabase}"`)
      console.log(`Database "${targetDatabase}" created ✔`)
    } else {
      console.log(`Database "${targetDatabase}" already exists ✔`)
    }
  } catch (error: any) {
    // If error is "database already exists", that's fine
    if (error.message && error.message.includes('already exists')) {
      console.log(`Database "${targetDatabase}" already exists ✔`)
    } else {
      throw error
    }
  } finally {
    await adminPool.end()
  }
}

async function checkConnection(): Promise<void> {
  try {
    // First ensure database exists
    await ensureDatabaseExists()
    
    // Now create pool and test connection to the target database
    const testPool = getPool()
    await testPool.query('SELECT NOW()')
    console.log('DB connected ✔')
  } catch (error: any) {
    console.error('DB connected ✖')
    console.error(`Connection failed: ${error.message}`)
    process.exit(1)
  }
}

async function checkTableExists(tableName: string): Promise<boolean> {
  const result = await getPool().query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    )`,
    [tableName]
  )
  return result.rows[0].exists
}

async function createTables(): Promise<void> {
  const schemaPath = join(process.cwd(), 'prisma', 'schema.sql')
  const schemaSQL = readFileSync(schemaPath, 'utf-8')
  
  const requiredTables = [
    'User',
    'Admin',
    'Category',
    'Product',
    'Order',
    'OrderItem',
    'Inquiry',
    'ContactInfo',
    'Blog',
    'Career',
    'Resource',
    'PasswordResetToken',
    'HeroSlide',
  ]
  
  const tablesToCreate: string[] = []
  
  for (const table of requiredTables) {
    const exists = await checkTableExists(table)
    if (!exists) {
      tablesToCreate.push(table)
    }
  }
  
    if (tablesToCreate.length > 0) {
      await getPool().query(schemaSQL)
      console.log(`Tables created: ${tablesToCreate.join(', ')}`)
    } else {
      console.log('Tables created or skipped: all tables exist')
    }
}

async function tableHasData(tableName: string): Promise<boolean> {
  const result = await getPool().query(`SELECT COUNT(*) as count FROM "${tableName}"`)
  return parseInt(result.rows[0].count) > 0
}

async function seedData(): Promise<void> {
  const hasUserData = await tableHasData('User')
  const hasAdminData = await tableHasData('Admin')
  const hasCategoryData = await tableHasData('Category')
  const hasProductData = await tableHasData('Product')
  
  // If all tables have data, skip seeding
  if (hasUserData && hasAdminData && hasCategoryData && hasProductData) {
    console.log('Seeding executed or skipped: data exists')
    return
  }
  
    const client = await getPool().connect()
  
  try {
    await client.query('BEGIN')
    
    // Always seed admins if they don't exist
    if (!hasAdminData) {
      const adminPasswordHash = await bcrypt.hash('Admin@123', 10)
      await client.query(
        `INSERT INTO "Admin" (username, password, role, "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (username) DO NOTHING`,
        ['admin', adminPasswordHash, 'admin', true]
      )
      await client.query(
        `INSERT INTO "Admin" (username, password, role, "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (username) DO NOTHING`,
        ['superadmin', adminPasswordHash, 'superadmin', true]
      )
    }
    
    // Always seed 1 user if they don't exist
    if (!hasUserData) {
      const userPasswordHash = await bcrypt.hash('User@123', 10)
      await client.query(
        `INSERT INTO "User" (name, email, password, company, phone, role, "isActive", "emailVerified", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (email) DO NOTHING`,
        ['John Doe', 'john.doe@example.com', userPasswordHash, 'Tech Corp', '+91-9876543210', 'customer', true, true]
      )
    }
    
    // Always seed 1 category if they don't exist
    let categoryIds: Record<string, string> = {}
    if (!hasCategoryData) {
      const result = await client.query(
        `INSERT INTO "Category" (name, slug, description, image, "parentId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image = EXCLUDED.image
         RETURNING id`,
        ['M12 Connectors', 'm12-connectors', 'Professional M12 industrial connectors for sensors and actuators', '/images/categories/m12.jpg', null]
      )
      if (result.rows.length > 0) {
        categoryIds['m12-connectors'] = result.rows[0].id
      }
    } else {
      // Fetch existing category for product seeding
      const existingCategory = await client.query(`SELECT id, slug FROM "Category" LIMIT 1`)
      if (existingCategory.rows.length > 0) {
        categoryIds[existingCategory.rows[0].slug] = existingCategory.rows[0].id
      }
    }
    
    // Seed 1 product if they don't exist
    let productIds: Record<string, string> = {}
    if (!hasProductData) {
      const categoryId = Object.values(categoryIds)[0] || null
      const result = await client.query(
        `INSERT INTO "Product" (sku, name, category, "categoryId", description, "technicalDescription", coding, pins, "ipRating", gender, "connectorType", material, voltage, current, "temperatureRange", "wireGauge", "cableLength", price, "priceType", "inStock", "stockQuantity", images, "datasheetUrl", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21::jsonb, $22, NOW(), NOW())
         ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price
         RETURNING id`,
        [
          'PROD-001',
          'M12 Industrial Connector',
          'connectors',
          categoryId,
          'Professional M12 industrial connector for sensors and actuators',
          '4-pin M12 connector, gold plated contacts, IP67 rated',
          'A-coded',
          4,
          'IP67',
          'Male',
          'M12',
          'Metal/Plastic',
          '250V',
          '4A',
          '-40°C to 85°C',
          '24 AWG',
          null,
          35.50,
          'per_unit',
          true,
          100,
          JSON.stringify(['/images/products/prod-001-1.jpg']),
          '/documents/datasheets/prod-001.pdf',
        ]
      )
      if (result.rows.length > 0) {
        productIds['PROD-001'] = result.rows[0].id
      }
    } else {
      // If products already exist, fetch first product ID for order items
      const existingProduct = await client.query(`SELECT id, sku FROM "Product" LIMIT 1`)
      if (existingProduct.rows.length > 0) {
        productIds[existingProduct.rows[0].sku] = existingProduct.rows[0].id
      }
    }
    
    // Seed 1 order if they don't exist
    const hasOrderData = await tableHasData('Order')
    let orderIds: string[] = []
    if (!hasOrderData && Object.keys(productIds).length > 0) {
      const firstProductId = Object.values(productIds)[0]
      const firstProductSku = Object.keys(productIds)[0]
      const result = await client.query(
        `INSERT INTO "Order" ("companyName", "contactName", email, phone, "companyAddress", notes, status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING id`,
        ['Tech Corp', 'John Doe', 'john.doe@example.com', '+91-9876543210', '123 Tech Street, Bangalore, Karnataka 560001', 'Sample order', 'pending']
      )
      if (result.rows.length > 0) {
        orderIds.push(result.rows[0].id)
        // Add 1 order item
        await client.query(
          `INSERT INTO "OrderItem" ("orderId", "productId", sku, name, quantity, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [result.rows[0].id, firstProductId, firstProductSku, 'M12 Industrial Connector', 10, 'Sample order item']
        )
      }
    }
    
    // Seed 1 inquiry if they don't exist
    const hasInquiryData = await tableHasData('Inquiry')
    if (!hasInquiryData) {
      await client.query(
        `INSERT INTO "Inquiry" (name, email, phone, company, subject, message, read, responded, notes, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [
          'Alice Brown',
          'alice.brown@example.com',
          '+91-9876543213',
          'Electronics Ltd',
          'Product Inquiry - M12 Connectors',
          'I am interested in bulk purchase of M12 connectors. Please provide pricing for 100 units.',
          false,
          false,
          null,
        ]
      )
    }
    
    await client.query(
      `INSERT INTO "ContactInfo" (email, phone, address, city, state, country, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [
        'info@leiindias.com',
        '+91-80-12345678',
        '123 Business Park, Industrial Area',
        'Bangalore',
        'Karnataka',
        'India',
      ]
    )
    
    // Seed 1 blog if they don't exist
    const hasBlogData = await tableHasData('Blog')
    if (!hasBlogData) {
      await client.query(
        `INSERT INTO "Blog" (title, slug, excerpt, content, image, published, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (slug) DO NOTHING`,
        [
          'Understanding Electrical Connectors: A Complete Guide',
          'understanding-electrical-connectors-guide',
          'Learn about different types of electrical connectors and their applications in modern electronics.',
          'Electrical connectors are essential components in any electronic system. They provide reliable connections between different parts of a circuit, ensuring proper signal transmission and power delivery.',
          '/images/blogs/connectors-guide.jpg',
          true,
        ]
      )
    }
    
    // Seed 1 career if they don't exist
    const hasCareerData = await tableHasData('Career')
    if (!hasCareerData) {
      await client.query(
        `INSERT INTO "Career" (title, slug, location, type, description, requirements, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (slug) DO NOTHING`,
        [
          'Senior Electrical Engineer',
          'senior-electrical-engineer',
          'Bangalore, India',
          'Full-time',
          'We are looking for an experienced electrical engineer to join our product development team.',
          'B.Tech in Electrical Engineering, 5+ years experience, knowledge of connector design',
        ]
      )
    }
    
    // Seed 1 resource if they don't exist
    const hasResourceData = await tableHasData('Resource')
    if (!hasResourceData) {
      await client.query(
        `INSERT INTO "Resource" (title, slug, description, url, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (slug) DO NOTHING`,
        [
          'Product Catalog 2024',
          'product-catalog-2024',
          'Complete catalog of all our products with specifications and pricing.',
          '/documents/catalog-2024.pdf',
        ]
      )
    }
    
    await client.query('COMMIT')
    console.log('Seeding executed or skipped: data seeded')
  } catch (error: any) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function initDatabase(): Promise<number> {
  await checkConnection()
  await createTables()
  await seedData()
  
  const resolvedPort = await findAvailablePort(START_PORT)
  const portFile = join(process.cwd(), '.port')
  writeFileSync(portFile, resolvedPort.toString(), 'utf-8')
  console.log(`Final PORT in use: ${resolvedPort}`)
  
  return resolvedPort
}

const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.includes('initDatabase') ||
                     process.argv[1]?.endsWith('initDatabase.ts')

if (isMainModule) {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is required')
    process.exit(1)
  }

  if (!process.env.PORT) {
    console.error('❌ PORT is required')
    process.exit(1)
  }

  initDatabase()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('Database initialization failed:', error)
      process.exit(1)
    })
}
