import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { verifyToken } from '@/lib/jwt'
import { careerSchema } from '@/lib/career-validation'
import { requireAdmin } from '@/lib/auth-middleware'
import { sanitizeRichText } from '@/lib/sanitize'
import { rateLimit } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'
import { log } from '@/lib/logger'

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// GET /api/careers - public active careers or all careers for admin
export async function GET(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(req)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const authHeader = req.headers.get('authorization')
    let isAdmin = false

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)
      if (decoded && (decoded.role === 'admin' || decoded.role === 'superadmin')) {
        isAdmin = true
      }
    }

    const result = await pgPool.query(
      `
      SELECT id, title, department, location, type, description,
             requirements, responsibilities, benefits, salary, active,
             "createdAt", "updatedAt"
      FROM "Career"
      ${isAdmin ? '' : 'WHERE active = true'}
      ORDER BY "createdAt" DESC
      `,
    )
    return NextResponse.json(result.rows)
  } catch (error) {
    log.error('Failed to fetch careers', error)
    return NextResponse.json(
      { error: 'Failed to fetch careers' },
      { status: 500 },
    )
  }
}

// POST /api/careers - create career (admin-only)
export const POST = requireAdmin(async (req: NextRequest) => {
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
    const body = await req.json()
    const parsed = careerSchema.parse(body)

    // Sanitize HTML content fields
    const sanitizedDescription = sanitizeRichText(parsed.description || '')
    const sanitizedRequirements = parsed.requirements ? sanitizeRichText(parsed.requirements) : null
    const sanitizedResponsibilities = parsed.responsibilities ? sanitizeRichText(parsed.responsibilities) : null
    const sanitizedBenefits = parsed.benefits ? sanitizeRichText(parsed.benefits) : null

    // Generate slug from title
    const slug = generateSlug(parsed.title)

    // Check if slug already exists
    const existingSlug = await pgPool.query(
      `SELECT id FROM "Career" WHERE slug = $1 LIMIT 1`,
      [slug],
    )
    if (existingSlug.rows.length > 0) {
      return NextResponse.json(
        { error: 'A career with this title already exists' },
        { status: 400 },
      )
    }

    const result = await pgPool.query(
      `
      INSERT INTO "Career" (
        title, slug, department, location, type, description,
        requirements, responsibilities, benefits, salary, active,
        "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id, title, department, location, type, description,
                requirements, responsibilities, benefits, salary, active,
                "createdAt", "updatedAt"
      `,
      [
        parsed.title,
        slug,
        parsed.department,
        parsed.location,
        parsed.type,
        sanitizedDescription,
        sanitizedRequirements,
        sanitizedResponsibilities,
        sanitizedBenefits,
        parsed.salary || null,
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

    log.error('Error creating career', error)
    return NextResponse.json(
      { error: 'Failed to create career' },
      { status: 400 },
    )
  }
})
