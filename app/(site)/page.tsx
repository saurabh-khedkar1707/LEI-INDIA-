import type { Metadata } from "next"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { HeroSlider } from "@/components/widgets/HeroSlider"
import { BentoResources } from "@/components/widgets/BentoResources"
import { CategoryCarousel } from "@/components/widgets/CategoryCarousel"
import { ProductCard } from "@/components/features/ProductCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { categories } from "@/lib/data"
import { Product } from "@/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, HeadphonesIcon, Package, Globe } from "lucide-react"
import { log } from "@/lib/logger"

export const metadata: Metadata = {
  title: "Home",
  description: "LEI Indias - Professional B2B supplier of M12, M8, and RJ45 industrial connectors, cables, and PROFINET products.",
}

async function getProducts(): Promise<Product[]> {
  try {
    // For server-side rendering, we need an absolute URL
    // In Next.js, we can use the request URL or construct it properly
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const url = new URL('/api/products', baseUrl)
    url.searchParams.set('limit', '6')
    const response = await fetch(url.toString(), {
      // Use force-cache for static generation, no-store would cause dynamic rendering
      cache: 'force-cache',
      // Add timeout for builds
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }
    const data = await response.json()
    return Array.isArray(data) ? data : (data.products || [])
  } catch (error) {
    log.warn('Failed to fetch products for homepage', {
      error: error instanceof Error ? error.message : String(error),
    })
    // Return empty array to prevent build failures
    return []
  }
}

export default async function HomePage() {
  const products = await getProducts()
  const featuredProducts = products.slice(0, 6)
  const whyChooseUs = [
    {
      icon: Package,
      title: "No MOQ",
      description: "Order any quantity without minimum order requirements",
    },
    {
      icon: HeadphonesIcon,
      title: "Technical Support",
      description: "Expert technical assistance for all your industrial needs",
    },
    {
      icon: CheckCircle2,
      title: "Kitting Facility",
      description: "Custom kitting and assembly services available",
    },
    {
      icon: Globe,
      title: "Global Partners",
      description: "Worldwide distribution network and partnerships",
    },
  ]

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <HeroSlider />

        {/* Product Categories Carousel */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Product Categories
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore our comprehensive range of industrial connectors and cables
              </p>
            </div>
            <CategoryCarousel categories={categories} />
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Featured Products
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Browse our most popular industrial connectors and cables
              </p>
            </div>
            {featuredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <div className="text-center">
                  <Button asChild size="lg">
                    <Link href="/products">View All Products</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600 mb-4">No featured products available at the moment.</p>
                <Button asChild size="lg">
                  <Link href="/products">View All Products</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose LEI Indias?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We provide exceptional service and support for all your industrial needs
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {whyChooseUs.map((item, index) => {
                const Icon = item.icon
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Resource Center */}
        {/* <BentoResources /> */}
      </main>
      <Footer />
    </>
  )
}
