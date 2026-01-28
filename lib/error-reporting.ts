import * as Sentry from '@sentry/nextjs'
import { log } from './logger'

interface ApiErrorContext {
  route: string
  message: string
  requestId?: string
  extras?: Record<string, unknown>
}

/**
 * Report an API error to both the structured logger and Sentry.
 *
 * This keeps API error handling consistent and ensures production
 * issues are observable rather than only logged to stdout.
 */
export function reportApiError(error: unknown, context: ApiErrorContext): void {
  const { route, message, requestId, extras } = context

  // Always log with structured context
  log.error(message, error instanceof Error ? error : undefined, {
    route,
    requestId,
    ...extras,
  })

  // Best-effort Sentry reporting – never throw from here
  try {
    const err =
      error instanceof Error
        ? error
        : new Error(message || 'Unhandled API error')

    Sentry.captureException(err, {
      tags: {
        source: 'api',
        route,
      },
      extra: {
        requestId,
        ...extras,
      },
    })
  } catch {
    // Ignore Sentry failures to avoid cascading errors
  }
}

