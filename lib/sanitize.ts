import sanitizeHtml from 'sanitize-html'
import { log } from './logger'

/**
 * Configuration for HTML sanitization
 * Allows common safe HTML tags and attributes while removing dangerous ones
 */
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span', 'section', 'article',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    '*': ['class', 'id'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
  },
  // Remove all style attributes to prevent XSS
  allowedStyles: {},
  // Ensure links open safely
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.href && !attribs.href.startsWith('mailto:')) {
        attribs.target = '_blank'
        attribs.rel = 'noopener noreferrer'
      }
      return { tagName, attribs }
    },
  },
  // Remove empty tags
  exclusiveFilter: (frame) => {
    return frame.tag === 'p' && !frame.text.trim()
  },
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @param options - Optional custom sanitization options
 * @returns Sanitized HTML string
 */
export function sanitizeHtmlContent(
  html: string,
  options?: sanitizeHtml.IOptions,
): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  const finalOptions = options || sanitizeOptions

  try {
    return sanitizeHtml(html, finalOptions)
  } catch (error) {
    // If sanitization fails, return empty string as safe fallback
    log.error('HTML sanitization error', error)
    return ''
  }
}

/**
 * Sanitize plain text (removes all HTML)
 * Use this for fields that should only contain plain text
 */
export function sanitizePlainText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  })
}

/**
 * Sanitize rich text content (allows more formatting)
 * Use this for blog posts, product descriptions, etc.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtmlContent(html, {
    ...sanitizeOptions,
    // Allow more formatting options for rich text
    allowedTags: [
      ...sanitizeOptions.allowedTags!,
      'sub', 'sup', 'mark', 'del', 'ins',
    ],
  })
}

/**
 * Sanitize an object's string fields recursively
 * Useful for sanitizing entire request bodies
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fieldsToSanitize: (keyof T)[],
  sanitizer: (value: string) => string = sanitizeRichText,
): T {
  const sanitized = { ...obj }

  for (const field of fieldsToSanitize) {
    if (field in sanitized && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizer(sanitized[field]) as T[keyof T]
    }
  }

  return sanitized
}
