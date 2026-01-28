import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { categoryUpdateSchema } from '@/lib/category-validation'
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

// GET /api/categories/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 })
  }
}

// PUT /api/categories/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const authError = requireAdmin(req)
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status })
  }

  try {
    const body = await req.json()
    const parsed = categoryUpdateSchema.parse(body)

    const existing = await prisma.category.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: parsed.name ?? existing.name,
        slug: parsed.slug ?? existing.slug,
        description:
          parsed.description !== undefined ? parsed.description || null : existing.description,
        image: parsed.image !== undefined ? parsed.image || null : existing.image,
        parentId: parsed.parentId !== undefined ? parsed.parentId || null : existing.parentId,
      },
    })

    return NextResponse.json(updated)
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

    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 400 })
  }
}

// DELETE /api/categories/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const authError = requireAdmin(req)
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status })
  }

  try {
    const existing = await prisma.category.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    await prisma.category.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}

