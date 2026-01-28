import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

const inquiryUpdateSchema = z.object({
  read: z.boolean().optional(),
  responded: z.boolean().optional(),
  notes: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
})

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  const decoded = token ? verifyToken(token) : null
  if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { decoded }
}

// GET /api/inquiries/:id - admin
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: params.id },
    })
    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }
    return NextResponse.json(inquiry)
  } catch (error) {
    console.error('Error fetching inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inquiry' },
      { status: 500 },
    )
  }
}

// PUT /api/inquiries/:id - admin update
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  try {
    const json = await req.json()
    const data = inquiryUpdateSchema.parse(json)

    const inquiry = await prisma.inquiry.update({
      where: { id: params.id },
      data: {
        read: data.read,
        responded: data.responded,
        // notes: if you add a notes column later
      },
    })

    return NextResponse.json(inquiry)
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

    console.error('Error updating inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to update inquiry' },
      { status: 400 },
    )
  }
}

// DELETE /api/inquiries/:id - admin
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req)
  if ('error' in auth) return auth.error

  try {
    await prisma.inquiry.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ message: 'Inquiry deleted successfully' })
  } catch (error) {
    console.error('Error deleting inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to delete inquiry' },
      { status: 500 },
    )
  }
}

