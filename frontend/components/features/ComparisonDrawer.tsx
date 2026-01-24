'use client'

import { useMemo, useState, useEffect } from 'react'
import { useComparisonStore } from '@/store/comparison-store'
import { Product } from '@/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { X } from 'lucide-react'

export function ComparisonDrawer() {
  const { items, clear } = useComparisonStore()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      if (items.length === 0) {
        setProducts([])
        return
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        // Fetch only products that are in the comparison store
        const productPromises = items.map((item) =>
          fetch(`${apiUrl}/api/products/${item.id}`)
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null)
        )
        
        const fetchedProducts = await Promise.all(productPromises)
        setProducts(fetchedProducts.filter(Boolean) as Product[])
      } catch (error) {
        console.error('Failed to fetch products:', error)
        setProducts([])
      }
    }
    fetchProducts()
  }, [items])

  const comparedProducts = useMemo(
    () => items.map((i) => products.find((p) => p.id === i.id)).filter(Boolean),
    [items, products]
  )

  if (comparedProducts.length < 2) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center">
      <Sheet>
        <SheetTrigger asChild>
          <Button className="shadow-lg">
            Compare {comparedProducts.length} products
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
          <SheetHeader className="flex flex-row items-center justify-between">
            <SheetTitle>Technical Comparison</SheetTitle>
            <Button variant="ghost" size="icon" onClick={clear}>
              <X className="h-4 w-4" />
            </Button>
          </SheetHeader>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Specification</TableHead>
                  {comparedProducts.map((product) => (
                    <TableHead key={product!.id}>{product!.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">SKU</TableCell>
                  {comparedProducts.map((product) => (
                    <TableCell key={product!.id}>{product!.sku}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Connector Type</TableCell>
                  {comparedProducts.map((product) => (
                    <TableCell key={product!.id}>{product!.connectorType}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Coding</TableCell>
                  {comparedProducts.map((product) => (
                    <TableCell key={product!.id}>{product!.coding}-Code</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Pins</TableCell>
                  {comparedProducts.map((product) => (
                    <TableCell key={product!.id}>{product!.pins}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">IP Rating</TableCell>
                  {comparedProducts.map((product) => (
                    <TableCell key={product!.id}>{product!.ipRating}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Material</TableCell>
                  {comparedProducts.map((product) => (
                    <TableCell key={product!.id}>{product!.specifications.material}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Voltage</TableCell>
                  {comparedProducts.map((product) => (
                    <TableCell key={product!.id}>{product!.specifications.voltage}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Current</TableCell>
                  {comparedProducts.map((product) => (
                    <TableCell key={product!.id}>{product!.specifications.current}</TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Temperature Range</TableCell>
                  {comparedProducts.map((product) => (
                    <TableCell key={product!.id}>{product!.specifications.temperatureRange}</TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

