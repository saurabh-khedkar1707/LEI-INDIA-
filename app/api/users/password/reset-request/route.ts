import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pgPool } from '@/lib/pg'
import crypto from 'crypto'
import { log } from '@/lib/logger'
import { sendEmail, generatePasswordResetEmail } from '@/lib/email'
import { csrfProtection } from '@/lib/csrf'
import { rateLimit } from '@/lib/rate-limit'

const resetRequestSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
})

export async function POST(req: NextRequest) {
  // CSRF protection
  const csrfResponse = csrfProtection(req)
  if (csrfResponse) {
    return csrfResponse
  }

  // Rate limiting - prevent brute force password reset requests
  const rateLimitResponse = await rateLimit(req, { maxRequests: 5, windowSeconds: 60 })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const json = await req.json()
    const data = resetRequestSchema.parse(json)

    // Find user by email
    const userResult = await pgPool.query<{
      id: string
      email: string
      name: string
    }>(
      `
      SELECT id, email, name
      FROM "User"
      WHERE email = $1 AND "isActive" = true
      LIMIT 1
      `,
      [data.email],
    )

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      })
    }

    const user = userResult.rows[0]

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Token expires in 1 hour

    // Invalidate any existing unused tokens for this user
    await pgPool.query(
      `
      UPDATE "PasswordResetToken"
      SET used = true
      WHERE "userId" = $1 AND used = false
      `,
      [user.id],
    )

    // Create new reset token
    await pgPool.query(
      `
      INSERT INTO "PasswordResetToken" ("userId", token, "expiresAt")
      VALUES ($1, $2, $3)
      `,
      [user.id, resetToken, expiresAt],
    )

    // Send password reset email
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
    const emailContent = generatePasswordResetEmail(resetLink, user.name)
    
    try {
      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      })
      log.info('Password reset email sent', { 
        userId: user.id,
        email: user.email 
      })
    } catch (error: any) {
      log.error('Failed to send password reset email', { 
        userId: user.id,
        email: user.email,
        error: error.message 
      })
      // Still return success to prevent email enumeration
    }

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    })
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors?.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 },
      )
    }

    log.error('Password reset request error', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 },
    )
  }
}
