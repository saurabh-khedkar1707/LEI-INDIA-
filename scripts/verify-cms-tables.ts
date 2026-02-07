#!/usr/bin/env tsx
/**
 * Verification Script: Check CMS Tables
 */

import 'dotenv/config'
import { Pool } from 'pg'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set')
  process.exit(1)
}

async function verifyTables() {
  const pool = new Pool({ connectionString: DATABASE_URL })
  
  try {
    const result = await pool.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name IN (
         'AuthorisedDistributor', 
         'PrincipalPartner', 
         'TechnicalDetails', 
         'AboutUsContent', 
         'TechnicalSupportContent', 
         'CompanyPolicy', 
         'ReturnsContent'
       ) 
       ORDER BY table_name`
    )
    
    console.log('✅ CMS Tables found:')
    result.rows.forEach(r => console.log(`   - ${r.table_name}`))
    
    if (result.rows.length === 7) {
      console.log('\n✅ All 7 CMS tables are present!')
    } else {
      console.log(`\n⚠️  Expected 7 tables, found ${result.rows.length}`)
    }
    
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

verifyTables().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
