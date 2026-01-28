import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { verifyToken } from '@/lib/jwt'
import { blogUpdateSchema } from '@/lib/blog-validation'
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

// GET /api/blogs/:id
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
      SELECT id, title, excerpt, content, author, category, image, published,
             "publishedAt", "createdAt", "updatedAt"
      FROM "Blog"
      WHERE id = $1
      LIMIT 1
      `,
      [params.id],
    )
    const blog = result.rows[0]

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    const authHeader = req.headers.get('authorization')
    if (!blog.published) {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
      }
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)
      if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
        return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
      }
    }

    return NextResponse.json(blog)
  } catch (error) {
    log.error('Failed to fetch blog', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog' },
      { status: 500 },
    )
  }
}

// PUT /api/blogs/:id - update blog (admin-only)
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
    const parsed = blogUpdateSchema.parse(body)

    // Check if blog exists
    const existing = await pgPool.query(
      `SELECT id, title FROM "Blog" WHERE id = $1 LIMIT 1`,
      [params.id],
    )
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
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
      // Check if new slug conflicts with another blog
      const slugCheck = await pgPool.query(
        `SELECT id FROM "Blog" WHERE slug = $1 AND id != $2 LIMIT 1`,
        [newSlug, params.id],
      )
      if (slugCheck.rows.length === 0) {
        updates.push(`slug = $${paramIndex++}`)
        values.push(newSlug)
      }
    }
    if (parsed.excerpt !== undefined) {
      updates.push(`excerpt = $${paramIndex++}`)
      values.push(sanitizeRichText(parsed.excerpt))
    }
    if (parsed.content !== undefined) {
      updates.push(`content = $${paramIndex++}`)
      values.push(sanitizeRichText(parsed.content))
    }
    if (parsed.author !== undefined) {
      updates.push(`author = $${paramIndex++}`)
      values.push(parsed.author)
    }
    if (parsed.category !== undefined) {
      updates.push(`category = $${paramIndex++}`)
      values.push(parsed.category)
    }
    if (parsed.image !== undefined) {
      updates.push(`image = $${paramIndex++}`)
      values.push(parsed.image || null)
    }
    if (parsed.published !== undefined) {
      updates.push(`published = $${paramIndex++}`)
      values.push(parsed.published)
      // Set publishedAt if publishing for the first time
      if (parsed.published) {
        const currentBlog = await pgPool.query(
          `SELECT "publishedAt" FROM "Blog" WHERE id = $1`,
          [params.id],
        )
        if (!currentBlog.rows[0]?.publishedAt) {
          updates.push(`"publishedAt" = $${paramIndex++}`)
          values.push(parsed.publishedAt || new Date().toISOString())
        } else if (parsed.publishedAt) {
          updates.push(`"publishedAt" = $${paramIndex++}`)
          values.push(parsed.publishedAt)
        }
      }
    } else if (parsed.publishedAt !== undefined) {
      updates.push(`"publishedAt" = $${paramIndex++}`)
      values.push(parsed.publishedAt || null)
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
      UPDATE "Blog"
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, title, excerpt, content, author, category, image, published,
                "publishedAt", "createdAt", "updatedAt"
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

    log.error('Error updating blog', error)
    return NextResponse.json(
      { error: 'Failed to update blog' },
      { status: 400 },
    )
  }
}

// DELETE /api/blogs/:id - delete blog (admin-only)
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
      `DELETE FROM "Blog" WHERE id = $1 RETURNING id`,
      [params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Blog deleted successfully' })
  } catch (error) {
    log.error('Error deleting blog', error)
    return NextResponse.json(
      { error: 'Failed to delete blog' },
      { status: 500 },
    )
  }
}
