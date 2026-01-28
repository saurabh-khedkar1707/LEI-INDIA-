import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/resources - public
export async function GET(_req: NextRequest) {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(resources)
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 },
    )
  }
}

