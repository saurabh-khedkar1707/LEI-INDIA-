import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leiindias'

let cachedConnection: typeof mongoose | null = null
let connectionAttempts = 0
const MAX_RETRIES = 5
const RETRY_DELAY = 5000 // 5 seconds

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function connectDatabase(retryCount: number = 0): Promise<typeof mongoose> {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection
  }

  try {
    const connection = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    })
    
    // Set up connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err)
      cachedConnection = null
    })
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected')
      cachedConnection = null
    })
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected')
    })
    
    console.log('✅ Connected to MongoDB')
    cachedConnection = connection
    connectionAttempts = 0
    return connection
  } catch (error) {
    connectionAttempts++
    console.error(`❌ MongoDB connection error (attempt ${connectionAttempts}/${MAX_RETRIES}):`, error)
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection in ${RETRY_DELAY / 1000} seconds...`)
      await sleep(RETRY_DELAY)
      return connectDatabase(retryCount + 1)
    }
    
    // In production, fail fast
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ CRITICAL: Failed to connect to MongoDB after all retries. Exiting...')
      process.exit(1)
    }
    
    throw error
  }
}

export async function disconnectDatabase() {
  if (cachedConnection) {
    await mongoose.disconnect()
    cachedConnection = null
    console.log('Disconnected from MongoDB')
  }
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1
}
