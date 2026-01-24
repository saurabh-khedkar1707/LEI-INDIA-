import { Router } from 'express'
import { readContactInfo, updateContactInfo } from '../utils/storage.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'

export const contactInfoRouter = Router()

// GET /api/contact-info - Get contact information (public)
contactInfoRouter.get('/', async (req, res) => {
  try {
    const contactInfo = await readContactInfo()
    res.json(contactInfo)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact information' })
  }
})

// PUT /api/contact-info - Update contact information (admin)
contactInfoRouter.put('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { phone, email, address, registeredAddress, factoryLocation2, regionalContacts } = req.body

    if (!phone || !email || !address) {
      return res.status(400).json({ error: 'Phone, email, and address are required' })
    }

    const updated = await updateContactInfo({ 
      phone, 
      email, 
      address, 
      registeredAddress, 
      factoryLocation2, 
      regionalContacts 
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contact information' })
  }
})
