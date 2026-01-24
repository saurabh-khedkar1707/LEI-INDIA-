import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminUser {
  username: string
  role: string
}

interface AdminAuthState {
  token: string | null
  user: AdminUser | null
  isAuthenticated: boolean
  login: (token: string, user: AdminUser) => void
  logout: () => void
  verifyToken: () => Promise<boolean>
}

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token: string, user: AdminUser) => {
        set({ token, user, isAuthenticated: true })
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
      },

      verifyToken: async () => {
        const { token } = get()
        if (!token) {
          return false
        }

        try {
          const { apiClient } = await import('@/lib/api-client')
          const data = await apiClient.post<{
            valid: boolean
            user: AdminUser
          }>('/api/admin/auth/verify', {}, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          if (data.valid) {
            set({ user: data.user, isAuthenticated: true })
            return true
          } else {
            get().logout()
            return false
          }
        } catch (error) {
          get().logout()
          return false
        }
      },
    }),
    {
      name: 'admin-auth-storage',
    }
  )
)
