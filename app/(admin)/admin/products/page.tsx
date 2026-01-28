'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/store/admin-auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Product } from '@/types'
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  technicalDescription: z.string().optional(),
  coding: z.enum(['A', 'B', 'D', 'X']),
  pins: z.number().min(3).max(12),
  ipRating: z.enum(['IP67', 'IP68', 'IP20']),
  gender: z.enum(['Male', 'Female']),
  connectorType: z.enum(['M12', 'M8', 'RJ45']),
  'specifications.material': z.string().optional(),
  'specifications.voltage': z.string().optional(),
  'specifications.current': z.string().optional(),
  'specifications.temperatureRange': z.string().optional(),
  'specifications.wireGauge': z.string().optional(),
  'specifications.cableLength': z.string().optional(),
  price: z.number().optional(),
  priceType: z.enum(['fixed', 'quote']),
  inStock: z.boolean(),
  stockQuantity: z.number().optional(),
  images: z.array(z.string()).optional(),
  datasheetUrl: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

export default function AdminProductsPage() {
  const { isAuthenticated } = useAdminAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [productImages, setProductImages] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      priceType: 'quote',
      inStock: true,
      images: [],
    },
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      // Fetch all products for admin (use high limit to get all)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/products?limit=10000`,
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch products' }))
        throw new Error(errorData.error || `Failed to fetch products: ${response.statusText}`)
      }
      
      const data = await response.json()
      // Handle both paginated and non-paginated responses
      setProducts(Array.isArray(data) ? data : (data.products || []))
    } catch (error) {
      console.error('Failed to fetch products:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load products. Please refresh the page or try again later.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!isAuthenticated) {
      alert('Authentication required. Please log in again.')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file')
      return
    }

    setUploadingImages(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      const newImages = [...productImages, data.url]
      setProductImages(newImages)
      setValue('images', newImages)
    } catch (error) {
      console.error('Image upload failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image. Please try again.'
      alert(errorMessage)
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    const newImages = productImages.filter((_, i) => i !== index)
    setProductImages(newImages)
    setValue('images', newImages)
  }

  const openCreateDialog = () => {
    setEditingProduct(null)
    setProductImages([])
    reset({
      priceType: 'quote',
      inStock: true,
      images: [],
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setProductImages(product.images || [])
    reset({
      ...product,
      pins: product.pins as any,
      'specifications.material': product.specifications.material,
      'specifications.voltage': product.specifications.voltage,
      'specifications.current': product.specifications.current,
      'specifications.temperatureRange': product.specifications.temperatureRange,
      'specifications.wireGauge': product.specifications.wireGauge,
      'specifications.cableLength': product.specifications.cableLength,
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: ProductFormData) => {
    if (!isAuthenticated) {
      alert('Authentication required. Please log in again.')
      return
    }

    try {
      const productData = {
        ...data,
        specifications: {
          material: data['specifications.material'] || '',
          voltage: data['specifications.voltage'] || '',
          current: data['specifications.current'] || '',
          temperatureRange: data['specifications.temperatureRange'] || '',
          wireGauge: data['specifications.wireGauge'],
          cableLength: data['specifications.cableLength'],
        },
        images: productImages,
      }

      const url = editingProduct
        ? `${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${editingProduct.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || ''}/api/products`

      const method = editingProduct ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save product' }))
        throw new Error(errorData.error || errorData.details?.[0]?.message || 'Failed to save product')
      }

      setIsDialogOpen(false)
      await fetchProducts()
      reset()
      setProductImages([])
    } catch (error) {
      console.error('Failed to save product:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save product. Please try again.'
      alert(errorMessage)
    }
  }

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!isAuthenticated || !productToDelete) {
      setError('Authentication required. Please log in again.')
      setDeleteDialogOpen(false)
      return
    }

    try {
      setIsDeleting(true)
      setError(null)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/products/${productToDelete}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete product' }))
        throw new Error(errorData.error || 'Failed to delete product')
      }

      setDeleteDialogOpen(false)
      setProductToDelete(null)
      await fetchProducts()
    } catch (error) {
      console.error('Failed to delete product:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product. Please try again.'
      setError(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-2">Manage your product catalog</p>
        </div>
        <Button onClick={openCreateDialog} aria-label="Add new product">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Product
        </Button>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-2"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.sku}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.connectorType}</TableCell>
                    <TableCell>
                      {product.inStock ? (
                        <span className="text-green-600">In Stock</span>
                      ) : (
                        <span className="text-red-600">Out of Stock</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.priceType === 'fixed' && product.price
                        ? `$${product.price}`
                        : 'Quote'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(product)}
                          aria-label={`Edit product ${product.name}`}
                        >
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(product.id)}
                          aria-label={`Delete product ${product.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
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

      {/* Product Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Create Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update product information'
                : 'Add a new product to your catalog'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" {...register('sku')} />
                {errors.sku && (
                  <p className="text-sm text-red-500">{errors.sku.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Input id="category" {...register('category')} />
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                {...register('description')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="coding">Coding *</Label>
                <Select
                  onValueChange={(value) => setValue('coding', value as any)}
                  defaultValue={watch('coding')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select coding" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="X">X</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pins">Pins *</Label>
                <Input
                  id="pins"
                  type="number"
                  {...register('pins', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label htmlFor="ipRating">IP Rating *</Label>
                <Select
                  onValueChange={(value) => setValue('ipRating', value as any)}
                  defaultValue={watch('ipRating')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select IP rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IP67">IP67</SelectItem>
                    <SelectItem value="IP68">IP68</SelectItem>
                    <SelectItem value="IP20">IP20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  onValueChange={(value) => setValue('gender', value as any)}
                  defaultValue={watch('gender')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="connectorType">Connector Type *</Label>
                <Select
                  onValueChange={(value) => setValue('connectorType', value as any)}
                  defaultValue={watch('connectorType')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M12">M12</SelectItem>
                    <SelectItem value="M8">M8</SelectItem>
                    <SelectItem value="RJ45">RJ45</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priceType">Price Type *</Label>
                <Select
                  onValueChange={(value) => setValue('priceType', value as any)}
                  defaultValue={watch('priceType')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                    <SelectItem value="quote">Quote Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {watch('priceType') === 'fixed' && (
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register('price', { valueAsNumber: true })}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inStock">Stock Status</Label>
                <Select
                  onValueChange={(value) => setValue('inStock', value === 'true')}
                  defaultValue={watch('inStock')?.toString()}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">In Stock</SelectItem>
                    <SelectItem value="false">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {watch('inStock') && (
                <div>
                  <Label htmlFor="stockQuantity">Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    {...register('stockQuantity', { valueAsNumber: true })}
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Product Images</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                    }}
                    disabled={uploadingImages}
                    className="flex-1"
                  />
                  {uploadingImages && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {productImages.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL || ''}${url}`}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
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
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}
