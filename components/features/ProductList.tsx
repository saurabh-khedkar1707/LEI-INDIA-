'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductCard } from './ProductCard'
import { ProductPagination } from './ProductPagination'
import { Product, Category } from '@/types'

interface ProductsResponse {
  products: Product[]
  pagination: {
    limit: number
    cursor: string | null
    hasNext: boolean
    hasPrev: boolean
  }
}

export function ProductList() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [pagination, setPagination] = useState<ProductsResponse['pagination']>({
    limit: 10,
    cursor: null,
    hasNext: false,
    hasPrev: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch categories first for grouping
      try {
        const categoryResponse = await fetch(`/api/categories?limit=1000`)
        if (categoryResponse.ok) {
          const categoryData = await categoryResponse.json()
          const fetchedCategories = Array.isArray(categoryData.categories) ? categoryData.categories : []
          setCategories(fetchedCategories)
        }
      } catch (err) {
        console.error('Failed to fetch categories', err)
      }

      const params = new URLSearchParams()
      
      // Build filter params
      // Handle both categoryId (UUID) and category (slug)
      const categoryId = searchParams.get('categoryId')
      const categorySlug = searchParams.get('category')
      
      // If categoryId is provided, use it directly (supports comma-separated multiple IDs)
      if (categoryId) {
        params.set('categoryId', categoryId)
      } else if (categorySlug) {
        // If only category slug is provided, fetch categoryId from API
        try {
          const categoryResponse = await fetch(`/api/categories?limit=1000`)
          if (categoryResponse.ok) {
            const categoryData = await categoryResponse.json()
            const categories = Array.isArray(categoryData.categories) ? categoryData.categories : []
            const category = categories.find((c: any) => c.slug === categorySlug)
            if (category?.id) {
              params.set('categoryId', category.id)
            }
          }
        } catch (err) {
          console.error('Failed to fetch category by slug', err)
        }
      }
      
      const connectorType = searchParams.get('connectorType')
      if (connectorType) params.set('connectorType', connectorType)
      
      // Handle both 'code' and 'coding' parameters for backward compatibility
      const code = searchParams.get('code') || searchParams.get('coding')
      if (code) params.set('code', code)
      
      const degreeOfProtection = searchParams.get('degreeOfProtection') || searchParams.get('ipRating')
      if (degreeOfProtection) params.set('degreeOfProtection', degreeOfProtection)
      
      const pins = searchParams.get('pins')
      if (pins) params.set('pins', pins)
      
      const gender = searchParams.get('gender')
      if (gender) params.set('gender', gender)
      
      const inStock = searchParams.get('inStock')
      if (inStock) params.set('inStock', inStock)
      
      const search = searchParams.get('search')
      if (search) params.set('search', search)
      
      // Cursor-based pagination
      const cursor = searchParams.get('cursor')
      if (cursor) params.set('cursor', cursor)
      
      const limit = searchParams.get('limit')
      if (limit) params.set('limit', limit)

      const response = await fetch(`/api/products?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data: ProductsResponse = await response.json()
      setProducts(data.products)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">Loading products...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchProducts}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600 mb-4">No products found matching your criteria.</p>
        <p className="text-sm text-gray-500">Try adjusting your filters or search terms.</p>
      </div>
    )
  }

  // Check if any filters are applied (excluding pagination params: cursor, limit)
  const hasFilters = !!(
    searchParams.get('categoryId') ||
    searchParams.get('category') ||
    searchParams.get('connectorType') ||
    searchParams.get('code') ||
    searchParams.get('coding') ||
    searchParams.get('degreeOfProtection') ||
    searchParams.get('ipRating') ||
    searchParams.get('pins') ||
    searchParams.get('gender') ||
    searchParams.get('inStock') ||
    searchParams.get('search')
  )

  // If no filters are applied, show all products in a flat list
  if (!hasFilters) {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <ProductPagination
          cursor={products.length > 0 ? products[products.length - 1].id : null}
          nextCursor={pagination.cursor}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
        />
      </>
    )
  }

  // Group products by category when filters are applied
  const productsByCategory = new Map<string, { category: Category | null; products: Product[] }>()
  
  // Create a map for quick category lookup
  const categoryMap = new Map<string, Category>()
  categories.forEach(cat => {
    categoryMap.set(cat.id, cat)
  })
  
  // Group products
  products.forEach(product => {
    const categoryId = product.categoryId || 'uncategorized'
    const category = product.categoryId ? categoryMap.get(product.categoryId) || null : null
    
    if (!productsByCategory.has(categoryId)) {
      productsByCategory.set(categoryId, { category, products: [] })
    }
    productsByCategory.get(categoryId)!.products.push(product)
  })
  
  // Sort categories: selected categories first, then by name
  const selectedCategoryIds = searchParams.get('categoryId')?.split(',').filter(Boolean) || []
  const sortedCategories = Array.from(productsByCategory.entries()).sort(([idA, dataA], [idB, dataB]) => {
    const isSelectedA = selectedCategoryIds.includes(idA)
    const isSelectedB = selectedCategoryIds.includes(idB)
    
    if (isSelectedA && !isSelectedB) return -1
    if (!isSelectedA && isSelectedB) return 1
    
    const nameA = dataA.category?.name || 'Uncategorized'
    const nameB = dataB.category?.name || 'Uncategorized'
    return nameA.localeCompare(nameB)
  })

  return (
    <>
      <div className="space-y-12">
        {sortedCategories.map(([categoryId, { category, products: categoryProducts }]) => (
          <div key={categoryId}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <ProductPagination
        cursor={products.length > 0 ? products[products.length - 1].id : null}
        nextCursor={pagination.cursor}
        hasNext={pagination.hasNext}
        hasPrev={pagination.hasPrev}
      />
    </>
  )
}
