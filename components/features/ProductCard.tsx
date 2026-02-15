'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useRFQStore } from '@/store/rfq-store'
import { useComparisonStore } from '@/store/comparison-store'
import { Product } from '@/types'
import { CheckCircle2, FileText, Scale } from 'lucide-react'
import { ImageLightbox } from '@/components/features/ImageLightbox'
import { ProductDetailsModal } from '@/components/features/ProductDetailsModal'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const addItem = useRFQStore((state) => state.addItem)
  const { items, toggleItem } = useComparisonStore()
  const isSelectedForCompare = items.some((i) => i.id === product.id)

  const handleAddToRFQ = () => {
    addItem({
      productId: product.id,
      sku: product.mpn || product.id,
      name: product.description.substring(0, 50) || product.mpn || product.id,
      quantity: 1,
    })
  }

  const handleImageClick = () => {
    if (product.images && product.images.length > 0) {
      setLightboxIndex(0)
      setLightboxOpen(true)
    }
  }

  const handleMPNClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setDetailsModalOpen(true)
  }

  // Construct image URL safely - handle both absolute URLs and relative paths
  // In production on AWS, relative paths are prefixed with NEXT_PUBLIC_API_URL
  const getImageSrc = (imageUrl: string | undefined): string => {
    if (!imageUrl) {
      // For placeholder, use relative path (served from public folder)
      return '/images/placeholder.jpg'
    }
    
    // If already a full URL, use it directly
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    
    // For relative paths (starting with /), prefix with API URL if available
    // This ensures images work correctly on AWS where they're served from the same domain
    if (imageUrl.startsWith('/')) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      // In production (AWS), prefix with API URL to create full URL
      // In development, use relative path (Next.js serves from public folder)
      return apiUrl ? `${apiUrl}${imageUrl}` : imageUrl
    }
    
    // Fallback: if no leading slash, add it
    const normalized = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    return apiUrl ? `${apiUrl}${normalized}` : normalized
  }

  const imageUrl = product.images && product.images.length > 0 && product.images[0]
    ? getImageSrc(product.images[0])
    : '/images/placeholder.jpg'

  // Determine if this is a full URL (for Next.js Image optimization)
  const isFullUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
        <div 
          className="relative aspect-square w-full bg-gray-100 overflow-hidden flex items-center justify-center cursor-pointer"
          onClick={handleImageClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleImageClick()
            }
          }}
          aria-label="View enlarged image"
        >
          {product.images && product.images.length > 0 && product.images[0] && !imageError ? (
            <Image
              src={imageUrl}
              alt={product.mpn || product.description.substring(0, 50) || 'Product'}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImageError(true)}
              unoptimized={!isFullUrl}
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full text-gray-400">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-lg line-clamp-2">{product.mpn || product.description.substring(0, 50)}</CardTitle>
              {product.mpn && (
                <CardDescription 
                  className="text-sm cursor-pointer hover:text-primary transition-colors"
                  onClick={handleMPNClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleMPNClick(e as any)
                    }
                  }}
                  aria-label="View product details"
                >
                  MPN: {product.mpn}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Checkbox
                id={`compare-${product.id}`}
                checked={isSelectedForCompare}
                onCheckedChange={() => toggleItem(product)}
                aria-label={`${isSelectedForCompare ? 'Remove' : 'Add'} product to comparison`}
              />
              <label
                htmlFor={`compare-${product.id}`}
                className="text-xs text-gray-600 cursor-pointer flex items-center gap-1"
              >
                <Scale className="h-3 w-3" aria-hidden="true" />
                Compare
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {product.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {product.connectorType && (
              <Badge variant="outline">{product.connectorType}</Badge>
            )}
            {product.code && (
              <Badge variant="outline">{product.code}-Code</Badge>
            )}
            {product.degreeOfProtection && (
              <Badge variant="outline">{product.degreeOfProtection}</Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleAddToRFQ}
            className="flex-1"
            size="sm"
            aria-label={`Add product to RFQ`}
          >
            Add to RFQ
          </Button>
          <Button
            asChild
            variant="outline"
            className="flex-1"
            size="sm"
            aria-label={`View specifications`}
          >
            <Link href={`/products/${product.id}`}>
              <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
              Specs
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Image Lightbox */}
      {product.images && product.images.length > 0 && (
        <ImageLightbox
          images={product.images}
          currentIndex={lightboxIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      )}

      {/* Product Details Modal */}
      <ProductDetailsModal
        productId={product.id}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />
    </motion.div>
  )
}
