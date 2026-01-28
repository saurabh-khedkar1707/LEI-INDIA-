import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    return NextResponse.json({
      valid: true,
      user: decoded,
    })
  } catch {
    return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
  }
}

