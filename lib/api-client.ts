/**
 * Centralized API client with error handling, retry logic, and timeout.
 *
 * Authentication is handled via httpOnly cookies set by the API routes.
 * This client intentionally does not read or write any tokens from localStorage.
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

  constructor() {
    // Use relative URL so that Next.js backend (App Router) handles all requests.
    // If NEXT_PUBLIC_API_URL is set, it should point to the same-origin API gateway.
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestOptions = {},
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
    return this.handleResponse<T>(response)
  }

  async post<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    }
    
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: 'POST',
      credentials: 'include',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async put<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    }
    
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: 'PUT',
      credentials: 'include',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: 'DELETE',
      credentials: 'include',
      headers: {
        ...(options.headers || {}),
      },
    })
    return this.handleResponse<T>(response)
  }

  async upload<T>(endpoint: string, formData: FormData, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await this.fetchWithTimeout(url, {
      ...options,
      method: 'POST',
      credentials: 'include',
      // Don't set Content-Type for FormData, browser will set it with boundary
      headers: {
        ...(options.headers || {}),
      },
      body: formData,
    })
    return this.handleResponse<T>(response)
  }
}

export const apiClient = new ApiClient()
export type { ApiError }
