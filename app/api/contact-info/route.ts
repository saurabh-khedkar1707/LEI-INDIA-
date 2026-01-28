import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'

async function getOrCreateContactInfo() {
  let contact = await prisma.contactInfo.findFirst()
  if (!contact) {
    contact = await prisma.contactInfo.create({
      data: {
        phone: '+91-XXX-XXXX-XXXX',
        email: 'info@leiindias.com',
        address: 'Industrial Area, India',
      },
    })
  }
  return contact
}

// GET /api/contact-info - public
export async function GET(_req: NextRequest) {
  try {
    const contact = await getOrCreateContactInfo()
    return NextResponse.json(contact)
  } catch (error) {
    console.error('Failed to fetch contact information:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact information' },
      { status: 500 },
    )
  }
}

// PUT /api/contact-info - admin
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_token')?.value
    const decoded = token ? verifyToken(token) : null
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { phone, email, address, registeredAddress, factoryLocation2, regionalContacts } = body

    if (!phone || !email || !address) {
      return NextResponse.json(
        { error: 'Phone, email, and address are required' },
        { status: 400 },
      )
    }

    const existing = await getOrCreateContactInfo()

    const updated = await prisma.contactInfo.update({
      where: { id: existing.id },
      data: {
        phone,
        email,
        address,
        registeredAddress,
        factoryLocation2,
        regionalBangalore: regionalContacts?.bangalore,
        regionalKolkata: regionalContacts?.kolkata,
        regionalGurgaon: regionalContacts?.gurgaon,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update contact information:', error)
    return NextResponse.json(
      { error: 'Failed to update contact information' },
      { status: 500 },
    )
  }
}

