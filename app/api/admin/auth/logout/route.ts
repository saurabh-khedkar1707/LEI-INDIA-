import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({ message: 'Logged out successfully' })

    // Clear the admin_token cookie
    response.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    })

    return response
  } catch (error) {
    log.error('Admin logout error', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 },
    )
  }
}
