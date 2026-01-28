import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { verifyToken } from '@/lib/jwt'

const uploadsDir = join(process.cwd(), 'public', 'uploads')

// POST /api/admin/upload - upload product image (admin)
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_token')?.value
    const decoded = token ? verifyToken(token) : null
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('image')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only image files are allowed (jpeg, png, gif, webp)' },
        { status: 400 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await mkdir(uploadsDir, { recursive: true })

    const ext = file.name.split('.').pop() || 'png'
    const filename = `product-${Date.now()}-${randomUUID()}.${ext}`
    const filePath = join(uploadsDir, filename)

    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/${filename}`

    return NextResponse.json({
      url: fileUrl,
      filename,
      size: buffer.length,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 },
    )
  }
}

