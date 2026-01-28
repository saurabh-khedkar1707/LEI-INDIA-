import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { categorySchema } from '@/lib/category-validation'
import { requireAdmin } from '@/lib/auth-middleware'
import { log } from '@/lib/logger'

// GET /api/categories - public list of categories
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50))
    const skip = (page - 1) * limit

    const search = searchParams.get('search')

    const values: any[] = []
    let whereClause = ''
    if (search) {
      values.push(`%${search}%`)
      values.push(`%${search}%`)
      values.push(`%${search}%`)
      whereClause = `
        WHERE
          name ILIKE $1
          OR slug ILIKE $2
          OR description ILIKE $3
      `
    }

    const countResult = await pgPool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM "Category"
      ${whereClause}
      `,
      values,
    )
    const total: number = countResult.rows[0]?.total ?? 0

    const dataValues = [...values, limit, skip]
    const categoriesResult = await pgPool.query(
      `
      SELECT id, name, slug, description, image, "parentId", "createdAt", "updatedAt"
      FROM "Category"
      ${whereClause}
      ORDER BY "createdAt" ASC
      LIMIT $${dataValues.length - 1}
      OFFSET $${dataValues.length}
      `,
      dataValues,
    )
    const categories = categoriesResult.rows

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
    log.error('Error fetching categories', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST /api/categories - create category (admin only)
export const POST = requireAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = categorySchema.parse(body)

    const result = await pgPool.query(
      `
      INSERT INTO "Category" (
        name, slug, description, image, "parentId", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, name, slug, description, image, "parentId", "createdAt", "updatedAt"
      `,
      [
        parsed.name,
        parsed.slug,
        parsed.description ?? null,
        parsed.image ?? null,
        parsed.parentId ?? null,
      ],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
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

    log.error('Error creating category', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 400 })
  }
})

