import { Router, Request, Response } from 'express'
import { getUserByEmail, createUser, getUserById } from '../utils/storage.js'
import { User } from '../models/User.js'
import { generateToken, verifyToken } from '../utils/auth.js'
import { authLimiter } from '../middleware/rate-limit.js'
import { sanitizeBody } from '../middleware/sanitize.js'
import { z } from 'zod'

export const usersRouter = Router()

// Apply rate limiting and sanitization
usersRouter.use(authLimiter)
usersRouter.use(sanitizeBody)

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  company: z.string().min(2, 'Company name is required').trim().optional(),
  phone: z.string().min(10, 'Please enter a valid phone number').trim().optional(),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
})

// POST /api/users/register - Customer registration
usersRouter.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body)

    // Check if user already exists
    const existingUser = await getUserByEmail(validatedData.email)
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Create user
    const user = await createUser({
      name: validatedData.name,
      email: validatedData.email,
      password: validatedData.password,
      company: validatedData.company,
      phone: validatedData.phone,
    })

    // Generate token
    const token = generateToken(user.email, 'customer')

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
        phone: user.phone,
        role: user.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      })
    }
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Failed to register user' })
  }
})

// POST /api/users/login - Customer login
usersRouter.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body)

    // Find user
    const user = await getUserByEmail(validatedData.email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' })
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(validatedData.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate token
    const token = generateToken(user.email, 'customer')

    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        company: user.company,
        phone: user.phone,
        role: user.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      })
    }
    console.error('Login error:', error)
    res.status(500).json({ error: 'Failed to authenticate user' })
  }
})

// POST /api/users/verify - Verify token
usersRouter.post('/verify', async (req: Request, res: Response) => {
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

    // Get user details
    const user = await getUserByEmail(decoded.username)
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' })
    }

    res.json({
      valid: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        company: user.company,
        phone: user.phone,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(401).json({ error: 'Token verification failed' })
  }
})

// GET /api/users/me - Get current user (requires authentication)
usersRouter.get('/me', async (req: Request, res: Response) => {
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

    const user = await getUserByEmail(decoded.username)
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' })
    }

    res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      company: user.company,
      phone: user.phone,
      role: user.role,
    })
  } catch (error) {
    res.status(401).json({ error: 'Failed to get user information' })
  }
})
