import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pgPool } from '@/lib/pg'
import crypto from 'crypto'
import { log } from '@/lib/logger'

const resetRequestSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
})

export async function POST(req: NextRequest) {
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

    // Email service disabled - reset token is generated but email is not sent
    // Admin can provide the reset link to users manually
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
    log.info('Password reset token generated', { 
      email: data.email,
      resetLink,
      expiresAt: expiresAt.toISOString()
    })

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
      // Note: Email service is disabled - reset link is logged for admin reference
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
