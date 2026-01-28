import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { productUpdateSchema } from '@/lib/product-validation'
import { checkAdmin } from '@/lib/auth-middleware'
import { sanitizeRichText } from '@/lib/sanitize'
import { rateLimit } from '@/lib/rate-limit'
import { csrfProtection } from '@/lib/csrf'
import { log } from '@/lib/logger'

// GET /api/products/:id
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
      SELECT
        id, sku, name, category, description, "technicalDescription", coding, pins,
        "ipRating", gender, "connectorType", material, voltage, current,
        "temperatureRange", "wireGauge", "cableLength", price, "priceType",
        "inStock", "stockQuantity", images, "datasheetUrl",
        "createdAt", "updatedAt"
      FROM "Product"
      WHERE id = $1
      LIMIT 1
      `,
      [params.id],
    )
    const product = result.rows[0]

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    log.error('Error fetching product', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

// PUT /api/products/:id - update product (admin-only)
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
    const parsed = productUpdateSchema.parse(body)

    const existingResult = await pgPool.query(
      `
      SELECT
        id, sku, name, category, description, "technicalDescription", coding, pins,
        "ipRating", gender, "connectorType", material, voltage, current,
        "temperatureRange", "wireGauge", "cableLength", price, "priceType",
        "inStock", "stockQuantity", images, "datasheetUrl"
      FROM "Product"
      WHERE id = $1
      LIMIT 1
      `,
      [params.id],
    )
    const existing = existingResult.rows[0]
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Sanitize HTML content fields
    const sanitizedDescription = parsed.description !== undefined 
      ? sanitizeRichText(parsed.description) 
      : existing.description
    const sanitizedTechnicalDescription = parsed.technicalDescription !== undefined
      ? (parsed.technicalDescription ? sanitizeRichText(parsed.technicalDescription) : null)
      : existing.technicalDescription

    const updatedResult = await pgPool.query(
      `
      UPDATE "Product"
      SET
        sku = $1,
        name = $2,
        category = $3,
        description = $4,
        "technicalDescription" = $5,
        coding = $6,
        pins = $7,
        "ipRating" = $8,
        gender = $9,
        "connectorType" = $10,
        material = $11,
        voltage = $12,
        current = $13,
        "temperatureRange" = $14,
        "wireGauge" = $15,
        "cableLength" = $16,
        price = $17,
        "priceType" = $18,
        "inStock" = $19,
        "stockQuantity" = $20,
        images = $21,
        "datasheetUrl" = $22,
        "updatedAt" = NOW()
      WHERE id = $23
      RETURNING
        id, sku, name, category, description, "technicalDescription", coding, pins,
        "ipRating", gender, "connectorType", material, voltage, current,
        "temperatureRange", "wireGauge", "cableLength", price, "priceType",
        "inStock", "stockQuantity", images, "datasheetUrl",
        "createdAt", "updatedAt"
      `,
      [
        parsed.sku ?? existing.sku,
        parsed.name ?? existing.name,
        parsed.category ?? existing.category,
        sanitizedDescription,
        sanitizedTechnicalDescription,
        parsed.coding ?? existing.coding,
        parsed.pins ?? existing.pins,
        parsed.ipRating ?? existing.ipRating,
        parsed.gender ?? existing.gender,
        parsed.connectorType ?? existing.connectorType,
        parsed.specifications?.material ?? existing.material,
        parsed.specifications?.voltage ?? existing.voltage,
        parsed.specifications?.current ?? existing.current,
        parsed.specifications?.temperatureRange ?? existing.temperatureRange,
        parsed.specifications && 'wireGauge' in parsed.specifications
          ? parsed.specifications.wireGauge
          : existing.wireGauge,
        parsed.specifications && 'cableLength' in parsed.specifications
          ? parsed.specifications.cableLength
          : existing.cableLength,
        parsed.price ?? existing.price,
        parsed.priceType ?? existing.priceType,
        parsed.inStock ?? existing.inStock,
        parsed.stockQuantity ?? existing.stockQuantity,
        parsed.images ?? existing.images,
        parsed.datasheetUrl !== undefined ? parsed.datasheetUrl || null : existing.datasheetUrl,
        params.id,
      ],
    )

    return NextResponse.json(updatedResult.rows[0])
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

    log.error('Error updating product', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 400 })
  }
}

// DELETE /api/products/:id - delete product (admin-only)
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

    const existingResult = await pgPool.query(
      `
      SELECT id
      FROM "Product"
      WHERE id = $1
      LIMIT 1
      `,
      [params.id],
    )
    const existing = existingResult.rows[0]
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await pgPool.query(
      `
      DELETE FROM "Product"
      WHERE id = $1
      `,
      [params.id],
    )
    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    log.error('Error deleting product', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}

