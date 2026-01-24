/**
 * Structured logging utility
 * In production, integrate with services like Winston, Pino, or CloudWatch
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogContext {
  [key: string]: any
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    }
    return JSON.stringify(logEntry)
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage(LogLevel.ERROR, message, context))
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, context))
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage(LogLevel.INFO, message, context))
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context))
    }
  }

  // Request logging helper
  logRequest(req: any, res: any, responseTime?: number): void {
    const context: LogContext = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      statusCode: res.statusCode,
    }
    
    if (responseTime) {
      context.responseTime = `${responseTime}ms`
    }

    if (res.statusCode >= 500) {
      this.error('Request failed', context)
    } else if (res.statusCode >= 400) {
      this.warn('Request error', context)
    } else {
      this.info('Request completed', context)
    }
  }
}

export const logger = new Logger()
