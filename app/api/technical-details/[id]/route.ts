import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { technicalDetailsSchema } from '@/lib/cms-validation'
import { rateLimit } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'
import { sanitizeRichText } from '@/lib/sanitize'
import { log } from '@/lib/logger'
import { checkAdmin } from '@/lib/auth-middleware'

// GET /api/technical-details/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const rateLimitResponse = await rateLimit(req)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { isValidUUID } = await import('@/lib/validation')
    if (!isValidUUID(params.id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const result = await pgPool.query(
      `
      SELECT id, "productId", tab, title, content, "displayOrder", "createdAt", "updatedAt"
      FROM "TechnicalDetails"
      WHERE id = $1
      `,
      [params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    log.error('Failed to fetch technical details', error)
    return NextResponse.json(
      { error: 'Failed to fetch technical details' },
      { status: 500 },
    )
  }
}

// PUT /api/technical-details/:id - update (admin-only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const csrfResponse = csrfProtection(req)
  if (csrfResponse) {
    return csrfResponse
  }

  const rateLimitResponse = await rateLimit(req, { maxRequests: 20, windowSeconds: 60 })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const auth = checkAdmin(req)
    if (auth instanceof NextResponse) return auth

    const { isValidUUID } = await import('@/lib/validation')
    if (!isValidUUID(params.id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = technicalDetailsSchema.parse(body)

    // Validate productId if provided
    if (parsed.productId) {
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
      UPDATE "TechnicalDetails"
      SET
        "productId" = $1,
        tab = $2,
        title = $3,
        content = $4,
        "displayOrder" = $5,
        "updatedAt" = NOW()
      WHERE id = $6
      RETURNING id, "productId", tab, title, content, "displayOrder", "createdAt", "updatedAt"
      `,
      [
        parsed.productId || null,
        parsed.tab,
        parsed.title || null,
        sanitizedContent,
        parsed.displayOrder,
        params.id,
      ],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
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

    log.error('Failed to update technical details', error)
    return NextResponse.json(
      { error: 'Failed to update technical details' },
      { status: 500 },
    )
  }
}

// DELETE /api/technical-details/:id - delete (admin-only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const csrfResponse = csrfProtection(req)
  if (csrfResponse) {
    return csrfResponse
  }

  const rateLimitResponse = await rateLimit(req, { maxRequests: 20, windowSeconds: 60 })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const auth = checkAdmin(req)
    if (auth instanceof NextResponse) return auth

    const { isValidUUID } = await import('@/lib/validation')
    if (!isValidUUID(params.id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const result = await pgPool.query(
      `DELETE FROM "TechnicalDetails" WHERE id = $1 RETURNING id`,
      [params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    log.error('Failed to delete technical details', error)
    return NextResponse.json(
      { error: 'Failed to delete technical details' },
      { status: 500 },
    )
  }
}
