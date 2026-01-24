import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
import { productsRouter } from './routes/products.js'
import { ordersRouter } from './routes/orders.js'
import { inquiriesRouter } from './routes/inquiries.js'
import { resourcesRouter } from './routes/resources.js'
import { blogsRouter } from './routes/blogs.js'
import { careersRouter } from './routes/careers.js'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import { uploadRouter } from './routes/upload.js'
import { contactInfoRouter } from './routes/contact-info.js'
import { initializeDefaultAdmin } from './utils/auth.js'
import { connectDatabase, disconnectDatabase, isDatabaseConnected } from './utils/database.js'
import { apiLimiter, formLimiter, authLimiter } from './middleware/rate-limit.js'
import { sanitizeBody, sanitizeQuery } from './middleware/sanitize.js'
import { requestTimeout } from './middleware/timeout.js'
import { csrfProtection } from './middleware/csrf.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { requestLogger } from './middleware/request-logger.js'

const app = express()
const PORT = process.env.PORT || 3001

// Check for required environment variables
if (!process.env.JWT_SECRET) {
  console.error('\n❌ ERROR: JWT_SECRET is not configured!')
  console.error('   Please create a .env file in the backend directory with:')
  console.error('   JWT_SECRET=your-secret-here')
  console.error('   Generate a secret: openssl rand -base64 32\n')
  if (process.env.NODE_ENV === 'production') {
    process.exit(1)
  } else {
    console.warn('   ⚠️  Continuing in development mode, but authentication will fail!\n')
  }
}

// Connect to MongoDB with proper error handling
async function initializeServer() {
  try {
    await connectDatabase()
    console.log('✅ Database connection established')
  } catch (error) {
    console.error('❌ CRITICAL: Failed to connect to database:', error)
    if (process.env.NODE_ENV === 'production') {
      console.error('Exiting in production mode due to database connection failure')
      process.exit(1)
    } else {
      console.warn('⚠️  Continuing in development mode, but database operations will fail')
    }
  }

  // Initialize default admin user on startup
  try {
    await initializeDefaultAdmin()
  } catch (error) {
    console.error('⚠️  Failed to initialize default admin:', error)
    // Don't exit on admin init failure, just log it
  }
}

initializeServer()

// Validate CORS configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.error('❌ ERROR: FRONTEND_URL is not configured in production!')
  console.error('   Please set FRONTEND_URL environment variable')
  process.exit(1)
}

// Trust proxy for accurate IP addresses (important for CSRF token session IDs)
app.set('trust proxy', true)

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Idempotency-Key'],
  exposedHeaders: ['X-CSRF-Token'],
}))

// Request logging (should be early in middleware chain)
app.use(requestLogger)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(sanitizeBody)
app.use(sanitizeQuery)

// Apply request timeout (30 seconds)
app.use(requestTimeout(30000))

// Apply general rate limiting
app.use('/api', apiLimiter)

// Apply CSRF protection to state-changing routes
app.use('/api', csrfProtection)

// Security headers
app.use((req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy (adjust as needed)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    )
  }
  
  next()
})

// Routes
app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/inquiries', inquiriesRouter)
app.use('/api/resources', resourcesRouter)
app.use('/api/blogs', blogsRouter)
app.use('/api/careers', careersRouter)
app.use('/api/contact-info', contactInfoRouter)
app.use('/api/users', usersRouter)
app.use('/api/admin/auth', authRouter)
app.use('/api/admin/upload', uploadRouter)

// Serve uploaded files
app.use('/uploads', express.static(join(__dirname, '../uploads')))

// 404 handler (must be after all routes)
app.use(notFoundHandler)

// Error handler (must be last)
app.use(errorHandler)

// Health check with database connectivity
app.get('/health', async (req, res) => {
  const dbConnected = isDatabaseConnected()
  const status = dbConnected ? 'healthy' : 'unhealthy'
  const statusCode = dbConnected ? 200 : 503
  
  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
  })
})

// Readiness probe (for Kubernetes/Docker)
app.get('/ready', async (req, res) => {
  const dbConnected = isDatabaseConnected()
  if (dbConnected) {
    res.status(200).json({ ready: true })
  } else {
    res.status(503).json({ ready: false, reason: 'Database not connected' })
  }
})

const server = app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`)
})

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`)
    console.error(`   To free the port, run: lsof -ti:${PORT} | xargs kill -9`)
    console.error(`   Or use a different port by setting PORT environment variable\n`)
    process.exit(1)
  } else {
    throw error
  }
})

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`)
  
  server.close(() => {
    console.log('✅ HTTP server closed')
    disconnectDatabase()
      .then(() => {
        console.log('✅ Database disconnected')
        process.exit(0)
      })
      .catch((error) => {
        console.error('❌ Error during shutdown:', error)
        process.exit(1)
      })
  })
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout')
    process.exit(1)
  }, 30000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
