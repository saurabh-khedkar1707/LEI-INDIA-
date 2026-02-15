'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KineticText } from './KineticText'
import Link from 'next/link'
import Image from 'next/image'

interface HeroSlide {
  id: string
  title: string
  subtitle?: string
  description?: string
  image: string
  ctaText?: string
  ctaLink?: string
  displayOrder: number
  active: boolean
}

export function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        // Use relative URL for client-side fetch in Next.js
        const response = await fetch('/api/hero-slides')
        
        if (response.ok) {
          const data = await response.json()
          const activeSlides = Array.isArray(data) 
            ? data.filter((slide: HeroSlide) => slide.active)
            : []
          setSlides(activeSlides)
          setError(null)
        } else {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error || `Failed to fetch hero slides: ${response.status} ${response.statusText}`
          setError(errorMessage)
          setSlides([])
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch hero slides'
        setError(errorMessage)
        setSlides([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchSlides()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion || isPaused || slides.length === 0) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [prefersReducedMotion, isPaused, slides.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  // Don't render if loading
  if (isLoading) {
    return (
      <section className="relative h-[600px] md:h-[700px] overflow-hidden bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </section>
    )
  }

  // Show error message or placeholder if no slides
  if (slides.length === 0) {
    return (
      <section className="relative h-[600px] md:h-[700px] overflow-hidden bg-slate-900 flex items-center justify-center">
        <div className="text-center px-4">
          {error ? (
            <>
              <p className="text-white text-lg mb-4">Unable to load hero slides</p>
              <p className="text-gray-400 text-sm mb-6">{error}</p>
              <p className="text-gray-500 text-xs">
                Please check your database connection and ensure the HeroSlide table exists.
              </p>
            </>
          ) : (
            <>
              <p className="text-white text-lg mb-4">No hero slides available</p>
              <p className="text-gray-400 text-sm">
                Add hero slides from the admin panel to display them here.
              </p>
            </>
          )}
        </div>
      </section>
    )
  }

  const currentSlideData = slides[currentSlide]

  // Construct image URL safely - handle both absolute URLs and relative paths
  // In production on AWS, relative paths are prefixed with NEXT_PUBLIC_API_URL
  const getImageSrc = (imageUrl: string): string => {
    if (!imageUrl) return ''
    
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

  const imageSrc = currentSlideData.image ? getImageSrc(currentSlideData.image) : ''
  const isFullUrl = imageSrc.startsWith('http://') || imageSrc.startsWith('https://')

  return (
    <section
      className="relative h-[600px] md:h-[700px] overflow-hidden bg-slate-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image */}
      {imageSrc && (
        <div className="absolute inset-0 z-0">
          <Image
            src={imageSrc}
            alt={currentSlideData.title}
            fill
            className="object-contain"
            priority
            unoptimized={!isFullUrl}
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
        <div className="max-w-3xl text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {currentSlideData.subtitle && (
                <p className="text-primary text-sm font-semibold mb-2 uppercase tracking-wide">
                  {currentSlideData.subtitle}
                </p>
              )}
              <KineticText className="text-4xl md:text-6xl font-bold text-white mb-4">
                {currentSlideData.title}
              </KineticText>
              {currentSlideData.description && (
                <p className="text-lg md:text-xl text-white mb-8 max-w-2xl mx-auto">
                  {currentSlideData.description}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {currentSlideData.ctaText && currentSlideData.ctaLink && (
                  <Button asChild size="lg" className="text-lg px-8">
                    <Link href={currentSlideData.ctaLink}>
                      {currentSlideData.ctaText}
                    </Link>
                  </Button>
                )}
                {currentSlideData.ctaLink !== '/rfq' && (
                  <Button 
                    asChild 
                    size="lg" 
                    className="text-lg px-8 bg-gray-800 text-white border border-gray-600 hover:bg-gray-700"
                  >
                    <Link href="/rfq">
                      Request a Quote
                    </Link>
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors flex items-center justify-center"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors flex items-center justify-center"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-gray-500 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
