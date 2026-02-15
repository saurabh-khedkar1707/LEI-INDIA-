'use client'

import { useEffect, useState } from 'react'
import { useProductFilters } from '@/hooks/use-product-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Category } from '@/types'

interface FilterOptions {
  connectorTypes: string[]
  codings: string[]
  ipRatings: string[]
  pins: number[]
  genders: string[]
}

export function FilterSidebar() {
  const { filters, updateFilters, clearFilters } = useProductFilters()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    connectorTypes: [],
    codings: [],
    ipRatings: [],
    pins: [],
    genders: [],
  })
  const [isLoadingFilters, setIsLoadingFilters] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin
        const response = await fetch(`${baseUrl}/api/categories?limit=1000`)
        if (response.ok) {
          const data = await response.json()
          setCategories(Array.isArray(data) ? data : (data.categories || []))
        }
      } catch (error) {
        // Error handled silently - categories are optional for filtering
      } finally {
        setIsLoadingCategories(false)
      }
    }

    const fetchFilterOptions = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin
        const response = await fetch(`${baseUrl}/api/products/filter-options`)
        if (response.ok) {
          const data = await response.json()
          
          // Debug logging in development
          if (process.env.NODE_ENV === 'development') {
            console.log('Filter options received:', {
              connectorTypes: data.connectorTypes?.length || 0,
              codings: data.codings?.length || 0,
              ipRatings: data.ipRatings?.length || 0,
              pins: data.pins?.length || 0,
              genders: data.genders?.length || 0,
              pinsData: data.pins,
              gendersData: data.genders,
            })
          }
          
          setFilterOptions({
            connectorTypes: Array.isArray(data.connectorTypes) ? data.connectorTypes : [],
            codings: Array.isArray(data.codings) ? data.codings : [],
            ipRatings: Array.isArray(data.ipRatings) ? data.ipRatings : [],
            pins: Array.isArray(data.pins) ? data.pins : [],
            genders: Array.isArray(data.genders) ? data.genders : [],
          })
        } else {
          console.error('Failed to fetch filter options:', response.status, response.statusText)
        }
      } catch (error) {
        // Error handled silently - use empty arrays as fallback
        console.error('Failed to fetch filter options:', error)
      } finally {
        setIsLoadingFilters(false)
      }
    }

    fetchCategories()
    fetchFilterOptions()
  }, [])

  // Build hierarchical category structure
  const buildCategoryTree = () => {
    const categoryMap = new Map<string, Category>()
    const rootCategories: Category[] = []

    // Build map
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    // Build hierarchy
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId)
        if (parent) {
          if (!parent.children) parent.children = []
          parent.children.push(category)
        }
      } else {
        rootCategories.push(category)
      }
    })

    return rootCategories
  }

  const renderCategoryTree = (cats: Category[], level = 0) => {
    const selectedCategoryIds = Array.isArray(filters.categoryId) 
      ? filters.categoryId 
      : filters.categoryId 
        ? [filters.categoryId] 
        : []
    
    return cats.map((category) => {
      const isChecked = selectedCategoryIds.includes(category.id)
      
      return (
        <div key={category.id} className={level > 0 ? 'ml-4' : ''}>
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`category-${category.id}`}
              checked={isChecked}
              onCheckedChange={(checked) => {
                const currentIds = Array.isArray(filters.categoryId) 
                  ? filters.categoryId 
                  : filters.categoryId 
                    ? [filters.categoryId] 
                    : []
                
                let newCategoryIds: string[] | undefined
                if (checked) {
                  newCategoryIds = [...currentIds, category.id]
                } else {
                  newCategoryIds = currentIds.filter(id => id !== category.id)
                }
                
                updateFilters({
                  categoryId: newCategoryIds.length > 0 ? newCategoryIds : undefined,
                  category: undefined, // Clear slug when using categoryId
                })
              }}
            />
            <Label
              htmlFor={`category-${category.id}`}
              className="text-sm font-normal cursor-pointer"
            >
              {category.name}
            </Label>
          </div>
          {category.children && category.children.length > 0 && (
            <div className="mt-1 space-y-1">
              {renderCategoryTree(category.children, level + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  const handleFilterChange = (
    filterKey: keyof typeof filters,
    value: string | number,
    checked: boolean
  ) => {
    const current = filters[filterKey] as any[] || []
    if (checked) {
      updateFilters({
        [filterKey]: [...current, value],
      })
    } else {
      updateFilters({
        [filterKey]: current.filter((v) => v !== value),
      })
    }
  }

  const handleInStockChange = (checked: boolean) => {
    updateFilters({
      inStock: checked ? true : undefined,
    })
  }

  return (
    <div className="space-y-4">
      <Card className="glass sticky top-20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
              aria-label="Clear all filters"
            >
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Category */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Category</Label>
            {isLoadingCategories ? (
              <div className="text-sm text-gray-500">Loading categories...</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {renderCategoryTree(buildCategoryTree())}
              </div>
            )}
          </div>

          {/* Connector Type */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Connector Type</Label>
            {isLoadingFilters ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : filterOptions.connectorTypes.length > 0 ? (
              <div className="space-y-2">
                {filterOptions.connectorTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.connectorType?.includes(type) || false}
                      onCheckedChange={(checked) =>
                        handleFilterChange('connectorType', type, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`type-${type}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No connector types available</div>
            )}
          </div>

          {/* Coding */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Coding</Label>
            {isLoadingFilters ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : filterOptions.codings.length > 0 ? (
              <div className="space-y-2">
                {filterOptions.codings.map((coding) => (
                  <div key={coding} className="flex items-center space-x-2">
                    <Checkbox
                      id={`coding-${coding}`}
                      checked={filters.coding?.includes(coding) || false}
                      onCheckedChange={(checked) =>
                        handleFilterChange('coding', coding, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`coding-${coding}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {coding}-Code
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No codings available</div>
            )}
          </div>

          {/* Pins */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Pin Count</Label>
            {isLoadingFilters ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : filterOptions.pins.length > 0 ? (
              <div className="space-y-2">
                {filterOptions.pins.map((pin) => (
                  <div key={pin} className="flex items-center space-x-2">
                    <Checkbox
                      id={`pin-${pin}`}
                      checked={filters.pins?.includes(pin) || false}
                      onCheckedChange={(checked) =>
                        handleFilterChange('pins', pin, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`pin-${pin}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {pin} Pin
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No pin counts available</div>
            )}
          </div>

          {/* IP Rating */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">IP Rating</Label>
            {isLoadingFilters ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : filterOptions.ipRatings.length > 0 ? (
              <div className="space-y-2">
                {filterOptions.ipRatings.map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ip-${rating}`}
                      checked={filters.ipRating?.includes(rating) || false}
                      onCheckedChange={(checked) =>
                        handleFilterChange('ipRating', rating, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`ip-${rating}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {rating}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No IP ratings available</div>
            )}
          </div>

          {/* Gender */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Gender</Label>
            {isLoadingFilters ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : filterOptions.genders.length > 0 ? (
              <div className="space-y-2">
                {filterOptions.genders.map((gender) => (
                  <div key={gender} className="flex items-center space-x-2">
                    <Checkbox
                      id={`gender-${gender}`}
                      checked={filters.gender?.includes(gender) || false}
                      onCheckedChange={(checked) =>
                        handleFilterChange('gender', gender, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`gender-${gender}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {gender}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No genders available</div>
            )}
          </div>

          {/* In Stock */}
          <div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inStock"
                checked={filters.inStock || false}
                onCheckedChange={handleInStockChange}
              />
              <Label htmlFor="inStock" className="text-sm font-normal cursor-pointer">
                In Stock Only
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
