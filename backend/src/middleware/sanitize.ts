import { Request, Response, NextFunction } from 'express'
import { body, query, param, validationResult } from 'express-validator'

// Sanitize string inputs (basic XSS prevention)
export const sanitizeString = (value: any): string => {
  if (typeof value !== 'string') return ''
  return value
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
}

// Sanitize HTML content (for rich text fields like descriptions)
// In production, use a library like DOMPurify for comprehensive sanitization
export const sanitizeHTML = (value: any): string => {
  if (typeof value !== 'string') return ''
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .trim()
}

// Sanitize email
export const sanitizeEmail = (value: any): string => {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase()
}

// Sanitize number
export const sanitizeNumber = (value: any): number | null => {
  const num = Number(value)
  return isNaN(num) ? null : num
}

// Middleware to sanitize request body
export const sanitizeBody = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Don't sanitize password fields
        if (key.toLowerCase().includes('password')) {
          continue
        }
        // Don't sanitize JSON fields (they'll be validated separately)
        if (key === 'items' || key === 'specifications' || key === 'relatedProducts') {
          continue
        }
        // Use HTML sanitization for rich text fields
        if (key === 'description' || key === 'technicalDescription' || key === 'notes' || key === 'message') {
          req.body[key] = sanitizeHTML(req.body[key])
        } else {
          req.body[key] = sanitizeString(req.body[key])
        }
      }
    }
  }
  next()
}

// Middleware to sanitize query parameters
export const sanitizeQuery = (req: Request, res: Response, next: NextFunction) => {
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key] as string)
      }
    }
  }
  next()
}

// Validation middleware
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array()
    })
  }
  next()
}
