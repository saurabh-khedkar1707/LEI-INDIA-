#!/usr/bin/env tsx
/**
 * List all admin users
 * 
 * Usage:
 *   npm run list-admins
 */

import { readAdmins } from '../src/utils/storage.js'

async function main() {
  try {
    const admins = await readAdmins()
    
    if (admins.length === 0) {
      console.log('No admin users found.')
      return
    }

    console.log(`\n📋 Found ${admins.length} admin user(s):\n`)
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.username}`)
      console.log(`   Role: ${admin.role}`)
      console.log(`   ID: ${admin.id}`)
      console.log(`   Created: ${new Date(admin.createdAt).toLocaleString()}`)
      console.log(`   Updated: ${new Date(admin.updatedAt).toLocaleString()}`)
      console.log('')
    })
  } catch (error) {
    console.error('❌ Failed to list admin users:', error)
    process.exit(1)
  }
}

main()
