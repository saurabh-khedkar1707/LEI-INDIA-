import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { verifyToken } from '@/lib/jwt'
import { careerUpdateSchema } from '@/lib/career-validation'
import { checkAdmin } from '@/lib/auth-middleware'
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

// GET /api/careers/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(req)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const result = await pgPool.query(
      `
      SELECT id, title, department, location, type, description,
             requirements, responsibilities, benefits, salary, active,
             "createdAt", "updatedAt"
      FROM "Career"
      WHERE id = $1
      LIMIT 1
      `,
      [params.id],
    )
    const career = result.rows[0]
    if (!career) {
      return NextResponse.json({ error: 'Career not found' }, { status: 404 })
    }

    const authHeader = req.headers.get('authorization')
    if (!career.active) {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Career not found' }, { status: 404 })
      }
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)
      if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
        return NextResponse.json({ error: 'Career not found' }, { status: 404 })
      }
    }

    return NextResponse.json(career)
  } catch (error) {
    log.error('Failed to fetch career', error)
    return NextResponse.json(
      { error: 'Failed to fetch career' },
      { status: 500 },
    )
  }
}

// PUT /api/careers/:id - update career (admin-only)
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
    const parsed = careerUpdateSchema.parse(body)

    // Check if career exists
    const existing = await pgPool.query(
      `SELECT id, title FROM "Career" WHERE id = $1 LIMIT 1`,
      [params.id],
    )
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Career not found' }, { status: 404 })
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (parsed.title !== undefined) {
      updates.push(`title = $${paramIndex++}`)
      values.push(parsed.title)
      // Update slug if title changed
      const newSlug = generateSlug(parsed.title)
      // Check if new slug conflicts with another career
      const slugCheck = await pgPool.query(
        `SELECT id FROM "Career" WHERE slug = $1 AND id != $2 LIMIT 1`,
        [newSlug, params.id],
      )
      if (slugCheck.rows.length === 0) {
        updates.push(`slug = $${paramIndex++}`)
        values.push(newSlug)
      }
    }
    if (parsed.department !== undefined) {
      updates.push(`department = $${paramIndex++}`)
      values.push(parsed.department)
    }
    if (parsed.location !== undefined) {
      updates.push(`location = $${paramIndex++}`)
      values.push(parsed.location)
    }
    if (parsed.type !== undefined) {
      updates.push(`type = $${paramIndex++}`)
      values.push(parsed.type)
    }
    if (parsed.description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(sanitizeRichText(parsed.description))
    }
    if (parsed.requirements !== undefined) {
      updates.push(`requirements = $${paramIndex++}`)
      values.push(parsed.requirements ? sanitizeRichText(parsed.requirements) : null)
    }
    if (parsed.responsibilities !== undefined) {
      updates.push(`responsibilities = $${paramIndex++}`)
      values.push(parsed.responsibilities ? sanitizeRichText(parsed.responsibilities) : null)
    }
    if (parsed.benefits !== undefined) {
      updates.push(`benefits = $${paramIndex++}`)
      values.push(parsed.benefits ? sanitizeRichText(parsed.benefits) : null)
    }
    if (parsed.salary !== undefined) {
      updates.push(`salary = $${paramIndex++}`)
      values.push(parsed.salary || null)
    }
    if (parsed.active !== undefined) {
      updates.push(`active = $${paramIndex++}`)
      values.push(parsed.active)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 },
      )
    }

    updates.push(`"updatedAt" = NOW()`)
    values.push(params.id)

    const result = await pgPool.query(
      `
      UPDATE "Career"
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, title, department, location, type, description,
                requirements, responsibilities, benefits, salary, active,
                "createdAt", "updatedAt"
      `,
      values,
    )

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

    log.error('Error updating career', error)
    return NextResponse.json(
      { error: 'Failed to update career' },
      { status: 400 },
    )
  }
}

// DELETE /api/careers/:id - delete career (admin-only)
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

    const result = await pgPool.query(
      `DELETE FROM "Career" WHERE id = $1 RETURNING id`,
      [params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Career not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Career deleted successfully' })
  } catch (error) {
    log.error('Error deleting career', error)
    return NextResponse.json(
      { error: 'Failed to delete career' },
      { status: 500 },
    )
  }
}
