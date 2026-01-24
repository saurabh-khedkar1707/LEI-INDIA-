'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { FilterState, ConnectorType, ConnectorCoding, PinCount, IPRating, ConnectorGender } from '@/types'

export function useProductFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const getFilters = useCallback((): FilterState => {
    return {
      connectorType: searchParams.get('connectorType')?.split(',').filter(Boolean) as ConnectorType[] | undefined,
      coding: searchParams.get('coding')?.split(',').filter(Boolean) as ConnectorCoding[] | undefined,
      pins: searchParams.get('pins')?.split(',').map(Number).filter(Boolean) as PinCount[] | undefined,
      ipRating: searchParams.get('ipRating')?.split(',').filter(Boolean) as IPRating[] | undefined,
      gender: searchParams.get('gender')?.split(',').filter(Boolean) as ConnectorGender[] | undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
    }
  }, [searchParams])

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    const current = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || (Array.isArray(value) && value.length === 0)) {
        current.delete(key)
      } else if (Array.isArray(value)) {
        current.set(key, value.join(','))
      } else {
        current.set(key, String(value))
      }
    })

    router.push(`${pathname}?${current.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  const clearFilters = useCallback(() => {
    router.push(pathname)
  }, [router, pathname])

  return {
    filters: getFilters(),
    updateFilters,
    clearFilters,
  }
}
