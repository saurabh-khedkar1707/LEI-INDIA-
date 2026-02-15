import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { productSchema } from '@/lib/product-validation'
import { requireAdmin } from '@/lib/auth-middleware'
import { sanitizeRichText } from '@/lib/sanitize'
import { rateLimit } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'
import { log } from '@/lib/logger'

// GET /api/products - list products with cursor-based pagination and filters
export async function GET(req: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(req)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const { searchParams } = new URL(req.url)
    // Check if this is an admin request (has admin_token cookie)
    const isAdmin = req.cookies.get('admin_token')?.value
    // Allow higher limits for admin requests
    const maxLimit = isAdmin ? 10000 : 100
    const limit = Math.min(maxLimit, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10))
    
    // Cursor-based pagination: cursor is the last product id from previous page
    const cursor = searchParams.get('cursor')
    const { isValidUUID } = await import('@/lib/validation')
    const validCursor = cursor && isValidUUID(cursor) ? cursor : null

    const idsParam = searchParams.get('ids')
    const categoryIdParam = searchParams.get('categoryId')
    const connectorType = searchParams.get('connectorType')
    const code = searchParams.get('code')
    const degreeOfProtection = searchParams.get('degreeOfProtection')
    const pinsParam = searchParams.get('pins')
    const genderParam = searchParams.get('gender')
    const inStockParam = searchParams.get('inStock')
    const search = searchParams.get('search')

    const filters: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Category filtering: support multiple categoryIds
    if (categoryIdParam) {
      const categoryIds = categoryIdParam.split(',').map((id) => id.trim()).filter(Boolean).filter(isValidUUID)
      if (categoryIds.length > 0) {
        if (categoryIds.length === 1) {
          filters.push(`"categoryId" = $${paramIndex}`)
          values.push(categoryIds[0])
          paramIndex++
        } else {
          const placeholders = categoryIds.map(() => `$${paramIndex++}`)
          filters.push(`"categoryId" IN (${placeholders.join(',')})`)
          values.push(...categoryIds)
        }
      }
    }

    // Cursor-based pagination: id > cursor for next page
    if (validCursor) {
      filters.push(`id > $${paramIndex}`)
      values.push(validCursor)
      paramIndex++
    }

    if (idsParam) {
      const ids = idsParam.split(',').map((id) => id.trim()).filter(Boolean).filter(isValidUUID)
      if (ids.length > 0) {
        const placeholders = ids.map(() => `$${paramIndex++}`)
        filters.push(`id IN (${placeholders.join(',')})`)
        values.push(...ids)
      }
    }

    if (connectorType) {
      const list = connectorType.split(',').map((v) => v.trim()).filter(Boolean)
      if (list.length > 0) {
        const placeholders = list.map(() => `$${paramIndex++}`)
        filters.push(`"connectorType" IN (${placeholders.join(',')})`)
        values.push(...list)
      }
    }

    if (code) {
      const list = code.split(',').map((v) => v.trim()).filter(Boolean)
      if (list.length > 0) {
        const placeholders = list.map(() => `$${paramIndex++}`)
        filters.push(`coding IN (${placeholders.join(',')})`)
        values.push(...list)
      }
    }

    if (degreeOfProtection) {
      const list = degreeOfProtection.split(',').map((v) => v.trim()).filter(Boolean)
      if (list.length > 0) {
        const placeholders = list.map(() => `$${paramIndex++}`)
        filters.push(`"ipRating" IN (${placeholders.join(',')})`)
        values.push(...list)
      }
    }

    if (pinsParam) {
      const pins = pinsParam.split(',').map((v) => parseInt(v.trim(), 10)).filter((v) => !isNaN(v))
      if (pins.length > 0) {
        const placeholders = pins.map(() => `$${paramIndex++}`)
        filters.push(`pins IN (${placeholders.join(',')})`)
        values.push(...pins)
      }
    }

    if (genderParam) {
      const list = genderParam.split(',').map((v) => v.trim()).filter(Boolean)
      if (list.length > 0) {
        const placeholders = list.map(() => `$${paramIndex++}`)
        filters.push(`gender IN (${placeholders.join(',')})`)
        values.push(...list)
      }
    }

    if (inStockParam === 'true') {
      filters.push(`"inStock" = true`)
    }

    if (search) {
      // Search across name, sku, description, and mpn fields (handle NULL mpn)
      const searchTerm = search.trim()
      filters.push(
        `(name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex + 1} OR description ILIKE $${paramIndex + 2} OR (mpn IS NOT NULL AND mpn ILIKE $${paramIndex + 3}))`,
      )
      values.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`)
      paramIndex += 4
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''

    // Check if total count is requested (for dashboard stats)
    const includeTotal = searchParams.get('includeTotal') === 'true'

    // Get total count if requested (excluding cursor filter for accurate total)
    let total: number | undefined = undefined
    if (includeTotal) {
      // Build count query without cursor filter (cursor is for pagination, not filtering)
      const countFilters = filters.filter((f) => !f.includes('id >'))
      const countWhere = countFilters.length > 0 ? `WHERE ${countFilters.join(' AND ')}` : ''
      // Get values without cursor value (cursor is added after other filters)
      const cursorValueIndex = validCursor ? values.findIndex((v) => v === validCursor) : -1
      const countValues = cursorValueIndex >= 0 
        ? [...values.slice(0, cursorValueIndex), ...values.slice(cursorValueIndex + 1)]
        : values
      
      const countResult = await pgPool.query(
        `SELECT COUNT(*) as total FROM "Product" ${countWhere}`,
        countValues,
      )
      total = parseInt(countResult.rows[0].total, 10)
    }

    // Optimized cursor-based query using composite index (categoryId, id)
    // Select only required columns to reduce data transfer
    const queryValues = [...values, limit + 1] // Fetch one extra to check if there's a next page
    const productsResult = await pgPool.query(
      `
      SELECT
        id,
        sku,
        name,
        description,
        mpn,
        "categoryId",
        "productType",
        coupling,
        "ipRating" as "degreeOfProtection",
        "wireCrossSection",
        "temperatureRange",
        "cableDiameter",
        "cableMantleColor",
        "cableMantleMaterial",
        "cableLength",
        "glandMaterial",
        "housingMaterial",
        "pinContact",
        "socketContact",
        "cableDragChainSuitable",
        "tighteningTorqueMax",
        "bendingRadiusFixed",
        "bendingRadiusRepeated",
        "contactPlating",
        voltage as "operatingVoltage",
        current as "ratedCurrent",
        "halogenFree",
        "connectorType",
        coding as "code",
        "strippingForce",
        price,
        "priceType",
        "inStock",
        "stockQuantity",
        images,
        documents,
        "datasheetUrl",
        "drawingUrl",
        "createdAt",
        "updatedAt"
      FROM "Product"
      ${whereClause}
      ORDER BY id ASC
      LIMIT $${queryValues.length}
      `,
      queryValues,
    )

    const products = productsResult.rows.slice(0, limit)
    const hasNext = productsResult.rows.length > limit
    const nextCursor = hasNext && products.length > 0 ? products[products.length - 1].id : null

    const pagination: any = {
      limit,
      cursor: nextCursor,
      hasNext,
      hasPrev: validCursor !== null,
    }

    if (total !== undefined) {
      pagination.total = total
    }

    return NextResponse.json({
      products,
      pagination,
    })
  } catch (error: any) {
    log.error('Error fetching products', error)
    
    // Check if this is a missing column error
    if (error?.code === '42703' && error?.message?.includes('categoryId')) {
      return NextResponse.json(
        { 
          error: 'Database schema migration required',
          message: 'The categoryId column is missing. Please run: pnpm migrate:category-id',
          code: 'MIGRATION_REQUIRED'
        },
        { status: 500 }
      )
    }
    
    // Check if table doesn't exist
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: 'Database table not found',
          message: 'The Product table does not exist. Please check your database setup.',
          code: 'TABLE_NOT_FOUND',
          details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        code: error?.code,
      },
      { status: 500 }
    )
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

    const result = await pgPool.query(
      `
      INSERT INTO "Product" (
        sku, name, description,
        "categoryId",
        mpn, "productType", coupling, "ipRating",
        "wireCrossSection", "temperatureRange", "cableDiameter",
        "cableMantleColor", "cableMantleMaterial", "cableLength",
        "glandMaterial", "housingMaterial", "pinContact", "socketContact",
        "cableDragChainSuitable", "tighteningTorqueMax",
        "bendingRadiusFixed", "bendingRadiusRepeated", "contactPlating",
        voltage, current, "halogenFree", "connectorType", coding,
        "strippingForce", price, "priceType", "inStock", "stockQuantity",
        images, documents, "datasheetUrl", "drawingUrl",
        "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17, $18,
        $19, $20,
        $21, $22, $23,
        $24, $25, $26, $27, $28,
        $29, $30, $31, $32, $33,
        $34, $35, $36, $37,
        NOW(), NOW()
      )
      RETURNING
        id, sku, name, description,
        "categoryId",
        mpn, "productType", coupling, "ipRating" as "degreeOfProtection",
        "wireCrossSection", "temperatureRange", "cableDiameter",
        "cableMantleColor", "cableMantleMaterial", "cableLength",
        "glandMaterial", "housingMaterial", "pinContact", "socketContact",
        "cableDragChainSuitable", "tighteningTorqueMax",
        "bendingRadiusFixed", "bendingRadiusRepeated", "contactPlating",
        voltage as "operatingVoltage", current as "ratedCurrent", "halogenFree", "connectorType", coding as "code",
        "strippingForce", price, "priceType", "inStock", "stockQuantity",
        images, documents, "datasheetUrl", "drawingUrl",
        "createdAt", "updatedAt"
      `,
      [
        parsed.sku,
        parsed.name,
        sanitizedDescription,
        parsed.categoryId ?? null,
        parsed.mpn ?? null,
        parsed.productType ?? null,
        parsed.coupling ?? null,
        parsed.degreeOfProtection ?? null,
        parsed.wireCrossSection ?? null,
        parsed.temperatureRange ?? null,
        parsed.cableDiameter ?? null,
        parsed.cableMantleColor ?? null,
        parsed.cableMantleMaterial ?? null,
        parsed.cableLength ?? null,
        parsed.glandMaterial ?? null,
        parsed.housingMaterial ?? null,
        parsed.pinContact ?? null,
        parsed.socketContact ?? null,
        parsed.cableDragChainSuitable ?? null,
        parsed.tighteningTorqueMax ?? null,
        parsed.bendingRadiusFixed ?? null,
        parsed.bendingRadiusRepeated ?? null,
        parsed.contactPlating ?? null,
        parsed.operatingVoltage ?? null,
        parsed.ratedCurrent ?? null,
        parsed.halogenFree ?? null,
        parsed.connectorType ?? null,
        parsed.code ?? null,
        parsed.strippingForce ?? null,
        parsed.price ?? null,
        parsed.priceType ?? 'per_unit',
        parsed.inStock ?? false,
        parsed.stockQuantity ?? null,
        parsed.images,
        parsed.documents ?? [],
        parsed.datasheetUrl ?? null,
        parsed.drawingUrl ?? null,
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
    
    // Check if this is a missing column error
    if (error?.code === '42703' && error?.message?.includes('categoryId')) {
      return NextResponse.json(
        { 
          error: 'Database schema migration required',
          message: 'The categoryId column is missing. Please run: pnpm migrate:category-id',
          code: 'MIGRATION_REQUIRED'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ error: 'Failed to create product' }, { status: 400 })
  }
})

