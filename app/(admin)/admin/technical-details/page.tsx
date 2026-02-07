'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/store/admin-auth-store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { technicalDetailsSchema } from '@/lib/cms-validation'
import { Product } from '@/types'

type TechnicalDetailsFormData = {
  productId?: string
  tab: 'sales' | 'technical'
  title?: string
  content?: string
  displayOrder: number
}

interface TechnicalDetail {
  id: string
  productId?: string
  tab: 'sales' | 'technical'
  title?: string
  content?: string
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export default function AdminTechnicalDetailsPage() {
  const { isAuthenticated } = useAdminAuth()
  const [details, setDetails] = useState<TechnicalDetail[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDetail, setEditingDetail] = useState<TechnicalDetail | null>(null)
  const [productFilter, setProductFilter] = useState<string>('all')
  const [tabFilter, setTabFilter] = useState<string>('all')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TechnicalDetailsFormData>({
    resolver: zodResolver(technicalDetailsSchema),
    defaultValues: {
      tab: 'sales',
      displayOrder: 0,
    },
  })

  useEffect(() => {
    fetchDetails()
    fetchProducts()
  }, [])

  const fetchDetails = async () => {
    try {
      const response = await fetch('/api/technical-details')
      if (!response.ok) throw new Error('Failed to fetch technical details')
      const data = await response.json()
      setDetails(Array.isArray(data) ? data : [])
    } catch {
      setDetails([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=1000')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(Array.isArray(data.products) ? data.products : [])
    } catch {
      setProducts([])
    }
  }

  const openCreateDialog = () => {
    setEditingDetail(null)
    reset({
      tab: 'sales',
      displayOrder: 0,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (detail: TechnicalDetail) => {
    setEditingDetail(detail)
    reset({
      productId: detail.productId || '',
      tab: detail.tab,
      title: detail.title || '',
      content: detail.content || '',
      displayOrder: detail.displayOrder,
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: TechnicalDetailsFormData) => {
    if (!isAuthenticated) return

    try {
      const url = editingDetail
        ? `/api/technical-details/${editingDetail.id}`
        : '/api/technical-details'

      const method = editingDetail ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          productId: data.productId || undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to save technical details')

      setIsDialogOpen(false)
      fetchDetails()
      reset()
    } catch {
      alert('Failed to save technical details')
    }
  }

  const handleDelete = async (id: string) => {
    if (!isAuthenticated || !confirm('Are you sure you want to delete this technical detail?')) return

    try {
      const response = await fetch(`/api/technical-details/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete technical details')

      fetchDetails()
    } catch {
      alert('Failed to delete technical details')
    }
  }

  const getProductName = (productId?: string) => {
    if (!productId) return 'General'
    const product = products.find(p => p.id === productId)
    return product ? (product.mpn || product.description.substring(0, 50) || 'Unknown Product') : 'Unknown Product'
  }

  const filteredDetails = details.filter(detail => {
    if (productFilter !== 'all' && detail.productId !== productFilter) return false
    if (tabFilter !== 'all' && detail.tab !== tabFilter) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Technical Details</h1>
          <p className="text-gray-600 mt-2">Manage Sales and Technical tabs for products</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Technical Details
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="product-filter">Filter by Product</Label>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="none">General (No Product)</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.mpn || product.description.substring(0, 50) || product.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tab-filter">Filter by Tab</Label>
              <Select value={tabFilter} onValueChange={setTabFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tabs</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Tab</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Display Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDetails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No technical details found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDetails.map((detail) => (
                  <TableRow key={detail.id}>
                    <TableCell className="font-medium">
                      {getProductName(detail.productId)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        detail.tab === 'sales' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {detail.tab.charAt(0).toUpperCase() + detail.tab.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{detail.title || '-'}</TableCell>
                    <TableCell>{detail.displayOrder}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(detail)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(detail.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDetail ? 'Edit Technical Details' : 'Create Technical Details'}
            </DialogTitle>
            <DialogDescription>
              {editingDetail
                ? 'Update technical details information'
                : 'Add technical details for Sales or Technical tab'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="productId">Product (Optional)</Label>
              <Select
                onValueChange={(value) => setValue('productId', value === 'none' ? undefined : value)}
                value={watch('productId') || 'none'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product or leave as General" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General (No specific product)</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.mpn || product.description.substring(0, 50) || product.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Leave as General to show for all products, or select a specific product
              </p>
            </div>

            <div>
              <Label htmlFor="tab">Tab *</Label>
              <Select
                onValueChange={(value: 'sales' | 'technical') => setValue('tab', value)}
                defaultValue={watch('tab')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
              {errors.tab && (
                <p className="text-sm text-red-500">{errors.tab.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} />
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <textarea
                id="content"
                {...register('content')}
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={10}
              />
            </div>

            <div>
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                {...register('displayOrder', { valueAsNumber: true })}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingDetail ? 'Update' : 'Create'} Technical Details
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
