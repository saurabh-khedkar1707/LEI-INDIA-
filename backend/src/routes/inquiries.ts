import { Router } from 'express'
import { readInquiries, createInquiry, updateInquiry, deleteInquiry } from '../utils/storage.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { apiLimiter, formLimiter } from '../middleware/rate-limit.js'
import { sanitizeBody } from '../middleware/sanitize.js'
import { z } from 'zod'

export const inquiriesRouter = Router()

// Validation schema for inquiries
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

// POST /api/inquiries - Submit inquiry
inquiriesRouter.post('/', formLimiter, sanitizeBody, async (req, res) => {
  try {
    // Validate input
    const validatedData = inquirySchema.parse(req.body)
    const inquiry = await createInquiry(validatedData)
    res.status(201).json(inquiry)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      })
    }
    console.error('Error creating inquiry:', error)
    res.status(400).json({ error: 'Failed to submit inquiry' })
  }
})

// GET /api/inquiries - List inquiries (admin)
inquiriesRouter.get('/', requireAuth, apiLimiter, async (req: AuthRequest, res) => {
  try {
    const inquiries = await readInquiries()
    res.json(inquiries)
  } catch (error) {
    console.error('Error fetching inquiries:', error)
    res.status(500).json({ error: 'Failed to fetch inquiries' })
  }
})

// GET /api/inquiries/:id - Get inquiry details (admin)
inquiriesRouter.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { getInquiryById } = await import('../utils/storage.js')
    const inquiry = await getInquiryById(req.params.id)
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' })
    }
    res.json(inquiry)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inquiry' })
  }
})

// PUT /api/inquiries/:id - Update inquiry (admin)
inquiriesRouter.put('/:id', requireAuth, sanitizeBody, async (req: AuthRequest, res) => {
  try {
    // Validate input
    const validatedData = inquiryUpdateSchema.parse(req.body)
    const inquiry = await updateInquiry(req.params.id, validatedData)
    if (!inquiry) {
      return res.status(404).json({ error: 'Inquiry not found' })
    }
    res.json(inquiry)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      })
    }
    console.error('Error updating inquiry:', error)
    res.status(400).json({ error: 'Failed to update inquiry' })
  }
})

// DELETE /api/inquiries/:id - Delete inquiry (admin)
inquiriesRouter.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const success = await deleteInquiry(req.params.id)
    if (!success) {
      return res.status(404).json({ error: 'Inquiry not found' })
    }
    res.json({ message: 'Inquiry deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete inquiry' })
  }
})
