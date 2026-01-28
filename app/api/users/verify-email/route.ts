import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import crypto from 'crypto'
import { log } from '@/lib/logger'

// GET /api/users/verify-email?token=... - verify email with token
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 },
      )
    }

    // Find user with matching verification token
    const userResult = await pgPool.query<{
      id: string
      email: string
      emailVerificationToken: string | null
      emailVerificationTokenExpires: Date | null
      emailVerified: boolean
    }>(
      `
      SELECT id, email, "emailVerificationToken", "emailVerificationTokenExpires", "emailVerified"
      FROM "User"
      WHERE "emailVerificationToken" = $1
      LIMIT 1
      `,
      [token],
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 },
      )
    }

    const user = userResult.rows[0]

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Email is already verified',
        verified: true,
      })
    }

    // Check if token is expired
    if (
      user.emailVerificationTokenExpires &&
      new Date() > new Date(user.emailVerificationTokenExpires)
    ) {
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 },
      )
    }

    // Verify the email
    await pgPool.query(
      `
      UPDATE "User"
      SET "emailVerified" = true,
          "emailVerificationToken" = NULL,
          "emailVerificationTokenExpires" = NULL,
          "updatedAt" = NOW()
      WHERE id = $1
      `,
      [user.id],
    )

    return NextResponse.json({
      message: 'Email verified successfully',
      verified: true,
    })
  } catch (error) {
    log.error('Email verification error', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 },
    )
  }
}

// POST /api/users/verify-email/resend - resend verification email
export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const { email } = json

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 },
      )
    }

    // Find user
    const userResult = await pgPool.query<{
      id: string
      email: string
      name: string
      emailVerified: boolean
    }>(
      `
      SELECT id, email, name, "emailVerified"
      FROM "User"
      WHERE email = $1 AND "isActive" = true
      LIMIT 1
      `,
      [email.toLowerCase().trim()],
    )

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      return NextResponse.json({
        message: 'If an account exists with this email, a verification link has been sent.',
      })
    }

    const user = userResult.rows[0]

    // If already verified, return success without sending
    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Email is already verified',
      })
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Token expires in 7 days

    // Update user with new token
    await pgPool.query(
      `
      UPDATE "User"
      SET "emailVerificationToken" = $1,
          "emailVerificationTokenExpires" = $2,
          "updatedAt" = NOW()
      WHERE id = $3
      `,
      [verificationToken, expiresAt, user.id],
    )

    // Email service disabled - verification token is generated but email is not sent
    // Admin can provide the verification link to users manually
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`
    log.info('Verification email resend - token generated', { 
      email: email.toLowerCase().trim(),
      verificationLink,
      expiresAt: expiresAt.toISOString()
    })

    return NextResponse.json({
      message: 'If an account exists with this email, a verification link has been sent.',
      // Note: Email service is disabled - verification link is logged for admin reference
    })
  } catch (error) {
    log.error('Resend verification email error', error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 },
    )
  }
}
