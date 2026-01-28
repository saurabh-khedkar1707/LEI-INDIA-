import jwt, { type Secret, type SignOptions, type JwtPayload } from 'jsonwebtoken'

export type UserRole = 'admin' | 'superadmin' | 'customer'

const JWT_SECRET: Secret | '' = process.env.JWT_SECRET || ''
// jsonwebtoken's types expect a union type for expiresIn, so we coerce safely
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn']

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable must be set in production')
}

export function generateToken(username: string, role: UserRole = 'customer'): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }

  const payload: JwtPayload = { username, role }
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN }

  return jwt.sign(payload, JWT_SECRET, options)
}

export function verifyToken(
  token: string,
): { username: string; role: UserRole } | null {
  try {
    if (!JWT_SECRET) return null
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; role: UserRole }
    return decoded
  } catch {
    return null
  }
}

