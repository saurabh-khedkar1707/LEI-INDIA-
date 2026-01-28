import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { categorySchema } from '@/lib/category-validation'
import { verifyToken } from '@/lib/jwt'

function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  const decoded = token ? verifyToken(token) : null

  if (!decoded) {
    return { error: 'Authentication required', status: 401 }
  }

  if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
    return { error: 'Forbidden', status: 403 }
  }

  return null
}

// GET /api/categories - public list of categories
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50))
    const skip = (page - 1) * limit

    const search = searchParams.get('search')

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const total = await prisma.category.count({ where })
    const categories = await prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST /api/categories - create category (admin only)
export async function POST(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status })
  }

  try {
    const body = await req.json()
    const parsed = categorySchema.parse(body)

    const category = await prisma.category.create({
      data: {
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description || null,
        image: parsed.image || null,
        parentId: parsed.parentId || null,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors?.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 },
      )
    }

    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 400 })
  }
}

