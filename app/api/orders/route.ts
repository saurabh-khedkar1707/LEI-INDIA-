import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pgPool } from '@/lib/pg'
import { verifyToken } from '@/lib/jwt'
import { requireAdmin, requireCustomer } from '@/lib/auth-middleware'
import { log } from '@/lib/logger'

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
  try {

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
      GROUP BY o.id
      ORDER BY o."createdAt" DESC
      `,
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    log.error('Error fetching orders', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 },
    )
  }
})

