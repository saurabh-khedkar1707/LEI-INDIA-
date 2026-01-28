import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { productSchema } from '@/lib/product-validation'
import { verifyToken } from '@/lib/jwt'

// GET /api/products - list products with pagination and filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
    const skip = (page - 1) * limit

    const where: any = {}

    const idsParam = searchParams.get('ids')
    if (idsParam) {
      const ids = idsParam.split(',').map((id) => id.trim()).filter(Boolean)
      if (ids.length > 0) {
        where.id = { in: ids }
      }
    }

    const connectorType = searchParams.get('connectorType')
    if (connectorType) {
      where.connectorType = { in: connectorType.split(',') }
    }

    const coding = searchParams.get('coding')
    if (coding) {
      where.coding = { in: coding.split(',') }
    }

    const pins = searchParams.get('pins')
    if (pins) {
      const pinValues = pins.split(',').map((p) => Number(p)).filter((p) => !Number.isNaN(p))
      if (pinValues.length > 0) {
        where.pins = { in: pinValues }
      }
    }

    const ipRating = searchParams.get('ipRating')
    if (ipRating) {
      where.ipRating = { in: ipRating.split(',') }
    }

    const gender = searchParams.get('gender')
    if (gender) {
      where.gender = { in: gender.split(',') }
    }

    const inStock = searchParams.get('inStock')
    if (inStock === 'true') {
      where.inStock = true
    }

    const search = searchParams.get('search')
    if (search) {
      const value = search.toLowerCase()
      where.OR = [
        { name: { contains: value, mode: 'insensitive' } },
        { sku: { contains: value, mode: 'insensitive' } },
        { description: { contains: value, mode: 'insensitive' } },
      ]
    }

    const category = searchParams.get('category')
    if (category) {
      where.category = { contains: category, mode: 'insensitive' }
    }

    const total = await prisma.product.count({ where })
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

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
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST /api/products - create product (admin-only, auth to be wired)
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_token')?.value
    const decoded = token ? verifyToken(token) : null

    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = productSchema.parse(body)

    const product = await prisma.product.create({
      data: {
        sku: parsed.sku,
        name: parsed.name,
        category: parsed.category,
        description: parsed.description,
        technicalDescription: parsed.technicalDescription,
        coding: parsed.coding as any,
        pins: parsed.pins,
        ipRating: parsed.ipRating as any,
        gender: parsed.gender as any,
        connectorType: parsed.connectorType as any,
        material: parsed.specifications.material,
        voltage: parsed.specifications.voltage,
        current: parsed.specifications.current,
        temperatureRange: parsed.specifications.temperatureRange,
        wireGauge: parsed.specifications.wireGauge,
        cableLength: parsed.specifications.cableLength,
        price: parsed.price,
        priceType: parsed.priceType as any,
        inStock: parsed.inStock,
        stockQuantity: parsed.stockQuantity,
        images: parsed.images,
        datasheetUrl: parsed.datasheetUrl || null,
      },
    })

    return NextResponse.json(product, { status: 201 })
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

    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 400 })
  }
}

