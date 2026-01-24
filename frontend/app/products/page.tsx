import type { Metadata } from "next"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { ProductCard } from "@/components/features/ProductCard"
import { FilterSidebar } from "@/components/features/FilterSidebar"
import { ComparisonDrawer } from "@/components/features/ComparisonDrawer"
import { ProductPagination } from "@/components/features/ProductPagination"
import { Product } from "@/types"
import { categories } from "@/lib/data"

// Helper function to convert category slug to category name for database query
function getCategoryNameFromSlug(slug: string | undefined): string | undefined {
  if (!slug) return undefined
  const category = categories.find(c => c.slug === slug)
  return category ? category.name : slug // Fallback to slug if not found
}

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our complete catalog of M12, M8, RJ45, and PROFINET industrial connectors and cables.",
}

interface ProductsPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

interface ProductsResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

async function getProducts(searchParams: { [key: string]: string | string[] | undefined }): Promise<ProductsResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  
  // Build query string
  const params = new URLSearchParams()
  const page = searchParams.page as string | undefined
  if (page) params.set('page', page)
  
  if (searchParams.connectorType) params.set('connectorType', searchParams.connectorType as string)
  if (searchParams.coding) params.set('coding', searchParams.coding as string)
  if (searchParams.pins) params.set('pins', searchParams.pins as string)
  if (searchParams.ipRating) params.set('ipRating', searchParams.ipRating as string)
  if (searchParams.gender) params.set('gender', searchParams.gender as string)
  if (searchParams.inStock === 'true') params.set('inStock', 'true')
  if (searchParams.search) params.set('search', searchParams.search as string)
  // Convert category slug to category name for database query
  const categorySlug = searchParams.category as string | undefined
  const categoryName = getCategoryNameFromSlug(categorySlug)
  if (categoryName) params.set('category', categoryName)
  
  try {
    const response = await fetch(`${apiUrl}/api/products?${params.toString()}`, {
      cache: 'no-store', // Always fetch fresh data
    })
    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching products:', error)
    return {
      products: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    }
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Fetch products from API with pagination
  const { products, pagination } = await getProducts(searchParams)

  // Get active category name if category filter is applied
  const activeCategorySlug = searchParams.category as string | undefined
  const activeCategory = activeCategorySlug 
    ? categories.find(c => c.slug === activeCategorySlug)
    : null
  const pageTitle = activeCategory ? activeCategory.name : 'Industrial Connectors & Cables'

  return (
    <>
      <Header />
      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {pageTitle}
            </h1>
            <p className="text-lg text-gray-600">
              {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
              {pagination.totalPages > 1 && ` (Page ${pagination.page} of ${pagination.totalPages})`}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filter Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <FilterSidebar />
            </aside>

            {/* Product Grid */}
            <div className="flex-1 pb-16">
              {products.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  <ProductPagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    hasNext={pagination.hasNext}
                    hasPrev={pagination.hasPrev}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-gray-600 mb-4">No products found matching your criteria.</p>
                  <p className="text-sm text-gray-500">Try adjusting your filters or search terms.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <ComparisonDrawer />
      </main>
      <Footer />
    </>
  )
}
