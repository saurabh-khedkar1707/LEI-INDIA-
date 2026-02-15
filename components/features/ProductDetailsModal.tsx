'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Product } from '@/types'
import { AddToRFQButton } from '@/components/features/AddToRFQButton'
import { Loader2, X } from 'lucide-react'

interface ProductDetailsModalProps {
  productId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Helper function to construct image URL
function getImageSrc(imageUrl: string | undefined): string {
  if (!imageUrl) {
    return '/images/placeholder.jpg'
  }
  
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  
  if (imageUrl.startsWith('/')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    return apiUrl ? `${apiUrl}${imageUrl}` : imageUrl
  }
  
  const normalized = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  return apiUrl ? `${apiUrl}${normalized}` : normalized
}

export function ProductDetailsModal({ productId, open, onOpenChange }: ProductDetailsModalProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && productId) {
      setIsLoading(true)
      setError(null)
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin
      const url = new URL(`/api/products/${productId}`, baseUrl)
      
      fetch(url.toString())
        .then(async (response) => {
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('Product not found')
            }
            throw new Error('Failed to fetch product')
          }
          return response.json()
        })
        .then((data) => {
          setProduct(data)
          setIsLoading(false)
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load product')
          setIsLoading(false)
        })
    } else if (!open) {
      // Reset state when modal closes
      setProduct(null)
      setError(null)
    }
  }, [open, productId])

  if (!open) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
        </DialogHeader>
        
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="py-12 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {product && !isLoading && (
          <div className="space-y-6">
            {/* Product Images */}
            <div>
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                <Image
                  src={getImageSrc(product.images[0])}
                  alt={product.mpn || product.description.substring(0, 50) || 'Product'}
                  fill
                  className="object-contain"
                  unoptimized={!getImageSrc(product.images[0]).startsWith('http')}
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1).map((image, index) => (
                    <div key={index} className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                      <Image
                        src={getImageSrc(image)}
                        alt={`${product.mpn || 'Product'} ${index + 2}`}
                        fill
                        className="object-contain"
                        unoptimized={!getImageSrc(image).startsWith('http')}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {product.mpn || product.description.substring(0, 50)}
                </h2>
                {product.mpn && (
                  <p className="text-lg text-gray-600 mb-4">MPN: {product.mpn}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {product.connectorType && <Badge>{product.connectorType}</Badge>}
                {product.code && <Badge>{product.code}-Code</Badge>}
                {product.degreeOfProtection && <Badge>{product.degreeOfProtection}</Badge>}
              </div>

              <p className="text-gray-700 mb-6">{product.description}</p>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <AddToRFQButton product={product} />
                <Button
                  asChild
                  variant="outline"
                  className="flex-1"
                >
                  <Link href={`/products/${product.id}`}>
                    View Full Details
                  </Link>
                </Button>
              </div>
            </div>

            {/* Quick Specs */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Specs</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  {product.operatingVoltage && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Operating Voltage</dt>
                      <dd className="text-sm font-semibold">{product.operatingVoltage}</dd>
                    </div>
                  )}
                  {product.ratedCurrent && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Rated Current</dt>
                      <dd className="text-sm font-semibold">{product.ratedCurrent}</dd>
                    </div>
                  )}
                  {product.temperatureRange && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Temperature Range</dt>
                      <dd className="text-sm font-semibold">{product.temperatureRange}</dd>
                    </div>
                  )}
                  {product.degreeOfProtection && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Degree of Protection</dt>
                      <dd className="text-sm font-semibold">{product.degreeOfProtection}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
