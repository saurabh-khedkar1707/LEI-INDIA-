'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Product } from '@/types'
import { useRFQStore } from '@/store/rfq-store'
import { useUserAuth } from '@/store/user-auth-store'
import { ShoppingCart } from 'lucide-react'

interface AddToRFQButtonProps {
  product: Product
  quantity?: number
}

export function AddToRFQButton({ product, quantity = 1 }: AddToRFQButtonProps) {
  const router = useRouter()
  const addItem = useRFQStore((state) => state.addItem)
  const { isAuthenticated } = useUserAuth()

  const handleAdd = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/products/${product.id}`)
      return
    }

    // Add item to RFQ
    addItem({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity,
    })
  }

  return (
    <Button onClick={handleAdd} className="flex-1">
      <ShoppingCart className="h-4 w-4 mr-2" />
      Add to RFQ
    </Button>
  )
}
