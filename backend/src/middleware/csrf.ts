import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

/**
 * CSRF Protection Middleware
 * 
 * IMPORTANT: PRODUCTION CLUSTER MODE LIMITATION
 * =============================================
 * This implementation uses in-memory storage (Map) which will NOT work correctly
 * in PM2 cluster mode or multi-instance deployments. Each process maintains its
 * own separate in-memory store, causing CSRF token validation failures when
 * requests are load-balanced across different instances.
 * 
 * For production deployments with PM2 cluster mode:
 * - Use Redis for shared CSRF token storage across all instances
 * - Or use a database-backed session store
 * - Or use a single-instance deployment (not recommended for high availability)
 * 
 * Example Redis implementation:
 * ```typescript
 * import Redis from 'ioredis';
 * const redis = new Redis(process.env.REDIS_URL);
 * 
 * export const createCSRFToken = async (sessionId: string): Promise<string> => {
 *   const token = generateCSRFToken();
 *   await redis.setex(`csrf:${sessionId}`, 86400, token); // 24 hours
 *   return token;
 * };
 * 
 * export const validateCSRFToken = async (sessionId: string, token: string): Promise<boolean> => {
 *   const stored = await redis.get(`csrf:${sessionId}`);
 *   return stored === token;
 * };
 * ```
 * 
 * Current implementation is suitable for:
 * - Development
 * - Single-instance production deployments
 * - Testing environments
 */

// In-memory store for CSRF tokens (in production, use Redis or database)
const csrfTokens = new Map<string, { token: string; expiresAt: number }>()

// Clean up expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expiresAt < now) {
      csrfTokens.delete(key)
    }
  }
}, 5 * 60 * 1000)

// CSRF token generation
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

// Generate and store CSRF token for a session
export const createCSRFToken = (sessionId: string): string => {
  const token = generateCSRFToken()
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  csrfTokens.set(sessionId, { token, expiresAt })
  return token
}

// Validate CSRF token
export const validateCSRFToken = (sessionId: string, token: string): boolean => {
  const stored = csrfTokens.get(sessionId)
  if (!stored) {
    return false
  }
  
  if (stored.expiresAt < Date.now()) {
    csrfTokens.delete(sessionId)
    return false
  }
  
  return stored.token === token
}

// Get session ID from request (using IP + User-Agent as fallback for stateless API)
const getSessionId = (req: Request): string => {
  // For authenticated requests, use user info
  if ((req as any).user) {
    return `user:${(req as any).user.username}`
  }
  
  // For unauthenticated requests, use IP + User-Agent
  // Normalize IP to handle IPv6 and proxy variations
  let ip = req.ip || req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown'

  // Ensure ip is a string
  if (Array.isArray(ip)) {
    ip = ip[0] || 'unknown'
  } else if (typeof ip !== 'string') {
    ip = String(ip)
  }

  // Extract first IP if x-forwarded-for contains multiple IPs
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim()
  }

  // Normalize IPv6 addresses
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7)
  }
  
  const userAgent = (req.headers['user-agent'] || 'unknown').substring(0, 50)
  return `anon:${ip}:${userAgent}`
}

// Get or create CSRF token (reuse existing valid token if available)
const getOrCreateCSRFToken = (sessionId: string): string => {
  const existing = csrfTokens.get(sessionId)
  // Reuse existing token if it's still valid
  if (existing && existing.expiresAt > Date.now()) {
    return existing.token
  }
  // Create new token if none exists or current one expired
  return createCSRFToken(sessionId)
}

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Get or create CSRF token for GET requests (reuse if valid)
    const sessionId = getSessionId(req)
    const token = getOrCreateCSRFToken(sessionId)
    res.setHeader('X-CSRF-Token', token)
    return next()
  }

  // For state-changing operations, validate CSRF token
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const sessionId = getSessionId(req)
    const token = req.headers['x-csrf-token'] as string || req.body._csrf
    
    if (!token) {
      return res.status(403).json({ 
        error: 'CSRF token missing. Please include X-CSRF-Token header.' 
      })
    }
    
    if (!validateCSRFToken(sessionId, token)) {
      return res.status(403).json({ 
        error: 'Invalid CSRF token. Please refresh the page and try again.' 
      })
    }
  }

  next()
}

// Helper to set secure cookie options
export const getSecureCookieOptions = () => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  }
}
