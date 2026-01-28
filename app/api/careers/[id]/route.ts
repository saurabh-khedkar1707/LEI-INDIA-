import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

// GET /api/careers/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const career = await prisma.career.findUnique({
      where: { id: params.id },
    })
    if (!career) {
      return NextResponse.json({ error: 'Career not found' }, { status: 404 })
    }

    const authHeader = req.headers.get('authorization')
    if (!career.active) {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Career not found' }, { status: 404 })
      }
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)
      if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
        return NextResponse.json({ error: 'Career not found' }, { status: 404 })
      }
    }

    return NextResponse.json(career)
  } catch (error) {
    console.error('Failed to fetch career:', error)
    return NextResponse.json(
      { error: 'Failed to fetch career' },
      { status: 500 },
    )
  }
}

