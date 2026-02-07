import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { requireAdmin } from '@/lib/auth-middleware'
import { technicalSupportContentSchema } from '@/lib/cms-validation'
import { rateLimit } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'
import { sanitizeRichText } from '@/lib/sanitize'
import { log } from '@/lib/logger'

// GET /api/technical-support-content - public
export async function GET(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const result = await pgPool.query(
      `
      SELECT id, section, title, content, "displayOrder", "createdAt", "updatedAt"
      FROM "TechnicalSupportContent"
      ORDER BY "displayOrder" ASC, "createdAt" ASC
      `,
    )
    return NextResponse.json(result.rows)
  } catch (error: any) {
    log.error('Failed to fetch technical support content', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch technical support content',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 },
    )
  }
}

// POST /api/technical-support-content - create (admin-only)
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
    const parsed = technicalSupportContentSchema.parse(body)

    // Check if section already exists
    const existing = await pgPool.query(
      `SELECT id FROM "TechnicalSupportContent" WHERE section = $1 LIMIT 1`,
      [parsed.section],
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
      INSERT INTO "TechnicalSupportContent" (
        section, title, content, "displayOrder", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, section, title, content, "displayOrder", "createdAt", "updatedAt"
      `,
      [
        parsed.section,
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

    log.error('Failed to create technical support content', error)
    return NextResponse.json(
      { error: 'Failed to create technical support content' },
      { status: 500 },
    )
  }
})
