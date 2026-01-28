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
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
}

export const useUserAuth = create<UserAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      // The server sets the httpOnly cookie; the client store only tracks user info.
      login: (user: User) => {
        set({ user, isAuthenticated: true })
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'user-auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)
