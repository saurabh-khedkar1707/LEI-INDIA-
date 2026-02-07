import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { requireAdmin } from '@/lib/auth-middleware'
import { principalPartnerSchema } from '@/lib/cms-validation'
import { rateLimit } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'
import { log } from '@/lib/logger'

// GET /api/principal-partners - public (active only) or all for admin
export async function GET(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const authHeader = req.headers.get('authorization')
    let isAdmin = false

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const { verifyToken } = await import('@/lib/jwt')
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)
      if (decoded && (decoded.role === 'admin' || decoded.role === 'superadmin')) {
        isAdmin = true
      }
    }

    const result = await pgPool.query(
      `
      SELECT id, "companyName", logo, "companyDetails", email, phone, address, website,
             "displayOrder", active, "createdAt", "updatedAt"
      FROM "PrincipalPartner"
      ${isAdmin ? '' : 'WHERE active = true'}
      ORDER BY "displayOrder" ASC, "createdAt" DESC
      `,
    )
    return NextResponse.json(result.rows)
  } catch (error: any) {
    log.error('Failed to fetch principal partners', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch principal partners',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 },
    )
  }
}

// POST /api/principal-partners - create (admin-only)
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
    const parsed = principalPartnerSchema.parse(body)

    const result = await pgPool.query(
      `
      INSERT INTO "PrincipalPartner" (
        "companyName", logo, "companyDetails", email, phone, address, website,
        "displayOrder", active, "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
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

    log.error('Failed to create principal partner', error)
    return NextResponse.json(
      { error: 'Failed to create principal partner' },
      { status: 500 },
    )
  }
})
