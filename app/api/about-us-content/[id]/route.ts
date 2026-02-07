import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { aboutUsContentSchema } from '@/lib/cms-validation'
import { rateLimit } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'
import { sanitizeRichText } from '@/lib/sanitize'
import { log } from '@/lib/logger'
import { checkAdmin } from '@/lib/auth-middleware'

// GET /api/about-us-content/:id
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
      SELECT id, section, title, content, "displayOrder", "createdAt", "updatedAt"
      FROM "AboutUsContent"
      WHERE id = $1
      `,
      [params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    log.error('Failed to fetch about us content', error)
    return NextResponse.json(
      { error: 'Failed to fetch about us content' },
      { status: 500 },
    )
  }
}

// PUT /api/about-us-content/:id - update (admin-only)
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
    const parsed = aboutUsContentSchema.parse(body)

    // Check if section already exists for another record
    const existing = await pgPool.query(
      `SELECT id FROM "AboutUsContent" WHERE section = $1 AND id != $2 LIMIT 1`,
      [parsed.section, params.id],
    )
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'A section with this identifier already exists' },
        { status: 400 },
      )
    }

    const sanitizedContent = sanitizeRichText(parsed.content)

    const result = await pgPool.query(
      `
      UPDATE "AboutUsContent"
      SET
        section = $1,
        title = $2,
        content = $3,
        "displayOrder" = $4,
        "updatedAt" = NOW()
      WHERE id = $5
      RETURNING id, section, title, content, "displayOrder", "createdAt", "updatedAt"
      `,
      [
        parsed.section,
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

    log.error('Failed to update about us content', error)
    return NextResponse.json(
      { error: 'Failed to update about us content' },
      { status: 500 },
    )
  }
}

// DELETE /api/about-us-content/:id - delete (admin-only)
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
      `DELETE FROM "AboutUsContent" WHERE id = $1 RETURNING id`,
      [params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    log.error('Failed to delete about us content', error)
    return NextResponse.json(
      { error: 'Failed to delete about us content' },
      { status: 500 },
    )
  }
}
