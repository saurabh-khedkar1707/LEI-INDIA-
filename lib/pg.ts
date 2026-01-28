import { Pool, PoolClient } from 'pg'
import { DATABASE_URL, NODE_ENV } from './env-validation'
import { log } from './logger'

// Retry configuration
const MAX_RETRIES = 5
const INITIAL_RETRY_DELAY = 1000 // 1 second
const MAX_RETRY_DELAY = 30000 // 30 seconds

/**
 * Exponential backoff delay calculation
 */
function getRetryDelay(attempt: number): number {
  const delay = Math.min(
    INITIAL_RETRY_DELAY * Math.pow(2, attempt),
    MAX_RETRY_DELAY,
  )
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay
  return delay + jitter
}

/**
 * Retry a database operation with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error as Error

      // Don't retry on certain errors (e.g., syntax errors, constraint violations)
      if (
        error?.code === '23505' || // Unique violation
        error?.code === '23503' || // Foreign key violation
        error?.code === '42P01' || // Undefined table
        error?.code === '42703' || // Undefined column
        error?.code === '42601'    // Syntax error
      ) {
        log.error(`Database error (non-retryable): ${operationName}`, error)
        throw error
      }

      // Check if it's a connection error
      const isConnectionError =
        error?.code === 'ECONNREFUSED' ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ENOTFOUND' ||
        error?.message?.includes('connection') ||
        error?.message?.includes('timeout')

      if (!isConnectionError || attempt === maxRetries) {
        log.error(`Database error: ${operationName}`, error)
        throw error
      }

      const delay = getRetryDelay(attempt)
      log.warn(
        `Database connection failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms: ${operationName}`,
        { error: error.message },
      )

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  log.error(`Database operation failed after ${maxRetries + 1} attempts: ${operationName}`, lastError)
  throw lastError || new Error(`Database operation failed: ${operationName}`)
}

/**
 * Test database connection with retry logic
 */
async function testConnection(): Promise<boolean> {
  try {
    await retryWithBackoff(
      async () => {
        const client = await pgPool.connect()
        try {
          await client.query('SELECT 1')
          return true
        } finally {
          client.release()
        }
      },
      'connection test',
      3, // Fewer retries for initial connection test
    )
    log.info('Database connection established successfully')
    return true
  } catch (error) {
    log.error('Failed to establish database connection after retries', error)
    return false
  }
}

// Shared Postgres connection pool for the entire app
export const pgPool = new Pool({
  connectionString: DATABASE_URL,
  // SSL Configuration:
  // - For managed Postgres (AWS RDS, Heroku, etc.): Use proper CA certificates
  // - For self-hosted with valid certificates: Set rejectUnauthorized: true with ca option
  // - Current setting (rejectUnauthorized: false) is for development/testing only
  // TODO: In production, use proper SSL certificates:
  //   ssl: { rejectUnauthorized: true, ca: fs.readFileSync('/path/to/ca-cert.pem') }
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 20, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
})

// Handle pool errors
pgPool.on('error', (err) => {
  log.error('Unexpected error on idle client', err)
})

pgPool.on('connect', () => {
  log.debug('New database connection established')
})

// Test connection on startup (non-blocking)
if (typeof window === 'undefined') {
  // Only run on server side
  testConnection().catch((error) => {
    log.error('Initial database connection test failed', error)
  })
}

/**
 * Execute a query with retry logic
 * Use this wrapper for critical queries that need retry on connection failures
 */
export async function queryWithRetry<T = any>(
  queryText: string,
  values?: any[],
  operationName: string = 'query',
): Promise<{ rows: T[]; rowCount: number }> {
  return retryWithBackoff(
    async () => {
      return await pgPool.query<T>(queryText, values)
    },
    operationName,
  )
}

/**
 * Get a client from the pool with retry logic
 */
export async function getClientWithRetry(
  operationName: string = 'get client',
): Promise<PoolClient> {
  return retryWithBackoff(
    async () => {
      return await pgPool.connect()
    },
    operationName,
  )
}
