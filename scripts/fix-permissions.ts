#!/usr/bin/env tsx
/**
 * Script to fix database permissions
 * This script grants necessary permissions to the database user
 * 
 * Usage: 
 *   tsx scripts/fix-permissions.ts
 *   or
 *   node --loader ts-node/esm scripts/fix-permissions.ts
 */

import 'dotenv/config'
import { Pool } from 'pg'

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

async function fixPermissions() {
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is required')
    process.exit(1)
  }

  const dbInfo = parseDatabaseUrl(DATABASE_URL)
  if (!dbInfo) {
    console.error(`❌ Invalid DATABASE_URL format: ${DATABASE_URL}`)
    process.exit(1)
  }

  // Connect as the application user first to check current user
  const appPool = new Pool({
    user: dbInfo.user,
    password: dbInfo.password,
    host: dbInfo.host || 'localhost',
    port: dbInfo.port || 5432,
    database: dbInfo.database,
  })

  try {
    // Get the current user
    const userResult = await appPool.query('SELECT current_user, session_user')
    const currentUser = userResult.rows[0].current_user
    console.log(`Current database user: ${currentUser}`)

    // Try to grant permissions as the current user
    // If this fails, we'll need superuser access
    try {
      console.log('Attempting to grant permissions...')
      
      // Grant permissions on all tables
      await appPool.query(`
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "${currentUser}";
      `)
      
      await appPool.query(`
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "${currentUser}";
      `)
      
      await appPool.query(`
        GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO "${currentUser}";
      `)
      
      // Set default privileges
      await appPool.query(`
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${currentUser}";
      `)
      
      await appPool.query(`
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${currentUser}";
      `)
      
      await appPool.query(`
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO "${currentUser}";
      `)

      // Also grant to PUBLIC as a fallback
      await appPool.query(`
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO PUBLIC;
      `)
      
      await appPool.query(`
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;
      `)
      
      await appPool.query(`
        GRANT USAGE ON SCHEMA public TO PUBLIC;
      `)

      // Grant specific permissions on each table
      const tables = [
        'User', 'Admin', 'Category', 'Product', 'Order', 'OrderItem',
        'Inquiry', 'ContactInfo', 'Blog', 'Career', 'Resource',
        'PasswordResetToken', 'HeroSlide',
        // CMS Content Management tables (added in migrate-add-cms-content.sql)
        'AuthorisedDistributor', 'PrincipalPartner', 'TechnicalDetails',
        'AboutUsContent', 'TechnicalSupportContent', 'CompanyPolicy', 'ReturnsContent'
      ]

      for (const table of tables) {
        try {
          await appPool.query(`
            GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "${table}" TO "${currentUser}", PUBLIC;
          `)
          console.log(`✓ Granted permissions on table: ${table}`)
        } catch (error: any) {
          console.warn(`⚠ Could not grant permissions on ${table}: ${error.message}`)
        }
      }

      console.log('✅ Permissions granted successfully!')
    } catch (error: any) {
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.error('❌ Permission denied. You need to run this as a PostgreSQL superuser.')
        console.log('\nPlease run the following SQL commands as a superuser (e.g., postgres user):')
        console.log('\n--- SQL Commands ---')
        console.log(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "${currentUser}";`)
        console.log(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "${currentUser}";`)
        console.log(`GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO "${currentUser}";`)
        console.log(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${currentUser}";`)
        console.log(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${currentUser}";`)
        console.log(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO "${currentUser}";`)
        console.log('\nOr use the SQL file: prisma/grant-permissions.sql')
        console.log('\nExample:')
        console.log(`  psql -U postgres -d ${dbInfo.database} -f prisma/grant-permissions.sql`)
        process.exit(1)
      } else {
        throw error
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await appPool.end()
  }
}

fixPermissions()
