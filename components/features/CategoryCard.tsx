'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Category } from '@/types'
import { ArrowRight } from 'lucide-react'

interface CategoryCardProps {
  category: Category
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

export function CategoryCard({ category }: CategoryCardProps) {
  const [imageError, setImageError] = useState(false)
  const imageUrl = getImageUrl(category.image)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/products?category=${category.slug}`}>
        <Card className="h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="relative h-48 w-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 overflow-hidden">
            {imageUrl && !imageError ? (
              <Image
                src={imageUrl}
                alt={category.name}
                fill
                className="object-contain group-hover:scale-110 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <CardHeader>
            <CardTitle className="group-hover:text-primary transition-colors flex items-center justify-between">
              {category.name}
              <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {category.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-primary font-medium group-hover:underline">
              View Products →
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}
