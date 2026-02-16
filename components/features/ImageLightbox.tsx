'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface ImageLightboxProps {
  images: string[]
  currentIndex: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function ImageLightbox({ images, currentIndex, open, onOpenChange }: ImageLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex ?? 0)

  useEffect(() => {
    if (currentIndex !== null) {
      setActiveIndex(currentIndex)
    }
  }, [currentIndex])

  const handlePrevious = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }, [images.length])

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }, [images.length])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, handlePrevious, handleNext, onOpenChange])

  if (!open || images.length === 0 || currentIndex === null) {
    return null
  }

  const currentImage = images[activeIndex]
  const imageSrc = getImageSrc(currentImage)
  const isFullUrl = imageSrc.startsWith('http://') || imageSrc.startsWith('https://')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Previous Button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-50 text-white hover:bg-white/20"
              onClick={handlePrevious}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Image */}
          <div className="relative w-full h-[95vh] flex items-center justify-center p-8">
            <Image
              src={imageSrc}
              alt={`Image ${activeIndex + 1} of ${images.length}`}
              fill
              className="object-contain"
              priority
              unoptimized={!isFullUrl}
            />
          </div>

          {/* Next Button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-50 text-white hover:bg-white/20"
              onClick={handleNext}
              aria-label="Next image"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded">
              {activeIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
