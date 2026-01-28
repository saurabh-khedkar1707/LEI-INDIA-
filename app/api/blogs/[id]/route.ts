import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

// GET /api/blogs/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id: params.id },
    })
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    const authHeader = req.headers.get('authorization')
    if (!blog.published) {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
      }
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)
      if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
        return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
      }
    }

    return NextResponse.json(blog)
  } catch (error) {
    console.error('Failed to fetch blog:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog' },
      { status: 500 },
    )
  }
}

