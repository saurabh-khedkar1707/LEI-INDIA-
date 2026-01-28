import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pgPool } from '@/lib/pg'
import { checkAdmin } from '@/lib/auth-middleware'
import { log } from '@/lib/logger'
import { csrfProtection } from '@/lib/csrf'
import { rateLimit } from '@/lib/rate-limit'

const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'quoted', 'approved', 'rejected']).optional(),
  notes: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
})

// GET /api/orders/:id - admin only
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = checkAdmin(req)
    if (auth instanceof NextResponse) return auth

    const result = await pgPool.query(
      `
      SELECT
        o.id,
        o."companyName",
        o."contactName",
        o.email,
        o.phone,
        o."companyAddress",
        o.notes,
        o.status,
        o."createdAt",
        o."updatedAt",
        json_agg(
          json_build_object(
            'id', oi.id,
            'orderId', oi."orderId",
            'productId', oi."productId",
            'sku', oi.sku,
            'name', oi.name,
            'quantity', oi.quantity,
            'notes', oi.notes
          )
        ) AS items
      FROM "Order" o
      LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
      WHERE o.id = $1
      GROUP BY o.id
      LIMIT 1
      `,
      [params.id],
    )
    const order = result.rows[0]
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json(order)
  } catch (error) {
    log.error('Error fetching order', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 },
    )
  }
}

// PUT /api/orders/:id - update status/notes (admin)
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

    const json = await req.json()
    const data = orderUpdateSchema.parse(json)

    const result = await pgPool.query(
      `
      UPDATE "Order"
      SET
        status = COALESCE($1, status),
        notes = COALESCE($2, notes),
        "updatedAt" = NOW()
      WHERE id = $3
      RETURNING
        id,
        "companyName",
        "contactName",
        email,
        phone,
        "companyAddress",
        notes,
        status,
        "createdAt",
        "updatedAt"
      `,
      [data.status ?? null, data.notes ?? null, params.id],
    )

    const order = result.rows[0]
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const itemsResult = await pgPool.query(
      `
      SELECT id, "orderId", "productId", sku, name, quantity, notes
      FROM "OrderItem"
      WHERE "orderId" = $1
      `,
      [params.id],
    )

    return NextResponse.json({
      ...order,
      items: itemsResult.rows,
    })
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

    log.error('Error updating order', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 400 },
    )
  }
}

