import { Router } from 'express'
import { readResources } from '../utils/storage.js'
import { apiLimiter } from '../middleware/rate-limit.js'

export const resourcesRouter = Router()

// Apply rate limiting
resourcesRouter.use(apiLimiter)

// GET /api/resources - List resources
resourcesRouter.get('/', async (req, res) => {
  try {
    const resources = await readResources()
    res.json(resources)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resources' })
  }
})
