import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { productSchema } from '@/lib/product-validation'
import { requireAdmin } from '@/lib/auth-middleware'
import { sanitizeRichText } from '@/lib/sanitize'
import { rateLimit } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'
import { log } from '@/lib/logger'

// GET /api/products - list products with pagination and filters
export async function GET(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(req)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
    const offset = (page - 1) * limit

    const idsParam = searchParams.get('ids')
    const connectorType = searchParams.get('connectorType')
    const coding = searchParams.get('coding')
    const pins = searchParams.get('pins')
    const ipRating = searchParams.get('ipRating')
    const gender = searchParams.get('gender')
    const inStock = searchParams.get('inStock')
    const search = searchParams.get('search')
    const category = searchParams.get('category')

    const filters: string[] = []
    const values: any[] = []

    if (idsParam) {
      const { isValidUUID } = await import('@/lib/validation')
      const ids = idsParam.split(',').map((id) => id.trim()).filter(Boolean).filter(isValidUUID)
      if (ids.length > 0) {
        const placeholders = ids.map((_, idx) => `$${values.length + idx + 1}`)
        filters.push(`id IN (${placeholders.join(',')})`)
        values.push(...ids)
      }
    }

    if (connectorType) {
      const list = connectorType.split(',').map((v) => v.trim()).filter(Boolean)
      if (list.length > 0) {
        const placeholders = list.map((_, idx) => `$${values.length + idx + 1}`)
        filters.push(`"connectorType" IN (${placeholders.join(',')})`)
        values.push(...list)
      }
    }

    if (coding) {
      const list = coding.split(',').map((v) => v.trim()).filter(Boolean)
      if (list.length > 0) {
        const placeholders = list.map((_, idx) => `$${values.length + idx + 1}`)
        filters.push(`coding IN (${placeholders.join(',')})`)
        values.push(...list)
      }
    }

    if (pins) {
      const pinValues = pins
        .split(',')
        .map((p) => Number(p))
        .filter((p) => !Number.isNaN(p))
      if (pinValues.length > 0) {
        const placeholders = pinValues.map((_, idx) => `$${values.length + idx + 1}`)
        filters.push(`pins IN (${placeholders.join(',')})`)
        values.push(...pinValues)
      }
    }

    if (ipRating) {
      const list = ipRating.split(',').map((v) => v.trim()).filter(Boolean)
      if (list.length > 0) {
        const placeholders = list.map((_, idx) => `$${values.length + idx + 1}`)
        filters.push(`"ipRating" IN (${placeholders.join(',')})`)
        values.push(...list)
      }
    }

    if (gender) {
      const list = gender.split(',').map((v) => v.trim()).filter(Boolean)
      if (list.length > 0) {
        const placeholders = list.map((_, idx) => `$${values.length + idx + 1}`)
        filters.push(`gender IN (${placeholders.join(',')})`)
        values.push(...list)
      }
    }

    if (inStock === 'true') {
      filters.push(`"inStock" = true`)
    }

    if (search) {
      // Use trigram similarity for faster text search (requires pg_trgm extension)
      // This uses GIN indexes instead of full table scans
      const searchIndex = values.length + 1
      filters.push(
        `(name % $${searchIndex} OR sku % $${searchIndex + 1} OR description % $${searchIndex + 2} OR name ILIKE $${searchIndex + 3} OR sku ILIKE $${searchIndex + 4})`,
      )
      const searchTerm = search.trim()
      values.push(searchTerm, searchTerm, searchTerm, `%${searchTerm}%`, `%${searchTerm}%`)
    }

    if (category) {
      const idx = values.length + 1
      filters.push(`category ILIKE $${idx}`)
      values.push(`%${category}%`)
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''

    // Optimized: Use window function to get count and data in single query
    // This eliminates one round-trip and reduces latency
    const dataValues = [...values, limit, offset]
    const productsResult = await pgPool.query(
      `
      WITH filtered_products AS (
        SELECT
          id, sku, name, category, description, "technicalDescription", coding, pins,
          "ipRating", gender, "connectorType", material, voltage, current,
          "temperatureRange", "wireGauge", "cableLength", price, "priceType",
          "inStock", "stockQuantity", images, documents, "datasheetUrl",
          "createdAt", "updatedAt",
          COUNT(*) OVER() AS total
        FROM "Product"
        ${whereClause}
      )
      SELECT * FROM filtered_products
      ORDER BY "createdAt" DESC
      LIMIT $${dataValues.length - 1}
      OFFSET $${dataValues.length}
      `,
      dataValues,
    )
    const products = productsResult.rows
    const total: number = products.length > 0 ? parseInt(products[0].total) : 0

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    log.error('Error fetching products', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST /api/products - create product (admin-only)
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
    const parsed = productSchema.parse(body)

    // Sanitize HTML content fields
    const sanitizedDescription = sanitizeRichText(parsed.description || '')
    const sanitizedTechnicalDescription = parsed.technicalDescription ? sanitizeRichText(parsed.technicalDescription) : null

    const result = await pgPool.query(
      `
      INSERT INTO "Product" (
        sku, name, category, description, "technicalDescription",
        coding, pins, "ipRating", gender, "connectorType",
        material, voltage, current, "temperatureRange",
        "wireGauge", "cableLength", price, "priceType",
        "inStock", "stockQuantity", images, documents, "datasheetUrl",
        "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18,
        $19, $20, $21, $22, $23,
        NOW(), NOW()
      )
      RETURNING
        id, sku, name, category, description, "technicalDescription",
        coding, pins, "ipRating", gender, "connectorType",
        material, voltage, current, "temperatureRange",
        "wireGauge", "cableLength", price, "priceType",
        "inStock", "stockQuantity", images, documents, "datasheetUrl",
        "createdAt", "updatedAt"
      `,
      [
        parsed.sku,
        parsed.name,
        parsed.category,
        sanitizedDescription,
        sanitizedTechnicalDescription,
        parsed.coding,
        parsed.pins,
        parsed.ipRating,
        parsed.gender,
        parsed.connectorType,
        parsed.specifications.material,
        parsed.specifications.voltage,
        parsed.specifications.current,
        parsed.specifications.temperatureRange,
        parsed.specifications.wireGauge ?? null,
        parsed.specifications.cableLength ?? null,
        parsed.price ?? null,
        parsed.priceType,
        parsed.inStock,
        parsed.stockQuantity ?? null,
        parsed.images,
        parsed.documents ?? [],
        parsed.datasheetUrl ?? null,
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

    log.error('Error creating product', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 400 })
  }
})

