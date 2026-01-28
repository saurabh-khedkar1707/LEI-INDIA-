import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { RFQItem } from '@/types'

interface RFQStore {
  items: RFQItem[]
  addItem: (item: RFQItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearItems: () => void
  getTotalItems: () => number
}

export const useRFQStore = create<RFQStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existingItem = get().items.find(i => i.productId === item.productId)
        if (existingItem) {
          set((state) => ({
            items: state.items.map(i =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          }))
        } else {
          set((state) => ({ items: [...state.items, item] }))
        }
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(i => i.productId !== productId)
        }))
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
        } else {
          set((state) => ({
            items: state.items.map(i =>
              i.productId === productId ? { ...i, quantity } : i
            )
          }))
        }
      },
      clearItems: () => {
        set({ items: [] })
      },
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      }
    }),
    {
      name: 'rfq-storage',
      // Expire after 7 days
      partialize: (state) => ({ items: state.items }),
    }
  )
)
