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
import Image from 'next/image'
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
import { Product, Category } from '@/types'
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Upload,
  X,
  FileText,
} from 'lucide-react'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiClient } from '@/lib/api-client'

const productSchema = z.object({
  mpn: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  productType: z.string().optional(),
  coupling: z.string().optional(),
  degreeOfProtection: z.enum(['IP67', 'IP68', 'IP20']).optional(),
  wireCrossSection: z.string().optional(),
  temperatureRange: z.string().optional(),
  cableDiameter: z.string().optional(),
  cableMantleColor: z.string().optional(),
  cableMantleMaterial: z.string().optional(),
  cableLength: z.string().optional(),
  glandMaterial: z.string().optional(),
  housingMaterial: z.string().optional(),
  pinContact: z.string().optional(),
  socketContact: z.string().optional(),
  cableDragChainSuitable: z.boolean().optional(),
  tighteningTorqueMax: z.string().optional(),
  bendingRadiusFixed: z.string().optional(),
  bendingRadiusRepeated: z.string().optional(),
  contactPlating: z.string().optional(),
  operatingVoltage: z.string().optional(),
  ratedCurrent: z.string().optional(),
  halogenFree: z.boolean().optional(),
  connectorType: z.enum(['M12', 'M8', 'RJ45']).optional(),
  code: z.enum(['A', 'B', 'D', 'X']).optional(),
  strippingForce: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  images: z.array(z.string()).optional(),
  documents: z.array(z.object({
    url: z.string(),
    filename: z.string(),
    size: z.number().optional(),
  })).optional(),
  datasheetUrl: z.string().optional(),
  drawingUrl: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

export default function AdminProductsPage() {
  const { isAuthenticated } = useAdminAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [productImages, setProductImages] = useState<string[]>([])
  const [uploadingDocuments, setUploadingDocuments] = useState(false)
  const [productDocuments, setProductDocuments] = useState<Array<{ url: string; filename: string; size?: number }>>([])
  const [uploadingDatasheet, setUploadingDatasheet] = useState(false)
  const [datasheetUrl, setDatasheetUrl] = useState<string>('')
  const [uploadingDrawing, setUploadingDrawing] = useState(false)
  const [drawingUrl, setDrawingUrl] = useState<string>('')
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
      images: [],
      documents: [],
    },
  })

  useEffect(() => {
    // Fetch data on mount
    fetchProducts().catch((error) => {
      console.error('Error fetching products in useEffect:', error)
      setError('Failed to load products. Please refresh the page.')
      setIsLoading(false)
    })
    // fetchCategories already has error handling, no need to wrap
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/categories?limit=1000`,
      )
      if (response.ok) {
        const data = await response.json()
        setCategories(Array.isArray(data.categories) ? data.categories : [])
      }
    } catch (error) {
      console.error('Failed to fetch categories', error)
    }
  }

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      // Fetch all products for admin (use high limit to get all)
      const data = await apiClient.get<{ products: Product[]; pagination?: any } | Product[]>(
        '/api/products?limit=10000',
      )
      // Handle both paginated and non-paginated responses
      if (Array.isArray(data)) {
        setProducts(data)
      } else if (data && typeof data === 'object' && 'products' in data) {
        setProducts(Array.isArray(data.products) ? data.products : [])
      } else {
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load products. Please refresh the page or try again later.'
      setError(errorMessage)
      // Set empty array to prevent rendering issues
      setProducts([])
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

      // Use fetch directly for FormData (apiClient doesn't handle FormData well)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/upload`,
        {
          method: 'POST',
          credentials: 'include',
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

  const handleDocumentUpload = async (file: File) => {
    if (!isAuthenticated) {
      alert('Authentication required. Please log in again.')
      return
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      alert('Document size must be less than 50MB')
      return
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document (.pdf, .doc, .docx)')
      return
    }

    setUploadingDocuments(true)
    try {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('type', 'document')

      // Use fetch directly for FormData (apiClient doesn't handle FormData well)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/upload`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      const newDocuments = [...productDocuments, {
        url: data.url,
        filename: data.filename || file.name,
        size: data.size || file.size,
      }]
      setProductDocuments(newDocuments)
      setValue('documents', newDocuments)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload document. Please try again.'
      alert(errorMessage)
    } finally {
      setUploadingDocuments(false)
    }
  }

  const removeDocument = (index: number) => {
    const newDocuments = productDocuments.filter((_, i) => i !== index)
    setProductDocuments(newDocuments)
    setValue('documents', newDocuments)
  }

  const handleDatasheetUpload = async (file: File) => {
    if (!isAuthenticated) {
      alert('Authentication required. Please log in again.')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB')
      return
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document (.pdf, .doc, .docx)')
      return
    }

    setUploadingDatasheet(true)
    try {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('type', 'document')

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/upload`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      setDatasheetUrl(data.url)
      setValue('datasheetUrl', data.url)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload datasheet. Please try again.'
      alert(errorMessage)
    } finally {
      setUploadingDatasheet(false)
    }
  }

  const handleDrawingUpload = async (file: File) => {
    if (!isAuthenticated) {
      alert('Authentication required. Please log in again.')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB')
      return
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'application/octet-stream', // For CAD files
    ]
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, Word document, or image file')
      return
    }

    setUploadingDrawing(true)
    try {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('type', 'document')

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/upload`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      setDrawingUrl(data.url)
      setValue('drawingUrl', data.url)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload drawing. Please try again.'
      alert(errorMessage)
    } finally {
      setUploadingDrawing(false)
    }
  }

  const openCreateDialog = () => {
    setEditingProduct(null)
    setProductImages([])
    setProductDocuments([])
    setDatasheetUrl('')
    setDrawingUrl('')
    reset({
      images: [],
      documents: [],
      categoryId: undefined, // Will be converted to __none__ for Select component
      datasheetUrl: '',
      drawingUrl: '',
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setProductImages(product.images || [])
    setProductDocuments(product.documents || [])
    setDatasheetUrl(product.datasheetUrl || '')
    setDrawingUrl(product.drawingUrl || '')
    reset({
      mpn: product.mpn || '',
      description: product.description || '',
      categoryId: product.categoryId || undefined,
      productType: product.productType || '',
      coupling: product.coupling || '',
      degreeOfProtection: product.degreeOfProtection || undefined,
      wireCrossSection: product.wireCrossSection || '',
      temperatureRange: product.temperatureRange || '',
      cableDiameter: product.cableDiameter || '',
      cableMantleColor: product.cableMantleColor || '',
      cableMantleMaterial: product.cableMantleMaterial || '',
      cableLength: product.cableLength || '',
      glandMaterial: product.glandMaterial || '',
      housingMaterial: product.housingMaterial || '',
      pinContact: product.pinContact || '',
      socketContact: product.socketContact || '',
      cableDragChainSuitable: product.cableDragChainSuitable ?? false,
      tighteningTorqueMax: product.tighteningTorqueMax || '',
      bendingRadiusFixed: product.bendingRadiusFixed || '',
      bendingRadiusRepeated: product.bendingRadiusRepeated || '',
      contactPlating: product.contactPlating || '',
      operatingVoltage: product.operatingVoltage || '',
      ratedCurrent: product.ratedCurrent || '',
      halogenFree: product.halogenFree ?? false,
      connectorType: product.connectorType || undefined,
      code: product.code || undefined,
      strippingForce: product.strippingForce || '',
      images: product.images || [],
      documents: product.documents || [],
      datasheetUrl: product.datasheetUrl || '',
      drawingUrl: product.drawingUrl || '',
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: ProductFormData) => {
    if (!isAuthenticated) {
      alert('Authentication required. Please log in again.')
      return
    }

    try {
      // Ensure description is not empty
      if (!data.description || data.description.trim().length === 0) {
        alert('Description is required. Please enter a product description.')
        return
      }

      const productData = {
        ...data,
        description: data.description.trim(),
        images: productImages || [],
        documents: productDocuments || [],
        datasheetUrl: datasheetUrl || undefined,
        drawingUrl: drawingUrl || undefined,
        // Ensure categoryId is valid UUID or undefined (handle __none__ special value)
        categoryId: data.categoryId && data.categoryId.trim() && data.categoryId !== '__none__' 
          ? data.categoryId.trim() 
          : undefined,
      }

      // Get CSRF token for state-changing operations
      const csrfToken = await apiClient.getCsrfToken()

      if (editingProduct) {
        await apiClient.put(`/api/products/${editingProduct.id}`, productData, {
          headers: {
            'X-CSRF-Token': csrfToken,
          },
        })
      } else {
        await apiClient.post('/api/products', productData, {
          headers: {
            'X-CSRF-Token': csrfToken,
          },
        })
      }

      setIsDialogOpen(false)
      await fetchProducts()
      reset()
      setProductImages([])
      setProductDocuments([])
      setDatasheetUrl('')
      setDrawingUrl('')
    } catch (error: any) {
      // Handle validation errors with details
      let errorMessage = 'Failed to save product. Please try again.'
      
      if (error?.data?.details && Array.isArray(error.data.details)) {
        const errorMessages = error.data.details.map((d: any) => `${d.field}: ${d.message}`).join('\n')
        errorMessage = `Validation failed:\n${errorMessages}`
      } else if (error?.data?.error) {
        errorMessage = error.data.error
      } else if (error?.message) {
        errorMessage = error.message
      }
      
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
      
      // Get CSRF token for state-changing operations
      const csrfToken = await apiClient.getCsrfToken()
      
      await apiClient.delete(`/api/products/${productToDelete}`, {
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      })

      setDeleteDialogOpen(false)
      setProductToDelete(null)
      await fetchProducts()
    } catch (error) {
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
                <TableHead>MPN</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Product Type</TableHead>
                <TableHead>Connector Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.mpn || 'N/A'}</TableCell>
                    <TableCell className="max-w-md truncate">{product.description}</TableCell>
                    <TableCell>{product.productType || 'N/A'}</TableCell>
                    <TableCell>{product.connectorType || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(product)}
                          aria-label={`Edit product ${product.mpn || product.id}`}
                        >
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(product.id)}
                          aria-label={`Delete product ${product.mpn || product.id}`}
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

            <div>
              <Label htmlFor="categoryId">Category</Label>
              <Select
                onValueChange={(value) => {
                  // Convert "__none__" to undefined for "no category"
                  setValue('categoryId', value === '__none__' ? undefined : value)
                }}
                value={watch('categoryId') || '__none__'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="__none__">No Category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-red-500">{errors.categoryId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mpn">MPN</Label>
                <Input id="mpn" {...register('mpn')} placeholder="Manufacturer part number" />
              </div>

              <div>
                <Label htmlFor="productType">Product Type</Label>
                <Input id="productType" {...register('productType')} placeholder="Product type" />
              </div>

              <div>
                <Label htmlFor="coupling">Coupling</Label>
                <Input id="coupling" {...register('coupling')} placeholder="Coupling type" />
              </div>

              <div>
                <Label htmlFor="degreeOfProtection">Degree of Protection</Label>
                <Select
                  onValueChange={(value) => setValue('degreeOfProtection', value as any)}
                  value={watch('degreeOfProtection') || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select degree of protection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IP67">IP67</SelectItem>
                    <SelectItem value="IP68">IP68</SelectItem>
                    <SelectItem value="IP20">IP20</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="wireCrossSection">Wire Cross Section</Label>
                <Input id="wireCrossSection" {...register('wireCrossSection')} placeholder="e.g., 0.5 mm²" />
              </div>

              <div>
                <Label htmlFor="temperatureRange">Temperature Range</Label>
                <Input id="temperatureRange" {...register('temperatureRange')} placeholder="e.g., -25°C to +85°C" />
              </div>

              <div>
                <Label htmlFor="cableDiameter">Cable Diameter</Label>
                <Input id="cableDiameter" {...register('cableDiameter')} placeholder="e.g., 6.5 mm" />
              </div>

              <div>
                <Label htmlFor="cableMantleColor">Color of Cable Mantle</Label>
                <Input id="cableMantleColor" {...register('cableMantleColor')} placeholder="e.g., Black, Gray" />
              </div>

              <div>
                <Label htmlFor="cableMantleMaterial">Material of Cable Mantle</Label>
                <Input id="cableMantleMaterial" {...register('cableMantleMaterial')} placeholder="Cable mantle material" />
              </div>

              <div>
                <Label htmlFor="cableLength">Cable Length</Label>
                <Input id="cableLength" {...register('cableLength')} placeholder="e.g., 1m, 2m" />
              </div>

              <div>
                <Label htmlFor="glandMaterial">Material of Gland</Label>
                <Input id="glandMaterial" {...register('glandMaterial')} placeholder="Gland material" />
              </div>

              <div>
                <Label htmlFor="housingMaterial">Housing Material</Label>
                <Input id="housingMaterial" {...register('housingMaterial')} placeholder="Housing material" />
              </div>

              <div>
                <Label htmlFor="pinContact">Pin Contact</Label>
                <Input id="pinContact" {...register('pinContact')} placeholder="Pin contact specification" />
              </div>

              <div>
                <Label htmlFor="socketContact">Socket Contact</Label>
                <Input id="socketContact" {...register('socketContact')} placeholder="Socket contact specification" />
              </div>

              <div>
                <Label htmlFor="tighteningTorqueMax">Tightening Torque Maximum</Label>
                <Input id="tighteningTorqueMax" {...register('tighteningTorqueMax')} placeholder="e.g., 0.4 Nm" />
              </div>

              <div>
                <Label htmlFor="bendingRadiusFixed">Bending Radius (Fixed)</Label>
                <Input id="bendingRadiusFixed" {...register('bendingRadiusFixed')} placeholder="e.g., 20 mm" />
              </div>

              <div>
                <Label htmlFor="bendingRadiusRepeated">Bending Radius (Repeated)</Label>
                <Input id="bendingRadiusRepeated" {...register('bendingRadiusRepeated')} placeholder="e.g., 15 mm" />
              </div>

              <div>
                <Label htmlFor="contactPlating">Contact Plating</Label>
                <Input id="contactPlating" {...register('contactPlating')} placeholder="e.g., Gold, Silver" />
              </div>

              <div>
                <Label htmlFor="operatingVoltage">Operating Voltage</Label>
                <Input id="operatingVoltage" {...register('operatingVoltage')} placeholder="e.g., 250V AC" />
              </div>

              <div>
                <Label htmlFor="ratedCurrent">Rated Current</Label>
                <Input id="ratedCurrent" {...register('ratedCurrent')} placeholder="e.g., 4A" />
              </div>

              <div>
                <Label htmlFor="connectorType">Connector Type</Label>
                <Select
                  onValueChange={(value) => setValue('connectorType', value as any)}
                  value={watch('connectorType') || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select connector type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M12">M12</SelectItem>
                    <SelectItem value="M8">M8</SelectItem>
                    <SelectItem value="RJ45">RJ45</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="code">Code</Label>
                <Select
                  onValueChange={(value) => setValue('code', value as any)}
                  value={watch('code') || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select code" />
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
                <Label htmlFor="strippingForce">Stripping Force</Label>
                <Input id="strippingForce" {...register('strippingForce')} placeholder="Stripping force specification" />
              </div>
            </div>

            {/* Boolean Specifications */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cableDragChainSuitable"
                  checked={watch('cableDragChainSuitable') || false}
                  onCheckedChange={(checked) => {
                    setValue('cableDragChainSuitable', checked === true, { shouldValidate: true })
                  }}
                />
                <Label htmlFor="cableDragChainSuitable" className="cursor-pointer">
                  Cable Drag Chain Suitable
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="halogenFree"
                  checked={watch('halogenFree') || false}
                  onCheckedChange={(checked) => {
                    setValue('halogenFree', checked === true, { shouldValidate: true })
                  }}
                />
                <Label htmlFor="halogenFree" className="cursor-pointer">
                  Halogen Free
                </Label>
              </div>
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
                    <div key={index} className="relative h-24">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL || ''}${url}`}
                        alt={`Product ${index + 1}`}
                        fill
                        className="object-cover rounded border"
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

            <div>
              <Label>Product Documents</Label>
              <p className="text-sm text-gray-500 mb-2">Upload PDF or Word documents (max 50MB each)</p>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleDocumentUpload(file)
                    }}
                    disabled={uploadingDocuments}
                    className="flex-1"
                  />
                  {uploadingDocuments && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
                <div className="space-y-2">
                  {productDocuments.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-md bg-gray-50"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.filename}
                          </p>
                          {doc.size && (
                            <p className="text-xs text-gray-500">
                              {(doc.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL || ''}${doc.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => removeDocument(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {productDocuments.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No documents uploaded</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product Datasheet</Label>
                <p className="text-sm text-gray-500 mb-2">Upload product datasheet (PDF or Word, max 50MB)</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleDatasheetUpload(file)
                      }}
                      disabled={uploadingDatasheet}
                      className="flex-1"
                    />
                    {uploadingDatasheet && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  {datasheetUrl && (
                    <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Datasheet
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL || ''}${datasheetUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => {
                            setDatasheetUrl('')
                            setValue('datasheetUrl', '')
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Product Drawing</Label>
                <p className="text-sm text-gray-500 mb-2">Upload product drawing (PDF, Word, or Image, max 50MB)</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleDrawingUpload(file)
                      }}
                      disabled={uploadingDrawing}
                      className="flex-1"
                    />
                    {uploadingDrawing && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  {drawingUrl && (
                    <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Drawing
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL || ''}${drawingUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => {
                            setDrawingUrl('')
                            setValue('drawingUrl', '')
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
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
