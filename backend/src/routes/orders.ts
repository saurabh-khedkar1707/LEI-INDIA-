import { Router, Request, Response } from 'express'
import { readOrders, createOrder, getOrderById, updateOrder, getCachedResponse, cacheResponse } from '../utils/storage.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { formLimiter } from '../middleware/rate-limit.js'
import { sanitizeBody } from '../middleware/sanitize.js'
import { z } from 'zod'
import crypto from 'crypto'

export const ordersRouter = Router()

// Validation schema for RFQ/Order
const orderSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').trim(),
  contactName: z.string().min(2, 'Contact name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').trim(),
  companyAddress: z.string().trim().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product ID is required'),
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().min(1, 'Product name is required'),
    quantity: z.number().int().positive('Quantity must be a positive number'),
    notes: z.string().optional(),
  })).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  status: z.enum(['pending', 'quoted', 'approved', 'rejected']).optional(),
})

// Validation schema for order updates (only status and notes can be updated)
const orderUpdateSchema = z.object({
  status: z.enum(['pending', 'quoted', 'approved', 'rejected']).optional(),
  notes: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
})

// POST /api/orders - Create order (RFQ)
ordersRouter.post('/', formLimiter, sanitizeBody, async (req: Request, res: Response) => {
  try {
    // Generate or get idempotency key
    const idempotencyKey = req.headers['idempotency-key'] as string || 
      crypto.randomBytes(32).toString('hex')
    
    // Check for cached response (idempotency)
    const cachedResponse = await getCachedResponse(idempotencyKey)
    if (cachedResponse) {
      return res.status(cachedResponse.statusCode).json(cachedResponse.response)
    }

    // Validate input
    const validatedData = orderSchema.parse(req.body)
    
    // Create order with transaction and product validation
    const order = await createOrder(validatedData)
    
    // Cache the response for idempotency
    await cacheResponse(idempotencyKey, order, 201, 3600) // Cache for 1 hour
    
    res.status(201).json(order)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      })
    }
    console.error('Error creating order:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order'
    res.status(400).json({ error: errorMessage })
  }
})

// POST /api/orders/bulk - Create bulk order
ordersRouter.post('/bulk', formLimiter, sanitizeBody, async (req: Request, res: Response) => {
  try {
    // Generate or get idempotency key
    const idempotencyKey = req.headers['idempotency-key'] as string || 
      crypto.randomBytes(32).toString('hex')
    
    // Check for cached response (idempotency)
    const cachedResponse = await getCachedResponse(idempotencyKey)
    if (cachedResponse) {
      return res.status(cachedResponse.statusCode).json(cachedResponse.response)
    }

    // Validate input
    const validatedData = orderSchema.parse(req.body)
    
    // Create order with transaction and product validation
    const order = await createOrder({
      ...validatedData,
      type: 'bulk'
    })
    
    // Cache the response for idempotency
    await cacheResponse(idempotencyKey, order, 201, 3600) // Cache for 1 hour
    
    res.status(201).json(order)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      })
    }
    console.error('Error creating bulk order:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create bulk order'
    res.status(400).json({ error: errorMessage })
  }
})

// GET /api/orders - List orders (admin)
ordersRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const orders = await readOrders()
    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// GET /api/orders/:id - Get order details (admin only)
ordersRouter.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const order = await getOrderById(req.params.id)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    // Only admins can access order details
    // In the future, if user association is added, check if user owns the order
    res.json(order)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' })
  }
})

// PUT /api/orders/:id - Update order status
ordersRouter.put('/:id', requireAuth, sanitizeBody, async (req: AuthRequest, res) => {
  try {
    // Validate input
    const validatedData = orderUpdateSchema.parse(req.body)
    
    const order = await updateOrder(req.params.id, validatedData)
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    res.json(order)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      })
    }
    // Re-throw version conflict errors
    if (error instanceof Error && error.message.includes('modified by another user')) {
      return res.status(409).json({ error: error.message })
    }
    console.error('Error updating order:', error)
    res.status(400).json({ error: 'Failed to update order' })
  }
})
