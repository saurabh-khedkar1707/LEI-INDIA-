import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { categoryUpdateSchema } from '@/lib/category-validation'
import { checkAdmin } from '@/lib/auth-middleware'
import { log } from '@/lib/logger'
import { csrfProtection } from '@/lib/csrf'
import { rateLimit } from '@/lib/rate-limit'

// GET /api/categories/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const result = await pgPool.query(
      `
      SELECT id, name, slug, description, image, "parentId", "createdAt", "updatedAt"
      FROM "Category"
      WHERE id = $1
      LIMIT 1
      `,
      [params.id],
    )
    const category = result.rows[0]

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    log.error('Error fetching category', error)
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 })
  }
}

// PUT /api/categories/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // CSRF protection
  const csrfResponse = csrfProtection(req)
  if (csrfResponse) {
    return csrfResponse
  }

  // Rate limiting
  const rateLimitResponse = await rateLimit(req, { maxRequests: 20, windowSeconds: 60 })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const auth = checkAdmin(req)
    if (auth instanceof NextResponse) return auth
    const body = await req.json()
    const parsed = categoryUpdateSchema.parse(body)

    const existingResult = await pgPool.query(
      `
      SELECT id, name, slug, description, image, "parentId"
      FROM "Category"
      WHERE id = $1
      LIMIT 1
      `,
      [params.id],
    )
    const existing = existingResult.rows[0]
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const updatedResult = await pgPool.query(
      `
      UPDATE "Category"
      SET
        name = $1,
        slug = $2,
        description = $3,
        image = $4,
        "parentId" = $5,
        "updatedAt" = NOW()
      WHERE id = $6
      RETURNING id, name, slug, description, image, "parentId", "createdAt", "updatedAt"
      `,
      [
        parsed.name ?? existing.name,
        parsed.slug ?? existing.slug,
        parsed.description !== undefined ? parsed.description || null : existing.description,
        parsed.image !== undefined ? parsed.image || null : existing.image,
        parsed.parentId !== undefined ? parsed.parentId || null : existing.parentId,
        params.id,
      ],
    )

    return NextResponse.json(updatedResult.rows[0])
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

    log.error('Error updating category', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 400 })
  }
}

// DELETE /api/categories/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // CSRF protection
  const csrfResponse = csrfProtection(req)
  if (csrfResponse) {
    return csrfResponse
  }

  // Rate limiting
  const rateLimitResponse = await rateLimit(req, { maxRequests: 20, windowSeconds: 60 })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const auth = checkAdmin(req)
    if (auth instanceof NextResponse) return auth
    const existingResult = await pgPool.query(
      `
      SELECT id
      FROM "Category"
      WHERE id = $1
      LIMIT 1
      `,
      [params.id],
    )
    const existing = existingResult.rows[0]
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    await pgPool.query(
      `
      DELETE FROM "Category"
      WHERE id = $1
      `,
      [params.id],
    )
    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    log.error('Error deleting category', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}

