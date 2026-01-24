import rateLimit from 'express-rate-limit'

/**
 * Rate Limiting Middleware
 * 
 * IMPORTANT: PRODUCTION CLUSTER MODE LIMITATION
 * =============================================
 * express-rate-limit uses in-memory storage by default, which will NOT work correctly
 * in PM2 cluster mode or multi-instance deployments. Each process maintains its own
 * separate rate limit counter, allowing users to bypass limits by hitting different
 * instances.
 * 
 * For production deployments with PM2 cluster mode:
 * - Use Redis store: `new rateLimit({ store: new RedisStore({ client: redisClient }) })`
 * - Install: `npm install rate-limit-redis`
 * - Or use a database-backed rate limiter
 * 
 * Example Redis implementation:
 * ```typescript
 * import RedisStore from 'rate-limit-redis';
 * import Redis from 'ioredis';
 * 
 * const redisClient = new Redis(process.env.REDIS_URL);
 * 
 * export const apiLimiter = rateLimit({
 *   store: new RedisStore({
 *     client: redisClient,
 *     prefix: 'rl:api:',
 *   }),
 *   windowMs: 15 * 60 * 1000,
 *   max: 10000,
 * });
 * ```
 * 
 * Current implementation is suitable for:
 * - Development
 * - Single-instance production deployments
 * - Testing environments
 */

// General API rate limiter - Increased limits to avoid blocking normal usage
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Limit each IP to 10,000 requests per windowMs (very high limit)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Strict rate limiter for authentication endpoints - Increased limits
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs (increased from 5)
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
})

// Rate limiter for form submissions - Increased limits
export const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Limit each IP to 1,000 form submissions per hour (increased from 10)
  message: 'Too many form submissions, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})
