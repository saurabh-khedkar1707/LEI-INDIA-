import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import bcrypt from 'bcryptjs'
import { generateToken } from '@/lib/jwt'
import { log } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 },
      )
    }

    const result = await pgPool.query<{
      id: string
      username: string
      password: string
      role: string
    }>(
      `
      SELECT id, username, password, role
      FROM "Admin"
      WHERE username = $1
      LIMIT 1
      `,
      [username],
    )

    const admin = result.rows[0]

    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, admin.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Reuse shared JWT helper; treat admin as "admin" or "superadmin" role
    const token = generateToken(admin.username, admin.role as any)

    const response = NextResponse.json({
      user: {
        username: admin.username,
        role: admin.role,
      },
    })

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    })

    return response
  } catch (error) {
    log.error('Admin login error', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to authenticate: ${message}` },
      { status: 500 },
    )
  }
}

