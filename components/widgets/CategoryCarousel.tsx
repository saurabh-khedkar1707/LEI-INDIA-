'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { Category } from '@/types'

interface CategoryCarouselProps {
  categories: Category[]
}

// Helper function to get full image URL
function getImageUrl(imagePath: string | undefined): string {
  if (!imagePath) return ''
  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  // If it's a relative path, prepend API URL
  if (imagePath.startsWith('/')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    return `${apiUrl}${imagePath}`
  }
  return imagePath
}

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Safety check
  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No categories available.</p>
      </div>
    )
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400
      const currentScroll = scrollRef.current.scrollLeft
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount
      
      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="relative">
      {/* Left Arrow */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
        onClick={() => scroll('left')}
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-12"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-[300px]"
          >
            <Link
              href={`/products?category=${category.slug}`}
              className="group block"
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 group-hover:scale-105 overflow-hidden">
                <CategoryImage category={category} />
                <CardHeader>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {category.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {category.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Right Arrow */}
      <Button
        variant="outline"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
        onClick={() => scroll('right')}
        aria-label="Scroll right"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}

// Separate component for category image to manage error state per category
function CategoryImage({ category }: { category: Category }) {
  const [imageError, setImageError] = useState(false)
  const imageUrl = getImageUrl(category.image)

  return (
    <div className="relative h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 overflow-hidden">
      {imageUrl && !imageError ? (
        <Image
          src={imageUrl}
          alt={category.name}
          fill
          className="object-contain group-hover:scale-110 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, 300px"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">
            {category.name}
          </h3>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}
