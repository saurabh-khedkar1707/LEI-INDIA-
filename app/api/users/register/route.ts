import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { pgPool } from '@/lib/pg'
import { generateToken } from '@/lib/jwt'
import { log } from '@/lib/logger'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  company: z.string().min(2, 'Company name is required').trim().optional(),
  phone: z.string().min(10, 'Please enter a valid phone number').trim().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const data = registerSchema.parse(json)

    const existing = await pgPool.query(
      `SELECT 1 FROM "User" WHERE email = $1 LIMIT 1`,
      [data.email],
    )
    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Token expires in 7 days

    const inserted = await pgPool.query<{
      id: string
      name: string
      email: string
      company: string | null
      phone: string | null
      role: string
    }>(
      `
      INSERT INTO "User" (
        name, email, password, company, phone, role, "isActive",
        "emailVerified", "emailVerificationToken", "emailVerificationTokenExpires"
      )
      VALUES ($1, $2, $3, $4, $5, 'customer', true, false, $6, $7)
      RETURNING id, name, email, company, phone, role
      `,
      [
        data.name,
        data.email,
        passwordHash,
        data.company ?? null,
        data.phone ?? null,
        verificationToken,
        expiresAt,
      ],
    )

    const user = inserted.rows[0]

    // Email service disabled - verification token is generated but email is not sent
    // Users can verify via the verify-email page with the token
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`
    log.info('User registered - verification token generated', { 
      userId: user.id, 
      email: user.email,
      verificationLink 
    })

    const token = generateToken(user.email, 'customer')

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          company: user.company || undefined,
          phone: user.phone || undefined,
          role: user.role,
        },
        message: 'Registration successful. Please check your email to verify your account.',
        requiresVerification: true,
      },
      { status: 201 },
    )

    response.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
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

    log.error('Registration error', error)
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 },
    )
  }
}

