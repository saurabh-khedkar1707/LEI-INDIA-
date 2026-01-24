import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
  role: string
}

interface UserAuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  initialize: () => void
}

export const useUserAuth = create<UserAuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token: string, user: User) => {
        // Also store in localStorage for backward compatibility
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token)
          localStorage.setItem('user', JSON.stringify(user))
        }
        set({ token, user, isAuthenticated: true })
      },

      logout: () => {
        // Clear localStorage for backward compatibility
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
        }
        set({ token: null, user: null, isAuthenticated: false })
      },

      initialize: () => {
        // Initialize from localStorage if available (for backward compatibility)
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('authToken')
          const storedUser = localStorage.getItem('user')
          
          if (storedToken && storedUser) {
            try {
              const user = JSON.parse(storedUser)
              set({ token: storedToken, user, isAuthenticated: true })
            } catch (error) {
              // If parsing fails, clear invalid data
              localStorage.removeItem('authToken')
              localStorage.removeItem('user')
            }
          }
        }
      },
    }),
    {
      name: 'user-auth-storage',
    }
  )
)
