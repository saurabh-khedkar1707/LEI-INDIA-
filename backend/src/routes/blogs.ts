import { Router } from 'express'
import { Blog } from '../models/Blog.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { apiLimiter } from '../middleware/rate-limit.js'

export const blogsRouter = Router()

// Apply rate limiting
blogsRouter.use(apiLimiter)

// GET /api/blogs - List all published blogs (public) or all blogs (admin)
blogsRouter.get('/', async (req, res) => {
  try {
    const isAdmin = req.headers.authorization // Check if admin token exists
    const query = isAdmin ? {} : { published: true }
    
    const blogs = await Blog.find(query).sort({ createdAt: -1 })
    res.json(blogs)
  } catch (error) {
    console.error('Failed to fetch blogs:', error)
    res.status(500).json({ error: 'Failed to fetch blogs' })
  }
})

// GET /api/blogs/:id - Get single blog
blogsRouter.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' })
    }
    
    // Only return published blogs to non-admin users
    const isAdmin = req.headers.authorization
    if (!isAdmin && !blog.published) {
      return res.status(404).json({ error: 'Blog not found' })
    }
    
    res.json(blog)
  } catch (error) {
    console.error('Failed to fetch blog:', error)
    res.status(500).json({ error: 'Failed to fetch blog' })
  }
})

// POST /api/blogs - Create blog (admin)
blogsRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const blogData = {
      ...req.body,
      publishedAt: req.body.published ? new Date() : undefined,
    }
    
    const blog = new Blog(blogData)
    await blog.save()
    res.status(201).json(blog)
  } catch (error: any) {
    console.error('Failed to create blog:', error)
    res.status(400).json({ error: error.message || 'Failed to create blog' })
  }
})

// PUT /api/blogs/:id - Update blog (admin)
blogsRouter.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' })
    }
    
    // Set publishedAt if publishing for the first time
    if (req.body.published && !blog.published) {
      req.body.publishedAt = new Date()
    }
    
    Object.assign(blog, req.body)
    await blog.save()
    res.json(blog)
  } catch (error: any) {
    console.error('Failed to update blog:', error)
    res.status(400).json({ error: error.message || 'Failed to update blog' })
  }
})

// DELETE /api/blogs/:id - Delete blog (admin)
blogsRouter.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id)
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' })
    }
    res.json({ message: 'Blog deleted successfully' })
  } catch (error) {
    console.error('Failed to delete blog:', error)
    res.status(500).json({ error: 'Failed to delete blog' })
  }
})
