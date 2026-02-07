import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { principalPartnerSchema } from '@/lib/cms-validation'
import { rateLimit } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'
import { log } from '@/lib/logger'
import { checkAdmin } from '@/lib/auth-middleware'

// GET /api/principal-partners/:id
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
      SELECT id, "companyName", logo, "companyDetails", email, phone, address, website,
             "displayOrder", active, "createdAt", "updatedAt"
      FROM "PrincipalPartner"
      WHERE id = $1
      `,
      [params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    log.error('Failed to fetch principal partner', error)
    return NextResponse.json(
      { error: 'Failed to fetch principal partner' },
      { status: 500 },
    )
  }
}

// PUT /api/principal-partners/:id - update (admin-only)
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
    const parsed = principalPartnerSchema.parse(body)

    const result = await pgPool.query(
      `
      UPDATE "PrincipalPartner"
      SET
        "companyName" = $1,
        logo = $2,
        "companyDetails" = $3,
        email = $4,
        phone = $5,
        address = $6,
        website = $7,
        "displayOrder" = $8,
        active = $9,
        "updatedAt" = NOW()
      WHERE id = $10
      RETURNING id, "companyName", logo, "companyDetails", email, phone, address, website,
                "displayOrder", active, "createdAt", "updatedAt"
      `,
      [
        parsed.companyName,
        parsed.logo || null,
        parsed.companyDetails || null,
        parsed.email || null,
        parsed.phone || null,
        parsed.address || null,
        parsed.website || null,
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

    log.error('Failed to update principal partner', error)
    return NextResponse.json(
      { error: 'Failed to update principal partner' },
      { status: 500 },
    )
  }
}

// DELETE /api/principal-partners/:id - delete (admin-only)
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
      `DELETE FROM "PrincipalPartner" WHERE id = $1 RETURNING id`,
      [params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    log.error('Failed to delete principal partner', error)
    return NextResponse.json(
      { error: 'Failed to delete principal partner' },
      { status: 500 },
    )
  }
}
