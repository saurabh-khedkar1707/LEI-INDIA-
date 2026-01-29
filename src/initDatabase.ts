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
    
    // Always seed users if they don't exist
    if (!hasUserData) {
      const userPasswordHash = await bcrypt.hash('User@123', 10)
      const users = [
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
          company: 'Tech Corp',
          phone: '+91-9876543210',
          role: 'customer',
        },
        {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          company: 'Industrial Solutions',
          phone: '+91-9876543211',
          role: 'customer',
        },
        {
          name: 'Bob Johnson',
          email: 'bob.johnson@example.com',
          company: 'Manufacturing Inc',
          phone: '+91-9876543212',
          role: 'customer',
        },
      ]
      
      for (const user of users) {
        await client.query(
          `INSERT INTO "User" (name, email, password, company, phone, role, "isActive", "emailVerified", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
           ON CONFLICT (email) DO NOTHING`,
          [user.name, user.email, userPasswordHash, user.company, user.phone, user.role, true, true]
        )
      }
    }
    
    // Always seed categories - they're essential for the app to work
    // These match the categories shown in the homepage design
    const categories = [
      {
        name: 'M12 Connectors',
        slug: 'm12-connectors',
        description: 'Professional M12 industrial connectors for sensors and actuators',
        image: '/images/categories/m12.jpg',
        parentId: null,
      },
      {
        name: 'M8 Connectors',
        slug: 'm8-connectors',
        description: 'Compact M8 industrial connectors for space-constrained applications',
        image: '/images/categories/m8.jpg',
        parentId: null,
      },
      {
        name: 'RJ45 Patch Cords',
        slug: 'rj45-patch-cords',
        description: 'Industrial Ethernet patch cords with IP20 and IP67 ratings',
        image: '/images/categories/rj45.jpg',
        parentId: null,
      },
      {
        name: 'PROFINET Products',
        slug: 'profinet-products',
        description: 'PROFINET cordsets and cables for Industrial Ethernet',
        image: '/images/categories/profinet.jpg',
        parentId: null,
      },
    ]
    
    const categoryIds: Record<string, string> = {}
    for (const category of categories) {
      const result = await client.query(
        `INSERT INTO "Category" (name, slug, description, image, "parentId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, image = EXCLUDED.image
         RETURNING id`,
        [category.name, category.slug, category.description, category.image, category.parentId]
      )
      if (result.rows.length > 0) {
        categoryIds[category.slug] = result.rows[0].id
      }
    }
    
    // Seed products if they don't exist
    let productIds: Record<string, string> = {}
    if (!hasProductData) {
      const products = [
        {
          sku: 'CONN-001',
          name: 'RJ45 Ethernet Connector',
          category: 'connectors',
          description: 'Standard RJ45 connector for Ethernet cables',
          technicalDescription: '8-pin modular connector, gold plated contacts',
          coding: 'T568B',
          pins: 8,
          ipRating: 'IP20',
          gender: 'Male',
          connectorType: 'RJ45',
          material: 'Plastic',
          voltage: '125V',
          current: '1.5A',
          temperatureRange: '-40°C to 85°C',
          wireGauge: '24-26 AWG',
          cableLength: null,
          price: 25.50,
          priceType: 'per_unit',
          inStock: true,
          stockQuantity: 500,
          images: JSON.stringify(['/images/products/conn-001-1.jpg', '/images/products/conn-001-2.jpg']),
          datasheetUrl: '/documents/datasheets/conn-001.pdf',
        },
        {
          sku: 'CONN-002',
          name: 'USB Type-C Connector',
          category: 'connectors',
          description: 'USB Type-C reversible connector',
          technicalDescription: '24-pin USB-C connector, supports USB 3.1',
          coding: null,
          pins: 24,
          ipRating: 'IP54',
          gender: 'Male',
          connectorType: 'USB-C',
          material: 'Metal/Plastic',
          voltage: '5V',
          current: '3A',
          temperatureRange: '-20°C to 70°C',
          wireGauge: '28-30 AWG',
          cableLength: null,
          price: 45.00,
          priceType: 'per_unit',
          inStock: true,
          stockQuantity: 300,
          images: JSON.stringify(['/images/products/conn-002-1.jpg']),
          datasheetUrl: '/documents/datasheets/conn-002.pdf',
        },
        {
          sku: 'CABLE-001',
          name: 'Ethernet Cat6 Cable',
          category: 'cables',
          description: 'Cat6 Ethernet cable, 1 meter',
          technicalDescription: 'Unshielded twisted pair, 23 AWG',
          coding: null,
          pins: null,
          ipRating: null,
          gender: null,
          connectorType: null,
          material: 'Copper',
          voltage: null,
          current: null,
          temperatureRange: '-20°C to 60°C',
          wireGauge: '23 AWG',
          cableLength: '1m',
          price: 150.00,
          priceType: 'per_unit',
          inStock: true,
          stockQuantity: 200,
          images: JSON.stringify(['/images/products/cable-001-1.jpg']),
          datasheetUrl: null,
        },
        {
          sku: 'TERM-001',
          name: 'Terminal Block 10A',
          category: 'terminals',
          description: 'Screw terminal block, 10A rating',
          technicalDescription: '2-position terminal block, screw type',
          coding: null,
          pins: 2,
          ipRating: 'IP20',
          gender: null,
          connectorType: 'Screw Terminal',
          material: 'Plastic/Metal',
          voltage: '300V',
          current: '10A',
          temperatureRange: '-40°C to 105°C',
          wireGauge: '12-24 AWG',
          cableLength: null,
          price: 35.75,
          priceType: 'per_unit',
          inStock: true,
          stockQuantity: 400,
          images: JSON.stringify(['/images/products/term-001-1.jpg', '/images/products/term-001-2.jpg']),
          datasheetUrl: '/documents/datasheets/term-001.pdf',
        },
        {
          sku: 'SWITCH-001',
          name: 'Toggle Switch SPST',
          category: 'switches',
          description: 'Single pole single throw toggle switch',
          technicalDescription: 'SPST toggle switch, 16A rating',
          coding: null,
          pins: 2,
          ipRating: 'IP65',
          gender: null,
          connectorType: 'Solder Lug',
          material: 'Metal/Plastic',
          voltage: '250V AC',
          current: '16A',
          temperatureRange: '-25°C to 85°C',
          wireGauge: '14-18 AWG',
          cableLength: null,
          price: 120.00,
          priceType: 'per_unit',
          inStock: true,
          stockQuantity: 150,
          images: JSON.stringify(['/images/products/switch-001-1.jpg']),
          datasheetUrl: '/documents/datasheets/switch-001.pdf',
        },
      ]
      
      for (const product of products) {
        const result = await client.query(
          `INSERT INTO "Product" (sku, name, category, description, "technicalDescription", coding, pins, "ipRating", gender, "connectorType", material, voltage, current, "temperatureRange", "wireGauge", "cableLength", price, "priceType", "inStock", "stockQuantity", images, "datasheetUrl", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21::jsonb, $22, NOW(), NOW())
           ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price
           RETURNING id`,
          [
            product.sku,
            product.name,
            product.category,
            product.description,
            product.technicalDescription,
            product.coding,
            product.pins,
            product.ipRating,
            product.gender,
            product.connectorType,
            product.material,
            product.voltage,
            product.current,
            product.temperatureRange,
            product.wireGauge,
            product.cableLength,
            product.price,
            product.priceType,
            product.inStock,
            product.stockQuantity,
            product.images,
            product.datasheetUrl,
          ]
        )
        if (result.rows.length > 0) {
          productIds[product.sku] = result.rows[0].id
        }
      }
    } else {
      // If products already exist, fetch their IDs for order items
      const existingProducts = await client.query(
        `SELECT id, sku FROM "Product" WHERE sku IN ($1, $2, $3, $4, $5)`,
        ['CONN-001', 'CONN-002', 'CABLE-001', 'TERM-001', 'SWITCH-001']
      )
      for (const row of existingProducts.rows) {
        productIds[row.sku] = row.id
      }
    }
    
    const orders = [
      {
        companyName: 'Tech Corp',
        contactName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+91-9876543210',
        companyAddress: '123 Tech Street, Bangalore, Karnataka 560001',
        notes: 'Urgent delivery required',
        status: 'pending',
      },
      {
        companyName: 'Industrial Solutions',
        contactName: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+91-9876543211',
        companyAddress: '456 Industrial Avenue, Mumbai, Maharashtra 400001',
        notes: 'Bulk order discount requested',
        status: 'processing',
      },
    ]
    
    const orderIds: string[] = []
    for (const order of orders) {
      const result = await client.query(
        `INSERT INTO "Order" ("companyName", "contactName", email, phone, "companyAddress", notes, status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING id`,
        [order.companyName, order.contactName, order.email, order.phone, order.companyAddress, order.notes, order.status]
      )
      if (result.rows.length > 0) {
        orderIds.push(result.rows[0].id)
      }
    }
    
    if (orderIds.length > 0 && Object.keys(productIds).length > 0) {
      const orderItems = [
        {
          orderId: orderIds[0],
          productId: productIds['CONN-001'],
          sku: 'CONN-001',
          name: 'RJ45 Ethernet Connector',
          quantity: 50,
          notes: 'Need by end of week',
        },
        {
          orderId: orderIds[0],
          productId: productIds['CABLE-001'],
          sku: 'CABLE-001',
          name: 'Ethernet Cat6 Cable',
          quantity: 25,
          notes: null,
        },
        {
          orderId: orderIds[1],
          productId: productIds['TERM-001'],
          sku: 'TERM-001',
          name: 'Terminal Block 10A',
          quantity: 100,
          notes: 'Bulk pricing',
        },
      ]
      
      for (const item of orderItems) {
        await client.query(
          `INSERT INTO "OrderItem" ("orderId", "productId", sku, name, quantity, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [item.orderId, item.productId, item.sku, item.name, item.quantity, item.notes]
        )
      }
    }
    
    const inquiries = [
      {
        name: 'Alice Brown',
        email: 'alice.brown@example.com',
        phone: '+91-9876543213',
        company: 'Electronics Ltd',
        subject: 'Product Inquiry - USB Connectors',
        message: 'I am interested in bulk purchase of USB Type-C connectors. Please provide pricing for 1000 units.',
        read: false,
        responded: false,
      },
      {
        name: 'Charlie Wilson',
        email: 'charlie.wilson@example.com',
        phone: '+91-9876543214',
        company: 'Automation Systems',
        subject: 'Custom Cable Requirements',
        message: 'We need custom length Ethernet cables. Can you provide custom manufacturing?',
        read: true,
        responded: true,
        notes: 'Replied with custom quote',
      },
    ]
    
    for (const inquiry of inquiries) {
      await client.query(
        `INSERT INTO "Inquiry" (name, email, phone, company, subject, message, read, responded, notes, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [
          inquiry.name,
          inquiry.email,
          inquiry.phone,
          inquiry.company,
          inquiry.subject,
          inquiry.message,
          inquiry.read,
          inquiry.responded,
          inquiry.notes || null,
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
    
    const blogs = [
      {
        title: 'Understanding Electrical Connectors: A Complete Guide',
        slug: 'understanding-electrical-connectors-guide',
        excerpt: 'Learn about different types of electrical connectors and their applications in modern electronics.',
        content: 'Electrical connectors are essential components in any electronic system...',
        image: '/images/blogs/connectors-guide.jpg',
        published: true,
      },
      {
        title: 'Best Practices for Cable Management',
        slug: 'best-practices-cable-management',
        excerpt: 'Tips and tricks for organizing cables in industrial and commercial settings.',
        content: 'Proper cable management is crucial for maintaining safety and efficiency...',
        image: '/images/blogs/cable-management.jpg',
        published: true,
      },
      {
        title: 'Future of USB-C Technology',
        slug: 'future-usb-c-technology',
        excerpt: 'Exploring the latest developments in USB-C connector technology.',
        content: 'USB-C has revolutionized connectivity in modern devices...',
        image: '/images/blogs/usb-c-future.jpg',
        published: false,
      },
    ]
    
    for (const blog of blogs) {
      await client.query(
        `INSERT INTO "Blog" (title, slug, excerpt, content, image, published, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (slug) DO NOTHING`,
        [blog.title, blog.slug, blog.excerpt, blog.content, blog.image, blog.published]
      )
    }
    
    const careers = [
      {
        title: 'Senior Electrical Engineer',
        slug: 'senior-electrical-engineer',
        location: 'Bangalore, India',
        type: 'Full-time',
        description: 'We are looking for an experienced electrical engineer to join our product development team.',
        requirements: 'B.Tech in Electrical Engineering, 5+ years experience, knowledge of connector design',
      },
      {
        title: 'Sales Manager',
        slug: 'sales-manager',
        location: 'Mumbai, India',
        type: 'Full-time',
        description: 'Lead our sales team and drive business growth in the industrial sector.',
        requirements: 'MBA preferred, 3+ years B2B sales experience, strong communication skills',
      },
    ]
    
    for (const career of careers) {
      await client.query(
        `INSERT INTO "Career" (title, slug, location, type, description, requirements, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (slug) DO NOTHING`,
        [career.title, career.slug, career.location, career.type, career.description, career.requirements]
      )
    }
    
    const resources = [
      {
        title: 'Product Catalog 2024',
        slug: 'product-catalog-2024',
        description: 'Complete catalog of all our products with specifications and pricing.',
        url: '/documents/catalog-2024.pdf',
      },
      {
        title: 'Installation Guide - Connectors',
        slug: 'installation-guide-connectors',
        description: 'Step-by-step guide for installing various types of connectors.',
        url: '/documents/installation-guide-connectors.pdf',
      },
      {
        title: 'Technical Specifications Sheet',
        slug: 'technical-specifications',
        description: 'Comprehensive technical specifications for all product categories.',
        url: '/documents/technical-specs.pdf',
      },
    ]
    
    for (const resource of resources) {
      await client.query(
        `INSERT INTO "Resource" (title, slug, description, url, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (slug) DO NOTHING`,
        [resource.title, resource.slug, resource.description, resource.url]
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
