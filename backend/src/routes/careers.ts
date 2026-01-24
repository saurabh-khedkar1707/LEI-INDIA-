import { Router } from 'express'
import { Career } from '../models/Career.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { apiLimiter } from '../middleware/rate-limit.js'

export const careersRouter = Router()

// Apply rate limiting
careersRouter.use(apiLimiter)

// GET /api/careers - List all active careers (public) or all careers (admin)
careersRouter.get('/', async (req, res) => {
  try {
    const isAdmin = req.headers.authorization // Check if admin token exists
    const query = isAdmin ? {} : { active: true }
    
    const careers = await Career.find(query).sort({ createdAt: -1 })
    res.json(careers)
  } catch (error) {
    console.error('Failed to fetch careers:', error)
    res.status(500).json({ error: 'Failed to fetch careers' })
  }
})

// GET /api/careers/:id - Get single career
careersRouter.get('/:id', async (req, res) => {
  try {
    const career = await Career.findById(req.params.id)
    if (!career) {
      return res.status(404).json({ error: 'Career not found' })
    }
    
    // Only return active careers to non-admin users
    const isAdmin = req.headers.authorization
    if (!isAdmin && !career.active) {
      return res.status(404).json({ error: 'Career not found' })
    }
    
    res.json(career)
  } catch (error) {
    console.error('Failed to fetch career:', error)
    res.status(500).json({ error: 'Failed to fetch career' })
  }
})

// POST /api/careers - Create career (admin)
careersRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const career = new Career(req.body)
    await career.save()
    res.status(201).json(career)
  } catch (error: any) {
    console.error('Failed to create career:', error)
    res.status(400).json({ error: error.message || 'Failed to create career' })
  }
})

// PUT /api/careers/:id - Update career (admin)
careersRouter.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const career = await Career.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    
    if (!career) {
      return res.status(404).json({ error: 'Career not found' })
    }
    
    res.json(career)
  } catch (error: any) {
    console.error('Failed to update career:', error)
    res.status(400).json({ error: error.message || 'Failed to update career' })
  }
})

// DELETE /api/careers/:id - Delete career (admin)
careersRouter.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const career = await Career.findByIdAndDelete(req.params.id)
    if (!career) {
      return res.status(404).json({ error: 'Career not found' })
    }
    res.json({ message: 'Career deleted successfully' })
  } catch (error) {
    console.error('Failed to delete career:', error)
    res.status(500).json({ error: 'Failed to delete career' })
  }
})
