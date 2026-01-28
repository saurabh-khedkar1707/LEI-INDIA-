import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { productUpdateSchema } from '@/lib/product-validation'

// GET /api/products/:id
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

// PUT /api/products/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json()
    const parsed = productUpdateSchema.parse(body)

    const existing = await prisma.product.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        sku: parsed.sku ?? existing.sku,
        name: parsed.name ?? existing.name,
        category: parsed.category ?? existing.category,
        description: parsed.description ?? existing.description,
        technicalDescription: parsed.technicalDescription ?? existing.technicalDescription,
        coding: (parsed.coding as any) ?? existing.coding,
        pins: parsed.pins ?? existing.pins,
        ipRating: (parsed.ipRating as any) ?? existing.ipRating,
        gender: (parsed.gender as any) ?? existing.gender,
        connectorType: (parsed.connectorType as any) ?? existing.connectorType,
        material: parsed.specifications?.material ?? existing.material,
        voltage: parsed.specifications?.voltage ?? existing.voltage,
        current: parsed.specifications?.current ?? existing.current,
        temperatureRange: parsed.specifications?.temperatureRange ?? existing.temperatureRange,
        wireGauge:
          parsed.specifications && 'wireGauge' in parsed.specifications
            ? parsed.specifications.wireGauge
            : existing.wireGauge,
        cableLength:
          parsed.specifications && 'cableLength' in parsed.specifications
            ? parsed.specifications.cableLength
            : existing.cableLength,
        price: parsed.price ?? existing.price,
        priceType: (parsed.priceType as any) ?? existing.priceType,
        inStock: parsed.inStock ?? existing.inStock,
        stockQuantity: parsed.stockQuantity ?? existing.stockQuantity,
        images: parsed.images ?? existing.images,
        datasheetUrl:
          parsed.datasheetUrl !== undefined ? parsed.datasheetUrl || null : existing.datasheetUrl,
      },
    })

    return NextResponse.json(updated)
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

    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 400 })
  }
}

// DELETE /api/products/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const existing = await prisma.product.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await prisma.product.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}

