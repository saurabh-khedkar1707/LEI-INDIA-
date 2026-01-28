import { NextRequest, NextResponse } from 'next/server'
import { checkAdmin } from '@/lib/auth-middleware'
import { pgPool } from '@/lib/pg'
import { log } from '@/lib/logger'
import { csrfProtection } from '@/lib/csrf'
import { rateLimit } from '@/lib/rate-limit'

// POST /api/admin/cleanup-tokens - Clean up expired tokens (admin only)
export async function POST(req: NextRequest) {
  // CSRF protection
  const csrfResponse = csrfProtection(req)
  if (csrfResponse) {
    return csrfResponse
  }

  // Rate limiting
  const rateLimitResponse = await rateLimit(req, { maxRequests: 5, windowSeconds: 60 })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const auth = checkAdmin(req)
    if (auth instanceof NextResponse) return auth

    const now = new Date()

    // Clean up expired password reset tokens
    const passwordResetResult = await pgPool.query(
      `DELETE FROM "PasswordResetToken" 
       WHERE "expiresAt" < $1 OR used = TRUE`,
      [now]
    )

    // Clean up expired email verification tokens
    const emailVerificationResult = await pgPool.query(
      `UPDATE "User" 
       SET "emailVerificationToken" = NULL, 
           "emailVerificationTokenExpires" = NULL
       WHERE "emailVerificationTokenExpires" < $1 
         AND "emailVerificationToken" IS NOT NULL`,
      [now]
    )

    const deletedPasswordTokens = passwordResetResult.rowCount || 0
    const deletedEmailTokens = emailVerificationResult.rowCount || 0

    log.info('Token cleanup completed', {
      deletedPasswordTokens,
      deletedEmailTokens,
    })

    return NextResponse.json({
      success: true,
      deletedPasswordTokens,
      deletedEmailTokens,
      message: `Cleaned up ${deletedPasswordTokens} password reset tokens and ${deletedEmailTokens} email verification tokens`,
    })
  } catch (error) {
    log.error('Token cleanup error', error)
    return NextResponse.json(
      { error: 'Failed to cleanup tokens' },
      { status: 500 },
    )
  }
}

// GET /api/admin/cleanup-tokens - Get stats about expired tokens (admin only)
export async function GET(req: NextRequest) {
  try {
    const auth = checkAdmin(req)
    if (auth instanceof NextResponse) return auth

    const now = new Date()

    // Count expired password reset tokens
    const passwordResetCount = await pgPool.query(
      `SELECT COUNT(*) as count 
       FROM "PasswordResetToken" 
       WHERE "expiresAt" < $1 OR used = TRUE`,
      [now]
    )

    // Count expired email verification tokens
    const emailVerificationCount = await pgPool.query(
      `SELECT COUNT(*) as count 
       FROM "User" 
       WHERE "emailVerificationTokenExpires" < $1 
         AND "emailVerificationToken" IS NOT NULL`,
      [now]
    )

    return NextResponse.json({
      expiredPasswordTokens: parseInt(passwordResetCount.rows[0].count, 10),
      expiredEmailTokens: parseInt(emailVerificationCount.rows[0].count, 10),
    })
  } catch (error) {
    log.error('Token cleanup stats error', error)
    return NextResponse.json(
      { error: 'Failed to get token cleanup stats' },
      { status: 500 },
    )
  }
}
