import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({ message: 'Logged out successfully' })

    // Clear the user_token cookie
    response.cookies.set('user_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    })

    return response
  } catch (error) {
    log.error('Logout error', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 },
    )
  }
}
