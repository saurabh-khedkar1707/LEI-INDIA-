'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRFQStore } from '@/store/rfq-store'
import { RFQForm } from '@/components/features/RFQForm'
import { Trash2, Plus, Minus } from 'lucide-react'
import { Product } from '@/types'
import Link from 'next/link'

export default function RFQPage() {
  const { items, removeItem, updateQuantity, clearItems } = useRFQStore()
  const [showForm, setShowForm] = useState(false)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      if (items.length === 0) {
        setProducts([])
        return
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        // Fetch only products that are in the RFQ store
        const productPromises = items.map((item) =>
          fetch(`${apiUrl}/api/products/${item.productId}`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
        )
        
        const fetchedProducts = await Promise.all(productPromises)
        setProducts(fetchedProducts.filter(Boolean) as Product[])
      } catch (error) {
        console.error('Failed to fetch products:', error)
        setProducts([])
      }
    }
    fetchProducts()
  }, [items])

  const getProduct = (productId: string) => {
    return products.find(p => p.id === productId)
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Request for Quote
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Your RFQ list is empty. Add products to get started.
              </p>
              <Button asChild size="lg">
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Request for Quote
            </h1>
            <p className="text-lg text-gray-600">
              {totalItems} item{totalItems !== 1 ? 's' : ''} in your RFQ
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* RFQ Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const product = getProduct(item.productId)
                if (!product) return null

                return (
                  <Card key={item.productId}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">SKU: {item.sku}</p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-12 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.productId)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <Link
                            href={`/products/${product.id}`}
                            className="text-sm text-primary hover:underline"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              <div className="flex justify-between items-center pt-4">
                <Button variant="outline" onClick={clearItems}>
                  Clear All
                </Button>
                <Button asChild>
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </div>
            </div>

            {/* RFQ Form */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Submit RFQ</CardTitle>
                  <CardDescription>
                    Fill in your company details to receive a quote
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RFQForm items={items} onSuccess={clearItems} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
