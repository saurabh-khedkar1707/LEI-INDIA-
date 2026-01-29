import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pgPool } from '@/lib/pg'
import { verifyToken } from '@/lib/jwt'
import { requireAdmin, requireCustomer } from '@/lib/auth-middleware'
import { log } from '@/lib/logger'
import { csrfProtection } from '@/lib/csrf'
import { rateLimit } from '@/lib/rate-limit'

const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().positive('Quantity must be a positive number'),
  notes: z.string().optional(),
})

const orderSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').trim(),
  contactName: z.string().min(2, 'Contact name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').trim(),
  companyAddress: z.string().trim().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  status: z.enum(['pending', 'quoted', 'approved', 'rejected']).optional(),
})

const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'quoted', 'approved', 'rejected']).optional(),
  notes: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
})

// POST /api/orders - create order (RFQ, authenticated customer)
export const POST = requireCustomer(async (req: NextRequest) => {
  // CSRF protection
  const csrfResponse = csrfProtection(req)
  if (csrfResponse) {
    return csrfResponse
  }

  // Rate limiting - prevent order spam
  const rateLimitResponse = await rateLimit(req, { maxRequests: 10, windowSeconds: 60 })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {

    const json = await req.json()
    const data = orderSchema.parse(json)

    // Start a transaction
    const client = await pgPool.connect()
    try {
      await client.query('BEGIN')

      const orderResult = await client.query(
        `
        INSERT INTO "Order" (
          "companyName", "contactName", email, phone,
          "companyAddress", notes, status,
          "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, "companyName", "contactName", email, phone,
                  "companyAddress", notes, status, "createdAt", "updatedAt"
        `,
        [
          data.companyName,
          data.contactName,
          data.email,
          data.phone,
          data.companyAddress ?? null,
          data.notes ?? null,
          data.status ?? 'pending',
        ],
      )

      const order = orderResult.rows[0]

      const itemsValues: any[] = []
      const valuesChunks: string[] = []
      data.items.forEach((item, index) => {
        const base = index * 7
        valuesChunks.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`,
        )
        itemsValues.push(
          order.id,
          item.productId,
          item.sku,
          item.name,
          item.quantity,
          item.notes ?? null,
          // id is defaulted in the DB
          null,
        )
      })

      const itemsResult = await client.query(
        `
        INSERT INTO "OrderItem" (
          "orderId", "productId", sku, name, quantity, notes, id
        )
        VALUES ${valuesChunks.join(', ')}
        RETURNING id, "orderId", "productId", sku, name, quantity, notes
        `,
        itemsValues,
      )

      await client.query('COMMIT')

      return NextResponse.json(
        {
          ...order,
          items: itemsResult.rows,
        },
        { status: 201 },
      )
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
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

    log.error('Error creating order', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 400 },
    )
  }
})

// GET /api/orders - list orders (admin)
export const GET = requireAdmin(async (req: NextRequest) => {
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

    // Optimized: Single query with window function for count + data
    // Using LATERAL JOIN for better performance than LEFT JOIN + GROUP BY
    const result = await pgPool.query(
      `
      WITH orders_with_items AS (
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
          COUNT(*) OVER() AS total,
          COALESCE(
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
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::json
          ) AS items
        FROM "Order" o
        LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
        GROUP BY o.id
      )
      SELECT * FROM orders_with_items
      ORDER BY "createdAt" DESC
      LIMIT $1
      OFFSET $2
      `,
      [limit, offset],
    )

    const orders = result.rows
    const total: number = orders.length > 0 ? parseInt(orders[0].total) : 0

    return NextResponse.json({
      orders: orders.map(({ total, ...order }) => order), // Remove total from each row
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
    log.error('Error fetching orders', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 },
    )
  }
})

