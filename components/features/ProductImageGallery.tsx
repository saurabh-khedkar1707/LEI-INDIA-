'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageLightbox } from '@/components/features/ImageLightbox'

interface ProductImageGalleryProps {
  images: string[]
  mpn?: string
}

// Helper function to construct image URL
function getImageSrc(imageUrl: string): string {
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

export function ProductImageGallery({ images, mpn }: ProductImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const handleImageClick = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  if (!images || images.length === 0) {
    return null
  }

  const mainImage = images[0] || '/images/placeholder.jpg'
  const mainImageSrc = getImageSrc(mainImage)
  const isMainImageFullUrl = mainImageSrc.startsWith('http://') || mainImageSrc.startsWith('https://')

  return (
    <>
      <div>
        <div 
          className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => handleImageClick(0)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleImageClick(0)
            }
          }}
          aria-label="View enlarged image"
        >
          <Image
            src={mainImageSrc}
            alt={mpn || 'Product'}
            fill
            className="object-contain"
            priority
            unoptimized={!isMainImageFullUrl}
          />
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.slice(1).map((image, index) => {
              const imageSrc = getImageSrc(image)
              const isFullUrl = imageSrc.startsWith('http://') || imageSrc.startsWith('https://')
              return (
                <div 
                  key={index} 
                  className="relative aspect-square bg-gray-100 rounded overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleImageClick(index + 1)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleImageClick(index + 1)
                    }
                  }}
                  aria-label={`View enlarged image ${index + 2}`}
                >
                  <Image
                    src={imageSrc}
                    alt={`${mpn || 'Product'} ${index + 2}`}
                    fill
                    className="object-contain"
                    unoptimized={!isFullUrl}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={images}
        currentIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </>
  )
}
