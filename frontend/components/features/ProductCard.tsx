'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useRFQStore } from '@/store/rfq-store'
import { useComparisonStore } from '@/store/comparison-store'
import { Product } from '@/types'
import { CheckCircle2, FileText, Scale } from 'lucide-react'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useRFQStore((state) => state.addItem)
  const { items, toggleItem } = useComparisonStore()
  const isSelectedForCompare = items.some((i) => i.id === product.id)

  const handleAddToRFQ = () => {
    addItem({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity: 1,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
        <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
          <Image
            src={product.images[0] || '/images/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {product.inStock && (
            <Badge className="absolute top-2 right-2 bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              In Stock
            </Badge>
          )}
        </div>
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
              <CardDescription className="text-sm">SKU: {product.sku}</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Checkbox
                id={`compare-${product.id}`}
                checked={isSelectedForCompare}
                onCheckedChange={() => toggleItem(product)}
                aria-label={`${isSelectedForCompare ? 'Remove' : 'Add'} ${product.name} to comparison`}
              />
              <label
                htmlFor={`compare-${product.id}`}
                className="text-xs text-gray-600 cursor-pointer flex items-center gap-1"
              >
                <Scale className="h-3 w-3" aria-hidden="true" />
                Compare
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {product.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">{product.connectorType}</Badge>
            <Badge variant="outline">{product.coding}-Code</Badge>
            <Badge variant="outline">{product.pins} Pin</Badge>
            <Badge variant="outline">{product.ipRating}</Badge>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleAddToRFQ}
            className="flex-1"
            size="sm"
            aria-label={`Add ${product.name} to RFQ`}
          >
            Add to RFQ
          </Button>
          <Button
            asChild
            variant="outline"
            className="flex-1"
            size="sm"
            aria-label={`View specifications for ${product.name}`}
          >
            <Link href={`/products/${product.id}`}>
              <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
              Specs
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
