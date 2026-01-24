import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger.js'

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()

  // Generate request ID for tracing
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  ;(req as any).requestId = requestId
  res.setHeader('X-Request-ID', requestId)

  // Log request start
  logger.debug('Request started', {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.socket.remoteAddress,
  })

  // Log response when finished
  res.on('finish', () => {
    const responseTime = Date.now() - startTime
    logger.logRequest(req, res, responseTime)
  })

  next()
}
