import { Request, Response, NextFunction } from 'express'

// Request timeout middleware
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set timeout for the request
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ error: 'Request timeout. Please try again.' })
      }
    }, timeoutMs)

    // Clear timeout when response is sent
    res.on('finish', () => {
      clearTimeout(timeout)
    })

    next()
  }
}

// Database query timeout helper
export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number = 10000,
  errorMessage: string = 'Operation timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ])
}
