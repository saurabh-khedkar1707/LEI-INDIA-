import jwt, { SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { readAdmins, getAdminByUsername, type AdminUser as StoredAdminUser } from './storage.js'

// Validate JWT_SECRET is set in production
const JWT_SECRET: string = process.env.JWT_SECRET || ''
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d'

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable must be set in production')
}

export type UserRole = 'admin' | 'superadmin' | 'customer'

export interface AdminUser {
  username: string
  role: UserRole
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(username: string, role: UserRole = 'admin'): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }
  return jwt.sign(
    { username, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  )
}

export function verifyToken(token: string): { username: string; role: UserRole } | null {
  try {
    if (!JWT_SECRET) {
      return null
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; role: UserRole }
    return decoded
  } catch (error) {
    return null
  }
}

export async function validateAdminCredentials(
  username: string,
  password: string
): Promise<{ valid: boolean; admin?: StoredAdminUser }> {
  try {
    const admin = await getAdminByUsername(username)
    
    if (!admin) {
      return { valid: false }
    }

    const isPasswordValid = await comparePassword(password, admin.passwordHash)
    
    if (!isPasswordValid) {
      return { valid: false }
    }

    return { valid: true, admin }
  } catch (error) {
    console.error('Error validating admin credentials:', error)
    return { valid: false }
  }
}

export async function initializeDefaultAdmin(): Promise<void> {
  try {
    const admins = await readAdmins()
    
    // Only create default admin if no admins exist
    if (admins.length === 0) {
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123'
      const passwordHash = await hashPassword(defaultPassword)
      
      const { createAdmin } = await import('./storage.js')
      await createAdmin({
        username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
        passwordHash,
        role: 'superadmin',
      })
      
      console.log('✅ Default admin user created')
      console.log(`   Username: ${process.env.DEFAULT_ADMIN_USERNAME || 'admin'}`)
      console.log(`   Password: ${defaultPassword}`)
      console.log('   ⚠️  Please change the default password after first login!')
    }
  } catch (error) {
    console.error('Error initializing default admin:', error)
  }
}

// Helper to create admin user (for scripts)
export async function createAdminUser(
  username: string,
  password: string,
  role: 'admin' | 'superadmin' = 'admin'
): Promise<StoredAdminUser> {
  const existingAdmin = await getAdminByUsername(username)
  if (existingAdmin) {
    throw new Error('Admin user already exists')
  }

  const passwordHash = await hashPassword(password)
  const { createAdmin } = await import('./storage.js')
  return await createAdmin({ username, passwordHash, role })
}
