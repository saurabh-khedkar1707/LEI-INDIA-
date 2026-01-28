import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pgPool } from '@/lib/pg'
import { requireAdmin } from '@/lib/auth-middleware'
import { log } from '@/lib/logger'
import { csrfProtection } from '@/lib/csrf'
import { rateLimit } from '@/lib/rate-limit'

const inquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').trim().optional(),
  company: z.string().trim().optional(),
  subject: z.string().min(3, 'Subject must be at least 3 characters').trim(),
  message: z.string().min(10, 'Message must be at least 10 characters').trim(),
})

const inquiryUpdateSchema = z.object({
  read: z.boolean().optional(),
  responded: z.boolean().optional(),
  notes: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
})

// POST /api/inquiries - submit inquiry (public)
export async function POST(req: NextRequest) {
  // CSRF protection
  const csrfResponse = csrfProtection(req)
  if (csrfResponse) {
    return csrfResponse
  }

  // Rate limiting - prevent spam contact form submissions
  const rateLimitResponse = await rateLimit(req, { maxRequests: 10, windowSeconds: 60 })
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const json = await req.json()
    const data = inquirySchema.parse(json)

    const result = await pgPool.query(
      `
      INSERT INTO "Inquiry" (
        name, email, phone, company, subject, message, read, responded,
        "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, false, false, NOW(), NOW())
      RETURNING id, name, email, phone, company, subject, message, read, responded,
                "createdAt", "updatedAt"
      `,
      [data.name, data.email, data.phone ?? null, data.company ?? null, data.subject, data.message],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
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

    log.error('Error creating inquiry', error)
    return NextResponse.json(
      { error: 'Failed to submit inquiry' },
      { status: 400 },
    )
  }
}

// GET /api/inquiries - list inquiries (admin)
export const GET = requireAdmin(async (req: NextRequest) => {
  try {

    const result = await pgPool.query(
      `
      SELECT id, name, email, phone, company, subject, message, read, responded,
             "createdAt", "updatedAt"
      FROM "Inquiry"
      ORDER BY "createdAt" DESC
      `,
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    log.error('Error fetching inquiries', error)
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 },
    )
  }
})

