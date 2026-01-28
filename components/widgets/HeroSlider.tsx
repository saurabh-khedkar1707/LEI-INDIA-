'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KineticText } from './KineticText'
import Link from 'next/link'

const slides = [
  {
    id: 1,
    title: 'Industrial Connectors',
    subtitle: 'M12 & M8 Solutions',
    description: 'Professional grade connectors for sensors, actuators, and industrial automation',
    image: '/images/hero/m12-connectors.jpg',
    cta: 'Explore Products',
    ctaLink: '/products',
  },
  {
    id: 2,
    title: 'PROFINET Products',
    subtitle: 'Industrial Ethernet',
    description: 'High-performance PROFINET cordsets and cables for Industrial Ethernet applications',
    image: '/images/hero/profinet.jpg',
    cta: 'View Catalog',
    ctaLink: '/products?category=profinet-products',
  },
  {
    id: 3,
    title: 'No Minimum Order',
    subtitle: 'Flexible Solutions',
    description: 'Order any quantity with technical support and global partnerships',
    image: '/images/hero/industrial.jpg',
    cta: 'Request Quote',
    ctaLink: '/rfq',
  },
]

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion || isPaused) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [prefersReducedMotion, isPaused])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <section
      className="relative h-[600px] md:h-[700px] overflow-hidden bg-gray-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${slides[currentSlide].image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/50" />
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="max-w-3xl">
          <motion.div
            key={currentSlide}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-primary text-sm font-semibold mb-2 uppercase tracking-wide">
              {slides[currentSlide].subtitle}
            </p>
            <KineticText className="text-4xl md:text-6xl font-bold text-white mb-4">
              {slides[currentSlide].title}
            </KineticText>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl">
              {slides[currentSlide].description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href={slides[currentSlide].ctaLink}>
                  {slides[currentSlide].cta}
                </Link>
              </Button>
              {slides[currentSlide].ctaLink !== '/rfq' && (
                <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-white/10 text-white border-white/20 hover:bg-white/20">
                  <Link href="/rfq">
                    Request a Quote
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Slide Indicators & Pause */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        {!prefersReducedMotion && (
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            className="px-3 py-1 rounded-full bg-white/20 text-xs text-white hover:bg-white/30"
            aria-pressed={isPaused}
          >
            {isPaused ? 'Play' : 'Pause'}
          </button>
        )}
      </div>
    </section>
  )
}
