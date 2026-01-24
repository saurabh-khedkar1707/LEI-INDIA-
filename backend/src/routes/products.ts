import { Router, Request, Response } from 'express'
import { readProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../utils/storage.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { sanitizeQuery, sanitizeBody } from '../middleware/sanitize.js'
import { productSchema, productUpdateSchema } from '../validation/product.js'
import { apiLimiter } from '../middleware/rate-limit.js'
import { z } from 'zod'
import { Product as ProductModel } from '../models/Product.js'
import { connectDatabase } from '../utils/database.js'

export const productsRouter = Router()

// Apply sanitization and rate limiting to query params
productsRouter.use(sanitizeQuery)
productsRouter.use(apiLimiter)

// GET /api/products - List all products with pagination and optional filtering
productsRouter.get('/', async (req: Request, res: Response) => {
  try {
    await connectDatabase()
    
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20)) // Max 100, min 1
    const skip = (page - 1) * limit

    // Build filter query
    const filter: any = {}
    
    if (req.query.connectorType) {
      const types = (req.query.connectorType as string).split(',')
      filter.connectorType = { $in: types }
    }
    
    if (req.query.coding) {
      const codings = (req.query.coding as string).split(',')
      filter.coding = { $in: codings }
    }
    
    if (req.query.pins) {
      const pins = (req.query.pins as string).split(',').map(Number)
      filter.pins = { $in: pins }
    }
    
    if (req.query.ipRating) {
      const ratings = (req.query.ipRating as string).split(',')
      filter.ipRating = { $in: ratings }
    }
    
    if (req.query.gender) {
      const genders = (req.query.gender as string).split(',')
      filter.gender = { $in: genders }
    }
    
    if (req.query.inStock === 'true') {
      filter.inStock = true
    }
    
    if (req.query.search) {
      const search = (req.query.search as string).toLowerCase()
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }
    
    if (req.query.category) {
      filter.category = { $regex: req.query.category as string, $options: 'i' }
    }

    // Get total count and products
    const total = await ProductModel.countDocuments(filter)
    const products = await ProductModel.find(filter)
      .skip(skip)
      .limit(limit)
      .lean()
      .sort({ createdAt: -1 })

    const formattedProducts = products.map((p) => ({
      ...p,
      id: p._id.toString(),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      relatedProducts: p.relatedProducts?.map((id) => id.toString()) || [],
    }))

    res.json({
      products: formattedProducts,
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
    console.error('Error fetching products:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// GET /api/products/:id - Get single product
productsRouter.get('/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    res.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})

// POST /api/products - Create product (admin)
productsRouter.post('/', requireAuth, sanitizeBody, async (req: AuthRequest, res: Response) => {
  try {
    // Validate input
    const validatedData = productSchema.parse(req.body)
    
    const product = await createProduct(validatedData)
    res.status(201).json(product)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      })
    }
    console.error('Error creating product:', error)
    res.status(400).json({ error: 'Failed to create product' })
  }
})

// PUT /api/products/:id - Update product (admin)
productsRouter.put('/:id', requireAuth, sanitizeBody, async (req: AuthRequest, res: Response) => {
  try {
    // Validate input
    const validatedData = productUpdateSchema.parse(req.body)
    
    const product = await updateProduct(req.params.id, validatedData)
    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }
    res.json(product)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      })
    }
    // Re-throw version conflict errors to be handled by error handler
    if (error instanceof Error && error.message.includes('modified by another user')) {
      return res.status(409).json({ error: error.message })
    }
    console.error('Error updating product:', error)
    res.status(400).json({ error: 'Failed to update product' })
  }
})

// DELETE /api/products/:id - Delete product (admin)
productsRouter.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const success = await deleteProduct(req.params.id)
    if (!success) {
      return res.status(404).json({ error: 'Product not found' })
    }
    res.json({ message: 'Product deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' })
  }
})
