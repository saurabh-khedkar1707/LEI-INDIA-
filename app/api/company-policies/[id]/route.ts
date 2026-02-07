import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { companyPolicySchema, generateSlug } from '@/lib/cms-validation'
import { rateLimit } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'
import { sanitizeRichText } from '@/lib/sanitize'
import { log } from '@/lib/logger'
import { checkAdmin } from '@/lib/auth-middleware'

// GET /api/company-policies/:id
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
      SELECT id, title, slug, content, "policyType", "displayOrder", active, "createdAt", "updatedAt"
      FROM "CompanyPolicy"
      WHERE id = $1
      `,
      [params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    log.error('Failed to fetch company policy', error)
    return NextResponse.json(
      { error: 'Failed to fetch company policy' },
      { status: 500 },
    )
  }
}

// PUT /api/company-policies/:id - update (admin-only)
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
    const parsed = companyPolicySchema.parse(body)

    // Generate slug if not provided
    const slug = parsed.slug || generateSlug(parsed.title)

    // Check if slug already exists for another record
    const existingSlug = await pgPool.query(
      `SELECT id FROM "CompanyPolicy" WHERE slug = $1 AND id != $2 LIMIT 1`,
      [slug, params.id],
    )
    if (existingSlug.rows.length > 0) {
      return NextResponse.json(
        { error: 'A policy with this slug already exists' },
        { status: 400 },
      )
    }

    const sanitizedContent = sanitizeRichText(parsed.content)

    const result = await pgPool.query(
      `
      UPDATE "CompanyPolicy"
      SET
        title = $1,
        slug = $2,
        content = $3,
        "policyType" = $4,
        "displayOrder" = $5,
        active = $6,
        "updatedAt" = NOW()
      WHERE id = $7
      RETURNING id, title, slug, content, "policyType", "displayOrder", active, "createdAt", "updatedAt"
      `,
      [
        parsed.title,
        slug,
        sanitizedContent,
        parsed.policyType || null,
        parsed.displayOrder,
        parsed.active,
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

    log.error('Failed to update company policy', error)
    return NextResponse.json(
      { error: 'Failed to update company policy' },
      { status: 500 },
    )
  }
}

// DELETE /api/company-policies/:id - delete (admin-only)
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
      `DELETE FROM "CompanyPolicy" WHERE id = $1 RETURNING id`,
      [params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    log.error('Failed to delete company policy', error)
    return NextResponse.json(
      { error: 'Failed to delete company policy' },
      { status: 500 },
    )
  }
}
