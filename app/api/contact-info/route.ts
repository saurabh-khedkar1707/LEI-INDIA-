import { NextRequest, NextResponse } from 'next/server'
import { pgPool } from '@/lib/pg'
import { requireAdmin } from '@/lib/auth-middleware'
import { contactInfoSchema } from '@/lib/contact-info-validation'
import { log } from '@/lib/logger'

async function getOrCreateContactInfo() {
  const existing = await pgPool.query(
    `
    SELECT id, phone, email, address, "registeredAddress", "factoryLocation2",
           "regionalBangalore", "regionalKolkata", "regionalGurgaon",
           "createdAt", "updatedAt"
    FROM "ContactInfo"
    ORDER BY "createdAt" ASC
    LIMIT 1
    `,
  )

  if (existing.rows[0]) {
    return existing.rows[0]
  }

  const inserted = await pgPool.query(
    `
    INSERT INTO "ContactInfo" (
      phone, email, address, "registeredAddress", "factoryLocation2",
      "regionalBangalore", "regionalKolkata", "regionalGurgaon",
      "createdAt", "updatedAt"
    )
    VALUES ($1, $2, $3, NULL, NULL, NULL, NULL, NULL, NOW(), NOW())
    RETURNING id, phone, email, address, "registeredAddress", "factoryLocation2",
              "regionalBangalore", "regionalKolkata", "regionalGurgaon",
              "createdAt", "updatedAt"
    `,
    ['+91-XXX-XXXX-XXXX', 'info@leiindias.com', 'Industrial Area, India'],
  )

  return inserted.rows[0]
}

// GET /api/contact-info - public
export async function GET(_req: NextRequest) {
  try {
    const contact = await getOrCreateContactInfo()
    return NextResponse.json(contact)
  } catch (error) {
    log.error('Failed to fetch contact information', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact information' },
      { status: 500 },
    )
  }
}

// PUT /api/contact-info - admin
export const PUT = requireAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = contactInfoSchema.parse(body)

    const existing = await getOrCreateContactInfo()

    const updated = await pgPool.query(
      `
      UPDATE "ContactInfo"
      SET
        phone = $1,
        email = $2,
        address = $3,
        "registeredAddress" = $4,
        "factoryLocation2" = $5,
        "regionalBangalore" = $6,
        "regionalKolkata" = $7,
        "regionalGurgaon" = $8,
        "updatedAt" = NOW()
      WHERE id = $9
      RETURNING id, phone, email, address, "registeredAddress", "factoryLocation2",
                "regionalBangalore", "regionalKolkata", "regionalGurgaon",
                "createdAt", "updatedAt"
      `,
      [
        parsed.phone,
        parsed.email,
        parsed.address,
        parsed.registeredAddress ?? null,
        parsed.factoryLocation2 ?? null,
        parsed.regionalContacts?.bangalore ?? null,
        parsed.regionalContacts?.kolkata ?? null,
        parsed.regionalContacts?.gurgaon ?? null,
        existing.id,
      ],
    )

    return NextResponse.json(updated.rows[0])
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

    log.error('Failed to update contact information', error)
    return NextResponse.json(
      { error: 'Failed to update contact information' },
      { status: 400 },
    )
  }
})

