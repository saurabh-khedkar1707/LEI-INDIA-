import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

// GET /api/careers - public active careers or all careers for admin
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    let where: any = { active: true }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)
      if (decoded && (decoded.role === 'admin' || decoded.role === 'superadmin')) {
        where = {}
      }
    }

    const careers = await prisma.career.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(careers)
  } catch (error) {
    console.error('Failed to fetch careers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch careers' },
      { status: 500 },
    )
  }
}

