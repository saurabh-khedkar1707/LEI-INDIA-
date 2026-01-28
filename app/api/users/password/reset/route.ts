import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { pgPool } from '@/lib/pg'
import { log } from '@/lib/logger'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const data = resetPasswordSchema.parse(json)

    // Find valid reset token
    const tokenResult = await pgPool.query<{
      id: string
      userId: string
      expiresAt: Date
      used: boolean
    }>(
      `
      SELECT id, "userId", "expiresAt", used
      FROM "PasswordResetToken"
      WHERE token = $1
      LIMIT 1
      `,
      [data.token],
    )

    if (tokenResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 },
      )
    }

    const resetToken = tokenResult.rows[0]

    // Check if token is expired or already used
    if (resetToken.used || new Date() > new Date(resetToken.expiresAt)) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 },
      )
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(data.password, 10)

    // Update user password
    await pgPool.query(
      `
      UPDATE "User"
      SET password = $1, "updatedAt" = NOW()
      WHERE id = $2
      `,
      [passwordHash, resetToken.userId],
    )

    // Mark token as used
    await pgPool.query(
      `
      UPDATE "PasswordResetToken"
      SET used = true
      WHERE id = $1
      `,
      [resetToken.id],
    )

    return NextResponse.json({
      message: 'Password has been reset successfully',
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

    log.error('Password reset error', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 },
    )
  }
}
