import { NextRequest, NextResponse } from 'next/server'
import { log } from './logger'
import { getRedisClient, isRedisConnected } from './redis'

// Common interface for rate limiters
interface RateLimiter {
  limit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }>
}

// In-memory rate limiter implementation (fallback when Redis is unavailable)
class InMemoryRateLimiter implements RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(maxRequests: number, windowSeconds: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowSeconds * 1000
  }

  async limit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now()
    const key = identifier
    const requests = this.requests.get(key) || []

    // Remove requests outside the window
    const validRequests = requests.filter((timestamp) => now - timestamp < this.windowMs)

    if (validRequests.length >= this.maxRequests) {
      const oldestRequest = validRequests[0]
      const reset = oldestRequest + this.windowMs
      this.requests.set(key, validRequests)
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: Math.ceil(reset / 1000),
      }
    }

    // Add current request
    validRequests.push(now)
    this.requests.set(key, validRequests)

    // Cleanup old entries periodically (every 1000 requests)
    if (Math.random() < 0.001) {
      this.cleanup(now)
    }

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - validRequests.length,
      reset: Math.ceil((now + this.windowMs) / 1000),
    }
  }

  private cleanup(now: number): void {
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter((timestamp) => now - timestamp < this.windowMs)
      if (validRequests.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, validRequests)
      }
    }
  }
}

// Redis-based rate limiter using sliding window algorithm
class RedisRateLimiter implements RateLimiter {
  private readonly maxRequests: number
  private readonly windowSeconds: number

  constructor(maxRequests: number, windowSeconds: number) {
    this.maxRequests = maxRequests
    this.windowSeconds = windowSeconds
  }

  async limit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const redis = getRedisClient()
    if (!redis || !isRedisConnected()) {
      // Fallback to in-memory if Redis is unavailable
      const fallback = new InMemoryRateLimiter(this.maxRequests, this.windowSeconds)
      return fallback.limit(identifier)
    }

    const now = Date.now()
    const key = `rate_limit:${identifier}`
    const windowStart = now - this.windowSeconds * 1000

    try {
      // Use Redis sorted set for sliding window
      // Score = timestamp, Member = unique request ID
      const pipeline = redis.pipeline()
      
      // Remove old entries outside the window
      pipeline.zremrangebyscore(key, 0, windowStart)
      
      // Count current requests in window
      pipeline.zcard(key)
      
      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`)
      
      // Set expiration on the key
      pipeline.expire(key, this.windowSeconds)
      
      const results = await pipeline.exec()
      
      if (!results || results.length < 2) {
        // Fallback on error
        const fallback = new InMemoryRateLimiter(this.maxRequests, this.windowSeconds)
        return fallback.limit(identifier)
      }

      const currentCount = results[1][1] as number
      const reset = Math.ceil((now + this.windowSeconds * 1000) / 1000)

      if (currentCount >= this.maxRequests) {
        return {
          success: false,
          limit: this.maxRequests,
          remaining: 0,
          reset,
        }
      }

      return {
        success: true,
        limit: this.maxRequests,
        remaining: Math.max(0, this.maxRequests - currentCount - 1),
        reset,
      }
    } catch (error) {
      log.error('Redis rate limit error', error)
      // Fallback to in-memory on error
      const fallback = new InMemoryRateLimiter(this.maxRequests, this.windowSeconds)
      return fallback.limit(identifier)
    }
  }
}

// Create rate limiters (Redis with in-memory fallback)
// These will automatically use Redis if available, otherwise fall back to in-memory
const authRateLimiter = new RedisRateLimiter(5, 60) // 5 requests per minute for auth endpoints
const apiRateLimiter = new RedisRateLimiter(100, 60) // 100 requests per minute for general API
const adminRateLimiter = new RedisRateLimiter(200, 60) // 200 requests per minute for admin endpoints

export type RateLimitConfig = {
  maxRequests?: number
  windowSeconds?: number
  identifier?: (req: NextRequest) => string
}

/**
 * Get identifier for rate limiting (IP address or user ID)
 */
function getIdentifier(req: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }
  
  // Try to get IP from various headers (for proxy/load balancer scenarios)
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  return `ip:${ip}`
}

/**
 * Rate limit middleware
 * Returns null if rate limit is OK, or a NextResponse with 429 if rate limited
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = {},
): Promise<NextResponse | null> {
  const {
    maxRequests = 100,
    windowSeconds = 60,
    identifier,
  } = config

  // Determine which rate limiter to use based on endpoint
  const pathname = req.nextUrl.pathname
  
  let limiter: RateLimiter
  if (pathname.includes('/login') || pathname.includes('/register') || pathname.includes('/reset-password')) {
    limiter = authRateLimiter
  } else if (pathname.includes('/admin')) {
    limiter = adminRateLimiter
  } else {
    limiter = apiRateLimiter
  }

  // Get identifier
  const id = identifier ? identifier(req) : getIdentifier(req)

  // Check rate limit
  const result = await limiter.limit(id)

  if (!result.success) {
    log.warn('Rate limit exceeded', { identifier: id, pathname, limit: result.limit })
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again after ${new Date(result.reset * 1000).toISOString()}`,
        retryAfter: result.reset,
      },
      {
        status: 429,
        headers: {
          'Retry-After': result.reset.toString(),
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
        },
      },
    )
  }

  return null
}
