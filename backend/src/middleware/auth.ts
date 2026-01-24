import { Request, Response, NextFunction } from 'express'
import { verifyToken, type UserRole } from '../utils/auth.js'

export interface AuthRequest extends Request {
  user?: {
    username: string
    role: UserRole
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' })
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  const decoded = verifyToken(token)

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' })
  }

  req.user = decoded
  next()
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' })
    }

    next()
  }
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  return requireRole(['superadmin'])(req, res, next)
}
