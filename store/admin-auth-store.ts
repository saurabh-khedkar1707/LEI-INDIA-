import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminUser {
  username: string
  role: string
}

interface AdminAuthState {
  user: AdminUser | null
  isAuthenticated: boolean
  login: (user: AdminUser) => void
  logout: () => void
  verifyToken: () => Promise<boolean>
}

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      // Server sets the httpOnly admin_token cookie; the store only tracks user info.
      login: (user: AdminUser) => {
        set({ user, isAuthenticated: true })
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
      },

      verifyToken: async () => {
        try {
          const { apiClient } = await import('@/lib/api-client')
          const data = await apiClient.post<{
            valid: boolean
            user: AdminUser
          }>('/api/admin/auth/verify')

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
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
