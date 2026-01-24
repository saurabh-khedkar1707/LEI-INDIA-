import { Router, Request, Response } from 'express'
import { validateAdminCredentials, generateToken, verifyToken } from '../utils/auth.js'
import { authLimiter } from '../middleware/rate-limit.js'
import { sanitizeBody } from '../middleware/sanitize.js'

export const authRouter = Router()

// Apply rate limiting and sanitization
authRouter.use(authLimiter)
authRouter.use(sanitizeBody)

// POST /api/admin/auth/login - Admin login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured')
      return res.status(500).json({ error: 'Server configuration error. Please contact administrator.' })
    }

    const result = await validateAdminCredentials(username, password)

    if (!result.valid || !result.admin) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    try {
      const token = generateToken(username, result.admin.role)

      res.json({
        token,
        user: {
          username: result.admin.username,
          role: result.admin.role,
        },
      })
    } catch (tokenError) {
      console.error('Token generation error:', tokenError)
      return res.status(500).json({ error: 'Failed to generate authentication token' })
    }
  } catch (error) {
    console.error('Login error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: `Failed to authenticate: ${errorMessage}` })
  }
})

// POST /api/admin/auth/verify - Verify token
authRouter.post('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    res.json({
      valid: true,
      user: decoded,
    })
  } catch (error) {
    res.status(401).json({ error: 'Token verification failed' })
  }
})
