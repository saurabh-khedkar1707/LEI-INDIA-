import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { verifyToken } from '@/lib/jwt'
import { blogSchema } from '@/lib/blog-validation'
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

// GET /api/blogs - public (published only) or all for admin
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
      SELECT id, title, excerpt, content, author, category, image, published,
             "publishedAt", "createdAt", "updatedAt"
      FROM "Blog"
      ${isAdmin ? '' : 'WHERE published = true'}
      ORDER BY "createdAt" DESC
      `,
    )
    return NextResponse.json(result.rows)
  } catch (error) {
    log.error('Failed to fetch blogs', error)
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
      { status: 500 },
    )
  }
}

// POST /api/blogs - create blog (admin-only)
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
    const parsed = blogSchema.parse(body)

    // Sanitize HTML content fields
    const sanitizedContent = sanitizeRichText(parsed.content || '')
    const sanitizedExcerpt = sanitizeRichText(parsed.excerpt || '')

    // Generate slug from title
    const slug = generateSlug(parsed.title)

    // Check if slug already exists
    const existingSlug = await pgPool.query(
      `SELECT id FROM "Blog" WHERE slug = $1 LIMIT 1`,
      [slug],
    )
    if (existingSlug.rows.length > 0) {
      return NextResponse.json(
        { error: 'A blog with this title already exists' },
        { status: 400 },
      )
    }

    // Set publishedAt if published is true
    const publishedAt = parsed.published
      ? parsed.publishedAt || new Date().toISOString()
      : null

    const result = await pgPool.query(
      `
      INSERT INTO "Blog" (
        title, slug, excerpt, content, author, category, image, published,
        "publishedAt", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id, title, excerpt, content, author, category, image, published,
                "publishedAt", "createdAt", "updatedAt"
      `,
      [
        parsed.title,
        slug,
        sanitizedExcerpt,
        sanitizedContent,
        parsed.author,
        parsed.category,
        parsed.image || null,
        parsed.published,
        publishedAt,
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

    log.error('Error creating blog', error)
    return NextResponse.json(
      { error: 'Failed to create blog' },
      { status: 400 },
    )
  }
})
