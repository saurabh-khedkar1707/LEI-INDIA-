import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export class OperationalError extends Error implements AppError {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

// Centralized error handler middleware
export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
  })

  // Determine status code
  const statusCode = (err as AppError).statusCode || 500
  const isOperational = (err as AppError).isOperational || false

  // In production, don't expose internal error details
  if (process.env.NODE_ENV === 'production') {
    if (isOperational) {
      // Operational errors (expected errors) - show user-friendly message
      res.status(statusCode).json({
        error: err.message || 'An error occurred',
      })
    } else {
      // Programming errors (unexpected errors) - hide details
      res.status(500).json({
        error: 'An internal server error occurred. Please try again later.',
      })
    }
  } else {
    // In development, show full error details
    res.status(statusCode).json({
      error: err.message,
      stack: err.stack,
      ...(err instanceof OperationalError && { statusCode }),
    })
  }
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new OperationalError(`Route ${req.originalUrl} not found`, 404)
  next(error)
}
