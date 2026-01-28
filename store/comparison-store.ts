import { create } from 'zustand'
import { Product } from '@/types'

interface ComparisonItem {
  id: string
}

interface ComparisonStore {
  items: ComparisonItem[]
  toggleItem: (product: Product) => void
  clear: () => void
}

export const useComparisonStore = create<ComparisonStore>((set, get) => ({
  items: [],
  toggleItem: (product) => {
    const { items } = get()
    const exists = items.some((i) => i.id === product.id)
    if (exists) {
      set({ items: items.filter((i) => i.id !== product.id) })
    } else {
      // Limit to 4 products in comparison
      const next = [...items, { id: product.id }]
      set({ items: next.slice(-4) })
    }
  },
  clear: () => set({ items: [] }),
}))

