#!/usr/bin/env tsx
/**
 * Admin User Management Script
 * 
 * Usage:
 *   npm run create-admin -- <username> <password> [role]
 * 
 * Examples:
 *   npm run create-admin -- admin mypassword123
 *   npm run create-admin -- superadmin mypassword123 superadmin
 */

import { createAdminUser } from '../src/utils/auth.js'

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('Usage: npm run create-admin -- <username> <password> [role]')
    console.error('  role: admin (default) or superadmin')
    process.exit(1)
  }

  const [username, password, roleArg] = args
  const role = (roleArg === 'superadmin' ? 'superadmin' : 'admin') as 'admin' | 'superadmin'

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters long')
    process.exit(1)
  }

  try {
    const admin = await createAdminUser(username, password, role)
    console.log('✅ Admin user created successfully!')
    console.log(`   Username: ${admin.username}`)
    console.log(`   Role: ${admin.role}`)
    console.log(`   ID: ${admin.id}`)
    console.log(`   Created: ${admin.createdAt}`)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`)
    } else {
      console.error('❌ Failed to create admin user')
    }
    process.exit(1)
  }
}

main()
