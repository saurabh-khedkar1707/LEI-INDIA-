import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { requireAdmin } from '@/lib/auth-middleware'
import { technicalDetailsSchema } from '@/lib/cms-validation'
import { rateLimit } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'
import { sanitizeRichText } from '@/lib/sanitize'
import { log } from '@/lib/logger'

// GET /api/technical-details - public
export async function GET(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    const tab = searchParams.get('tab') as 'sales' | 'technical' | null

    let query = `
      SELECT id, "productId", tab, title, content, "displayOrder", "createdAt", "updatedAt"
      FROM "TechnicalDetails"
      WHERE 1=1
    `
    const values: any[] = []
    let paramIndex = 1

    if (productId) {
      const { isValidUUID } = await import('@/lib/validation')
      if (isValidUUID(productId)) {
        query += ` AND "productId" = $${paramIndex}`
        values.push(productId)
        paramIndex++
      }
    }

    if (tab && (tab === 'sales' || tab === 'technical')) {
      query += ` AND tab = $${paramIndex}`
      values.push(tab)
      paramIndex++
    }

    query += ` ORDER BY "displayOrder" ASC, "createdAt" ASC`

    const result = await pgPool.query(query, values)
    return NextResponse.json(result.rows)
  } catch (error: any) {
    log.error('Failed to fetch technical details', error)
    
    // Check if table doesn't exist (migration not run)
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: 'Database table not found',
          message: 'The TechnicalDetails table does not exist. Please run the migration: prisma/migrate-add-cms-content.sql',
          code: 'MIGRATION_REQUIRED'
        },
        { status: 500 },
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch technical details',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 },
    )
  }
}

// POST /api/technical-details - create (admin-only)
export const POST = requireAdmin(async (req: NextRequest) => {
  const csrfResponse = csrfProtection(req)
  if (csrfResponse) {
    return csrfResponse
  }

  const rateLimitResponse = await rateLimit(req, { maxRequests: 20, windowSeconds: 60 })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await req.json()
    const parsed = technicalDetailsSchema.parse(body)

    // Validate productId if provided
    if (parsed.productId) {
      const { isValidUUID } = await import('@/lib/validation')
      if (!isValidUUID(parsed.productId)) {
        return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 })
      }

      // Verify product exists
      const productCheck = await pgPool.query(
        `SELECT id FROM "Product" WHERE id = $1 LIMIT 1`,
        [parsed.productId],
      )
      if (productCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
    }

    const sanitizedContent = parsed.content ? sanitizeRichText(parsed.content) : null

    const result = await pgPool.query(
      `
      INSERT INTO "TechnicalDetails" (
        "productId", tab, title, content, "displayOrder", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, "productId", tab, title, content, "displayOrder", "createdAt", "updatedAt"
      `,
      [
        parsed.productId || null,
        parsed.tab,
        parsed.title || null,
        sanitizedContent,
        parsed.displayOrder,
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

    log.error('Failed to create technical details', error)
    return NextResponse.json(
      { error: 'Failed to create technical details' },
      { status: 500 },
    )
  }
})
