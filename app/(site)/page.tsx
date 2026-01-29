import type { Metadata } from "next"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { HeroSlider } from "@/components/widgets/HeroSlider"
import { BentoResources } from "@/components/widgets/BentoResources"
import { CategoryCard } from "@/components/features/CategoryCard"
import { ProductCard } from "@/components/features/ProductCard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Category, Product } from "@/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, HeadphonesIcon, Package, Globe } from "lucide-react"
import { log } from "@/lib/logger"
import { pgPool } from "@/lib/pg"

export const metadata: Metadata = {
  title: "Home",
  description: "LEI Indias - Professional B2B supplier of M12, M8, and RJ45 industrial connectors, cables, and PROFINET products.",
}

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = 'force-dynamic'

async function getProducts(): Promise<Product[]> {
  try {
    // Optimized: Direct database query eliminates HTTP overhead
    // Using prepared statement for better performance
    const result = await pgPool.query(
      `
      SELECT
        id, sku, name, category, description, "technicalDescription", coding, pins,
        "ipRating", gender, "connectorType", material, voltage, current,
        "temperatureRange", "wireGauge", "cableLength", price, "priceType",
        "inStock", "stockQuantity", images, documents, "datasheetUrl",
        "createdAt", "updatedAt"
      FROM "Product"
      WHERE "inStock" = true
      ORDER BY "createdAt" DESC
      LIMIT 6
      `,
    )
    return result.rows
  } catch (error) {
    log.error('Failed to fetch products for homepage', {
      error: error instanceof Error ? error.message : String(error),
    })
    // Return empty array to prevent build failures
    return []
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    // Optimized: Direct database query eliminates HTTP overhead
    // Using prepared statement for better performance
    const result = await pgPool.query(
      `
      SELECT id, name, slug, description, image, "parentId", "createdAt", "updatedAt"
      FROM "Category"
      ORDER BY "createdAt" ASC
      LIMIT 50
      `,
    )
    const categories = result.rows
    log.info(`Fetched ${categories.length} categories for homepage`)
    return categories
  } catch (error) {
    log.error('Failed to fetch categories for homepage', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    // Return empty array to prevent build failures
    return []
  }
}

export default async function HomePage() {
  const products = await getProducts()
  const categories = await getCategories()
  
  // Debug: Log categories to see what we're getting
  if (categories.length === 0) {
    log.warn('No categories found in database for homepage')
  } else {
    log.info(`Homepage rendering with ${categories.length} categories`, {
      categoryNames: categories.map(c => c.name),
    })
  }
  
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

        {/* Product Categories */}
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
            {categories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600">No categories available at the moment.</p>
              </div>
            )}
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
