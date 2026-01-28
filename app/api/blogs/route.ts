import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

// GET /api/blogs - public (published only) or all for admin
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    let where: any = { published: true }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)
      if (decoded && (decoded.role === 'admin' || decoded.role === 'superadmin')) {
        where = {}
      }
    }

    const blogs = await prisma.blog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(blogs)
  } catch (error) {
    console.error('Failed to fetch blogs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
      { status: 500 },
    )
  }
}

