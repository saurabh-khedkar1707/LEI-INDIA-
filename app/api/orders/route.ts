import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

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
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('user_token')?.value
    const decoded = token ? verifyToken(token) : null

    if (!decoded || decoded.role !== 'customer') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const json = await req.json()
    const data = orderSchema.parse(json)

    const order = await prisma.order.create({
      data: {
        companyName: data.companyName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        companyAddress: data.companyAddress,
        notes: data.notes,
        status: (data.status as any) || 'pending',
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            notes: item.notes,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json(order, { status: 201 })
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

    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 400 },
    )
  }
}

// GET /api/orders - list orders (admin)
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_token')?.value
    const decoded = token ? verifyToken(token) : null
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 },
    )
  }
}

