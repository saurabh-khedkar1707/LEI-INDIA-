import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { verifyToken } from '@/lib/jwt'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('user_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const result = await pgPool.query<{
      id: string
      name: string
      email: string
      company: string | null
      phone: string | null
      role: string
      isActive: boolean
    }>(
      `
      SELECT id, name, email, company, phone, role, "isActive"
      FROM "User"
      WHERE email = $1
      LIMIT 1
      `,
      [decoded.username],
    )

    const user = result.rows[0]

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 },
      )
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company || undefined,
      phone: user.phone || undefined,
      role: user.role,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to get user information' },
      { status: 401 },
    )
  }
}

