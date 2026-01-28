import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { pgPool } from '@/lib/pg'
import { generateToken } from '@/lib/jwt'

const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const data = loginSchema.parse(json)

    const result = await pgPool.query<{
      id: string
      name: string
      email: string
      password: string
      company: string | null
      phone: string | null
      role: string
      isActive: boolean
    }>(
      `
      SELECT id, name, email, password, company, phone, role, "isActive"
      FROM "User"
      WHERE email = $1
      LIMIT 1
      `,
      [data.email],
    )

    const user = result.rows[0]
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    const valid = await bcrypt.compare(data.password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = generateToken(user.email, 'customer')

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company || undefined,
        phone: user.phone || undefined,
        role: user.role,
      },
    })

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

    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to authenticate user' },
      { status: 500 },
    )
  }
}

