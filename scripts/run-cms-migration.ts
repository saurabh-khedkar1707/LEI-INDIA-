#!/usr/bin/env tsx
/**
 * Migration Script: Add CMS Content Management Tables
 * 
 * This script runs the migration to add CMS content tables.
 * It uses DATABASE_URL from environment variables.
 * 
 * Usage:
 *   pnpm tsx scripts/run-cms-migration.ts
 *   OR
 *   tsx scripts/run-cms-migration.ts
 */

import 'dotenv/config'
import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set')
  console.error('Please set DATABASE_URL in your .env.local file or environment')
  process.exit(1)
}

async function runMigration() {
  const pool = new Pool({ connectionString: DATABASE_URL })
  
  try {
    console.log('🔄 Running migration: Add CMS Content Management Tables...')
    
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'prisma', 'migrate-add-cms-content.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    // Execute the migration
    await pool.query(migrationSQL)
    
    console.log('✅ Migration completed successfully!')
    console.log('   The following tables have been created:')
    console.log('   - AuthorisedDistributor')
    console.log('   - PrincipalPartner')
    console.log('   - TechnicalDetails')
    console.log('   - AboutUsContent')
    console.log('   - TechnicalSupportContent')
    console.log('   - CompanyPolicy')
    console.log('   - ReturnsContent')
    
  } catch (error: any) {
    if (error?.code === '42P07') {
      console.log('ℹ️  Some tables already exist. Migration may have already been run.')
      console.log('   This is safe - the migration uses CREATE TABLE IF NOT EXISTS')
    } else {
      console.error('❌ Migration failed:', error.message)
      if (error.code) {
        console.error(`   Error code: ${error.code}`)
      }
      if (error.detail) {
        console.error(`   Detail: ${error.detail}`)
      }
      process.exit(1)
    }
  } finally {
    await pool.end()
  }
}

runMigration().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
