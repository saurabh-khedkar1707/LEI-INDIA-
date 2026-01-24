/**
 * Centralized API client with error handling, retry logic, and timeout
 */

interface RequestOptions extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
}

interface ApiError extends Error {
  status?: number
  statusText?: string
  data?: any
}

class ApiClient {
  private baseUrl: string
  private csrfToken: string | null = null

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  }

  // Get authentication token from localStorage
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') {
      return null
    }
    return localStorage.getItem('authToken')
  }

  // Get headers with authentication and CSRF token
  private getHeaders(csrfToken: string | null, customHeaders?: HeadersInit): HeadersInit {
    const headers: HeadersInit = {
      ...customHeaders,
    }

    // Add CSRF token if available
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken
    }

    // Add Authorization token if available
    const authToken = this.getAuthToken()
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    return headers
  }

  // Fetch and store CSRF token from a GET request
  private async ensureCSRFToken(): Promise<string | null> {
    // If we already have a token, return it
    if (this.csrfToken) {
      return this.csrfToken
    }

    try {
      // Fetch CSRF token from a simple GET request using fetchWithTimeout
      // This ensures we use the same timeout and retry logic
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/products?limit=1`, {
        method: 'GET',
        credentials: 'include',
      })
      
      const token = response.headers.get('X-CSRF-Token')
      if (token) {
        this.csrfToken = token
        return token
      }
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', error)
    }

    return null
  }

  // Public method to initialize CSRF token (can be called on page load)
  async initializeCSRFToken(): Promise<void> {
    await this.ensureCSRFToken()
  }

  // Update CSRF token from response headers
  private updateCSRFToken(response: Response): void {
    const token = response.headers.get('X-CSRF-Token')
    if (token) {
      this.csrfToken = token
    }
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestOptions = {}
  ): Promise<Response> {
    const { timeout = 30000, retries = 3, retryDelay = 1000, ...fetchOptions } = options

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      
      // Retry logic for network errors
      if (retries > 0 && (error instanceof TypeError || error instanceof DOMException)) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return this.fetchWithTimeout(url, { ...options, retries: retries - 1 })
      }
      
      throw error
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = new Error(`API request failed: ${response.statusText}`)
      error.status = response.status
      error.statusText = response.statusText

      try {
        const data = await response.json()
        error.data = data
        error.message = data.error || error.message
      } catch {
        // Response is not JSON
      }

      // Handle specific error codes
      switch (response.status) {
        case 401:
          error.message = 'Authentication required. Please log in again.'
          // Clear auth token if exists
          if (typeof window !== 'undefined') {
            localStorage.removeItem('adminToken')
            localStorage.removeItem('authToken')
          }
          break
        case 403:
          error.message = 'You do not have permission to perform this action.'
          break
        case 404:
          error.message = 'The requested resource was not found.'
          break
        case 408:
          error.message = 'Request timed out. Please try again.'
          break
        case 429:
          error.message = 'Too many requests. Please wait a moment and try again.'
          break
        case 500:
          error.message = 'Server error. Please try again later.'
          break
        case 503:
          error.message = 'Service temporarily unavailable. Please try again later.'
          break
      }

      throw error
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T
    }

    return response.json()
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: 'GET',
      credentials: 'include',
    })
    // Update CSRF token from response
    this.updateCSRFToken(response)
    return this.handleResponse<T>(response)
  }

  async post<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    // Ensure we have a CSRF token before making POST request
    let csrfToken = await this.ensureCSRFToken()
    
    // If we still don't have a token, try fetching it one more time
    if (!csrfToken) {
      csrfToken = await this.ensureCSRFToken()
    }
    
    const url = `${this.baseUrl}${endpoint}`
    const headers = this.getHeaders(csrfToken, {
      'Content-Type': 'application/json',
      ...options.headers,
    })
    
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: 'POST',
      credentials: 'include',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })
    // Update CSRF token from response
    this.updateCSRFToken(response)
    return this.handleResponse<T>(response)
  }

  async put<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    // Ensure we have a CSRF token before making PUT request
    const csrfToken = await this.ensureCSRFToken()
    
    const url = `${this.baseUrl}${endpoint}`
    const headers = this.getHeaders(csrfToken, {
      'Content-Type': 'application/json',
      ...options.headers,
    })
    
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: 'PUT',
      credentials: 'include',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })
    // Update CSRF token from response
    this.updateCSRFToken(response)
    return this.handleResponse<T>(response)
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    // Ensure we have a CSRF token before making DELETE request
    const csrfToken = await this.ensureCSRFToken()
    
    const url = `${this.baseUrl}${endpoint}`
    const headers = this.getHeaders(csrfToken, options.headers)
    
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: 'DELETE',
      credentials: 'include',
      headers,
    })
    // Update CSRF token from response
    this.updateCSRFToken(response)
    return this.handleResponse<T>(response)
  }

  async upload<T>(endpoint: string, formData: FormData, options: RequestOptions = {}): Promise<T> {
    // Ensure we have a CSRF token before making upload request
    const csrfToken = await this.ensureCSRFToken()
    
    const url = `${this.baseUrl}${endpoint}`
    // Don't set Content-Type for FormData, browser will set it with boundary
    const headers = this.getHeaders(csrfToken, options.headers)
    
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    })
    // Update CSRF token from response
    this.updateCSRFToken(response)
    return this.handleResponse<T>(response)
  }
}

export const apiClient = new ApiClient()
export type { ApiError }
