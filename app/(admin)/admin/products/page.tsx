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
import { formatPriceSimple } from '@/lib/format-price'

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required').trim(),
  name: z.string().min(1, 'Name is required').trim(),
  mpn: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  productType: z.string().optional(),
  coupling: z.string().optional(),
  degreeOfProtection: z.union([
    z.enum(['IP67', 'IP68', 'IP20']),
    z.array(z.enum(['IP67', 'IP68', 'IP20'])),
    z.string(),
  ]).optional().transform((val) => {
    if (!val) return undefined
    if (Array.isArray(val)) {
      return val.length > 0 ? val.join(',') : undefined
    }
    if (typeof val === 'string') {
      // If it's already a comma-separated string, return as is
      return val
    }
    return val
  }),
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
  price: z.number().nonnegative('Price must be non-negative').optional(),
  priceType: z.enum(['per_unit', 'per_pack', 'per_bulk']).default('per_unit'),
  inStock: z.boolean().default(false),
  stockQuantity: z.number().int().nonnegative('Stock quantity must be non-negative').optional(),
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

// Safe image preview component with error handling
function ProductImagePreview({ url, index, onRemove }: { url: string; index: number; onRemove: () => void }) {
  const [imageError, setImageError] = useState(false)
  
  // Construct image URL safely
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const imageSrc = url.startsWith('http') ? url : (apiUrl ? `${apiUrl}${url}` : url)
  
  return (
    <div className="relative h-24 bg-gray-100 rounded border overflow-hidden">
      {!imageError ? (
        <Image
          src={imageSrc}
          alt={`Product image ${index + 1}`}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          unoptimized={imageSrc.startsWith('/')}
        />
      ) : (
        <div className="flex items-center justify-center h-full w-full text-gray-400">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6"
        onClick={onRemove}
        aria-label={`Remove image ${index + 1}`}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined)
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | undefined>(undefined)

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
    fetchProducts().catch(() => {
      setError('Failed to load products. Please refresh the page.')
      setIsLoading(false)
    })
    // fetchCategories already has error handling, no need to wrap
    fetchCategories()
  }, [])

  // When categories load and we're editing, re-determine category/subcategory
  useEffect(() => {
    if (editingProduct && categories.length > 0 && isDialogOpen) {
      if (editingProduct.categoryId && typeof editingProduct.categoryId === 'string' && editingProduct.categoryId.trim().length > 0) {
        const category = categories.find(cat => cat.id === editingProduct.categoryId)
        if (category) {
          if (category.parentId) {
            // It's a subcategory
            setSelectedSubcategoryId(category.id)
            setSelectedCategoryId(category.parentId)
            setValue('categoryId', category.id)
          } else {
            // It's a parent category
            setSelectedCategoryId(category.id)
            setSelectedSubcategoryId(undefined)
            setValue('categoryId', category.id)
          }
        }
      }
    }
  }, [categories, editingProduct, isDialogOpen, setValue])

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/categories?limit=1000`,
      )
      if (response.ok) {
        const data = await response.json()
        setCategories(Array.isArray(data.categories) ? data.categories : [])
      }
    } catch {
      // Silently fail - categories are optional
    }
  }

  // Get parent categories (categories without a parentId)
  const getParentCategories = (): Category[] => {
    return categories.filter(cat => !cat.parentId)
  }

  // Get subcategories for a given parent category
  const getSubcategories = (parentId: string): Category[] => {
    return categories.filter(cat => cat.parentId === parentId)
  }

  // Find the parent category for a given category (if it's a subcategory)
  const findParentCategory = (categoryId: string): Category | undefined => {
    const category = categories.find(cat => cat.id === categoryId)
    if (category?.parentId) {
      return categories.find(cat => cat.id === category.parentId)
    }
    return category
  }

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      // Fetch all products for admin (use high limit to get all)
      const data = await apiClient.get<{ products: Product[]; pagination?: any } | Product[]>(
        '/api/products?limit=10000',
      )
      
      // Normalize products: ensure price is a number or null
      const normalizeProduct = (product: Product): Product => ({
        ...product,
        price: product.price != null 
          ? (typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price))
          : undefined,
        stockQuantity: product.stockQuantity != null
          ? (typeof product.stockQuantity === 'string' ? parseInt(product.stockQuantity, 10) : Number(product.stockQuantity))
          : undefined,
      })
      
      // Handle both paginated and non-paginated responses
      let productsList: Product[] = []
      if (Array.isArray(data)) {
        productsList = data.map(normalizeProduct)
      } else if (data && typeof data === 'object' && 'products' in data) {
        productsList = Array.isArray(data.products) 
          ? data.products.map(normalizeProduct)
          : []
      }
      
      setProducts(productsList)
    } catch (error) {
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
      setError('Authentication required. Please log in again.')
      return
    }

    // Validate file exists and is valid
    if (!file || !(file instanceof File)) {
      setError('Invalid file selected. Please try again.')
      return
    }

    // Validate file size (5MB limit - note: server allows 10MB, but we enforce 5MB on client)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB. Please compress the image and try again.')
      return
    }

    // Validate file type
    if (!file.type || !file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP).')
      return
    }

    setUploadingImages(true)
    setError(null) // Clear previous errors
    
    try {
      const formData = new FormData()
      formData.append('image', file)

      // Construct API URL safely
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const uploadUrl = apiUrl ? `${apiUrl}/api/admin/upload` : '/api/admin/upload'

      // Use fetch directly for FormData (apiClient doesn't handle FormData well)
      const response = await fetch(uploadUrl, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = 'Upload failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || `Server returned error ${response.status}`
        }
        throw new Error(errorMessage)
      }

      // Parse response safely
      let data: { url?: string; error?: string }
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error('Invalid response from server. Please try again.')
      }

      // Validate response data
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server.')
      }

      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.url || typeof data.url !== 'string' || data.url.trim().length === 0) {
        throw new Error('Server did not return a valid image URL.')
      }

      // Safely update images array
      const currentImages = Array.isArray(productImages) ? productImages : []
      const newImages = [...currentImages, data.url]
      setProductImages(newImages)
      setValue('images', newImages, { shouldValidate: true })
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to upload image. Please check your connection and try again.'
      setError(errorMessage)
      console.error('Image upload error:', error)
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
    setSelectedCategoryId(undefined)
    setSelectedSubcategoryId(undefined)
    reset({
      sku: '',
      name: '',
      images: [],
      documents: [],
      categoryId: undefined, // Will be converted to __none__ for Select component
      datasheetUrl: '',
      drawingUrl: '',
      priceType: 'per_unit',
      inStock: false,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (product: Product) => {
    try {
      // Validate product data before proceeding
      if (!product || typeof product !== 'object') {
        throw new Error('Invalid product data')
      }

      // Safely extract arrays with validation
      const safeImages = Array.isArray(product.images) 
        ? product.images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
        : []
      
      const safeDocuments = Array.isArray(product.documents)
        ? product.documents.filter((doc): doc is { url: string; filename: string; size?: number } => 
            doc && typeof doc === 'object' && typeof doc.url === 'string' && doc.url.trim().length > 0
          )
        : []

      setEditingProduct(product)
      setProductImages(safeImages)
      setProductDocuments(safeDocuments)
      setDatasheetUrl(typeof product.datasheetUrl === 'string' ? product.datasheetUrl : '')
      setDrawingUrl(typeof product.drawingUrl === 'string' ? product.drawingUrl : '')
      
      // Determine if categoryId is a parent or subcategory
      let parentCategoryId: string | undefined = undefined
      let subcategoryId: string | undefined = undefined
      
      if (product.categoryId && typeof product.categoryId === 'string' && product.categoryId.trim().length > 0) {
        const category = categories.find(cat => cat.id === product.categoryId)
        if (category) {
          if (category.parentId) {
            // It's a subcategory
            subcategoryId = category.id
            parentCategoryId = category.parentId
          } else {
            // It's a parent category
            parentCategoryId = category.id
          }
        }
      }
      
      setSelectedCategoryId(parentCategoryId)
      setSelectedSubcategoryId(subcategoryId)
      
      reset({
        sku: typeof product.sku === 'string' ? product.sku : '',
        name: typeof product.name === 'string' ? product.name : '',
        mpn: typeof product.mpn === 'string' ? product.mpn : '',
        description: typeof product.description === 'string' ? product.description : '',
        categoryId: typeof product.categoryId === 'string' && product.categoryId.trim().length > 0 ? product.categoryId : undefined,
        productType: typeof product.productType === 'string' ? product.productType : '',
        coupling: typeof product.coupling === 'string' ? product.coupling : '',
        degreeOfProtection: (() => {
          const ipRating = product.degreeOfProtection
          if (!ipRating) return undefined
          // Handle comma-separated string from database
          if (typeof ipRating === 'string') {
            const ratings = ipRating.split(',').map(v => v.trim()).filter(Boolean)
            return ratings.filter(r => ['IP67', 'IP68', 'IP20'].includes(r))
          }
          // Handle single value
          if (['IP67', 'IP68', 'IP20'].includes(ipRating)) {
            return [ipRating]
          }
          return undefined
        })(),
        wireCrossSection: typeof product.wireCrossSection === 'string' ? product.wireCrossSection : '',
        temperatureRange: typeof product.temperatureRange === 'string' ? product.temperatureRange : '',
        cableDiameter: typeof product.cableDiameter === 'string' ? product.cableDiameter : '',
        cableMantleColor: typeof product.cableMantleColor === 'string' ? product.cableMantleColor : '',
        cableMantleMaterial: typeof product.cableMantleMaterial === 'string' ? product.cableMantleMaterial : '',
        cableLength: typeof product.cableLength === 'string' ? product.cableLength : '',
        glandMaterial: typeof product.glandMaterial === 'string' ? product.glandMaterial : '',
        housingMaterial: typeof product.housingMaterial === 'string' ? product.housingMaterial : '',
        pinContact: typeof product.pinContact === 'string' ? product.pinContact : '',
        socketContact: typeof product.socketContact === 'string' ? product.socketContact : '',
        cableDragChainSuitable: typeof product.cableDragChainSuitable === 'boolean' ? product.cableDragChainSuitable : false,
        tighteningTorqueMax: typeof product.tighteningTorqueMax === 'string' ? product.tighteningTorqueMax : '',
        bendingRadiusFixed: typeof product.bendingRadiusFixed === 'string' ? product.bendingRadiusFixed : '',
        bendingRadiusRepeated: typeof product.bendingRadiusRepeated === 'string' ? product.bendingRadiusRepeated : '',
        contactPlating: typeof product.contactPlating === 'string' ? product.contactPlating : '',
        operatingVoltage: typeof product.operatingVoltage === 'string' ? product.operatingVoltage : '',
        ratedCurrent: typeof product.ratedCurrent === 'string' ? product.ratedCurrent : '',
        halogenFree: typeof product.halogenFree === 'boolean' ? product.halogenFree : false,
        connectorType: product.connectorType && ['M12', 'M8', 'RJ45'].includes(product.connectorType)
          ? product.connectorType
          : undefined,
        code: product.code && ['A', 'B', 'D', 'X'].includes(product.code)
          ? product.code
          : undefined,
        strippingForce: typeof product.strippingForce === 'string' ? product.strippingForce : '',
        price: typeof product.price === 'number' ? product.price : (typeof product.price === 'string' ? parseFloat(product.price) : undefined),
        priceType: product.priceType && ['per_unit', 'per_pack', 'per_bulk'].includes(product.priceType)
          ? product.priceType
          : 'per_unit',
        inStock: typeof product.inStock === 'boolean' ? product.inStock : false,
        stockQuantity: typeof product.stockQuantity === 'number' 
          ? product.stockQuantity 
          : (typeof product.stockQuantity === 'string' ? parseInt(product.stockQuantity, 10) : undefined),
        images: safeImages,
        documents: safeDocuments,
        datasheetUrl: typeof product.datasheetUrl === 'string' ? product.datasheetUrl : '',
        drawingUrl: typeof product.drawingUrl === 'string' ? product.drawingUrl : '',
      })
      setIsDialogOpen(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to open edit dialog'
      setError(`Error loading product: ${errorMessage}. Please try again.`)
      console.error('Error opening edit dialog:', error)
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    if (!isAuthenticated) {
      alert('Authentication required. Please log in again.')
      return
    }

    try {
      // Ensure required fields are not empty
      if (!data.sku || data.sku.trim().length === 0) {
        alert('SKU is required. Please enter a product SKU.')
        return
      }
      if (!data.name || data.name.trim().length === 0) {
        alert('Name is required. Please enter a product name.')
        return
      }
      if (!data.description || data.description.trim().length === 0) {
        alert('Description is required. Please enter a product description.')
        return
      }

      // Convert IP rating array to comma-separated string if needed
      let degreeOfProtection: string | undefined = undefined
      if (data.degreeOfProtection) {
        if (Array.isArray(data.degreeOfProtection)) {
          degreeOfProtection = data.degreeOfProtection.length > 0 
            ? data.degreeOfProtection.join(',') 
            : undefined
        } else if (typeof data.degreeOfProtection === 'string') {
          degreeOfProtection = data.degreeOfProtection
        }
      }

      const productData = {
        ...data,
        sku: data.sku.trim(),
        name: data.name.trim(),
        description: data.description.trim(),
        degreeOfProtection,
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
      setSelectedCategoryId(undefined)
      setSelectedSubcategoryId(undefined)
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
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  // Format price in Indian Rupees
                  const priceDisplay = formatPriceSimple(product.price)

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.sku || 'N/A'}</TableCell>
                      <TableCell className="font-medium">{product.name || 'N/A'}</TableCell>
                      <TableCell className="max-w-md truncate">{product.description || 'N/A'}</TableCell>
                      <TableCell>{priceDisplay}</TableCell>
                      <TableCell>
                        {product.stockQuantity != null && product.stockQuantity > 0 ? (
                          <span className="text-green-600">{product.stockQuantity}</span>
                        ) : (
                          <span className="text-red-600">Out of Stock</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                            aria-label={`Edit product ${product.sku || product.id}`}
                          >
                            <Edit className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(product.id)}
                            aria-label={`Delete product ${product.sku || product.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
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
                <Input id="sku" {...register('sku')} placeholder="Product SKU (e.g., PROD-001)" />
                {errors.sku && (
                  <p className="text-sm text-red-500">{errors.sku.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register('name')} placeholder="Product name" />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  onValueChange={(value) => {
                    if (value === '__none__') {
                      setSelectedCategoryId(undefined)
                      setSelectedSubcategoryId(undefined)
                      setValue('categoryId', undefined)
                    } else {
                      setSelectedCategoryId(value)
                      setSelectedSubcategoryId(undefined) // Reset subcategory when category changes
                      // If no subcategory is selected, use the category ID
                      setValue('categoryId', value)
                    }
                  }}
                  value={selectedCategoryId || '__none__'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    <SelectItem value="__none__">No Category</SelectItem>
                    {getParentCategories().map((category) => (
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

              {selectedCategoryId && (
                <div>
                  <Label htmlFor="subcategoryId">Subcategory</Label>
                  <Select
                    onValueChange={(value) => {
                      if (value === '__none__') {
                        setSelectedSubcategoryId(undefined)
                        // Use parent category ID when subcategory is cleared
                        setValue('categoryId', selectedCategoryId)
                      } else {
                        setSelectedSubcategoryId(value)
                        // Use subcategory ID when subcategory is selected
                        setValue('categoryId', value)
                      }
                    }}
                    value={selectedSubcategoryId || '__none__'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subcategory (optional)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      <SelectItem value="__none__">No Subcategory</SelectItem>
                      {getSubcategories(selectedCategoryId).map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mpn">MPN</Label>
                <Input id="mpn" {...register('mpn')} placeholder="Manufacturer part number" />
              </div>

              <div>
                <Label htmlFor="price">Price</Label>
                <Input 
                  id="price" 
                  type="number" 
                  step="0.01"
                  {...register('price', { valueAsNumber: true })} 
                  placeholder="0.00" 
                />
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="priceType">Price Type</Label>
                <Select
                  onValueChange={(value) => setValue('priceType', value as any)}
                  value={watch('priceType') || 'per_unit'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select price type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_unit">Per Unit</SelectItem>
                    <SelectItem value="per_pack">Per Pack</SelectItem>
                    <SelectItem value="per_bulk">Per Bulk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input 
                  id="stockQuantity" 
                  type="number" 
                  {...register('stockQuantity', { valueAsNumber: true })} 
                  placeholder="0" 
                />
                {errors.stockQuantity && (
                  <p className="text-sm text-red-500">{errors.stockQuantity.message}</p>
                )}
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
                <Label className="text-sm font-semibold mb-3 block">Degree of Protection (IP Rating)</Label>
                <div className="space-y-2">
                  {['IP67', 'IP68', 'IP20'].map((rating) => {
                    const currentValue = watch('degreeOfProtection')
                    // Handle both array and comma-separated string
                    const currentArray = Array.isArray(currentValue)
                      ? currentValue
                      : typeof currentValue === 'string' && currentValue
                        ? currentValue.split(',').map(v => v.trim()).filter(Boolean)
                        : []
                    const isChecked = currentArray.includes(rating)
                    
                    return (
                      <div key={rating} className="flex items-center space-x-2">
                        <Checkbox
                          id={`ip-rating-${rating}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const current = watch('degreeOfProtection')
                            const currentArray = Array.isArray(current)
                              ? current
                              : typeof current === 'string' && current
                                ? current.split(',').map(v => v.trim()).filter(Boolean)
                                : []
                            
                            let newArray: string[]
                            if (checked) {
                              newArray = [...currentArray, rating]
                            } else {
                              newArray = currentArray.filter((v) => v !== rating)
                            }
                            
                            setValue('degreeOfProtection', newArray.length > 0 ? newArray : undefined, { shouldValidate: true })
                          }}
                        />
                        <Label
                          htmlFor={`ip-rating-${rating}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {rating}
                        </Label>
                      </div>
                    )
                  })}
                </div>
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
                  id="inStock"
                  checked={watch('inStock') || false}
                  onCheckedChange={(checked) => {
                    setValue('inStock', checked === true, { shouldValidate: true })
                  }}
                />
                <Label htmlFor="inStock" className="cursor-pointer">
                  In Stock
                </Label>
              </div>

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
                  {productImages.map((url, index) => {
                    // Validate URL before rendering
                    if (!url || typeof url !== 'string' || url.trim().length === 0) {
                      return null
                    }
                    
                    return (
                      <ProductImagePreview
                        key={`${url}-${index}`}
                        url={url}
                        index={index}
                        onRemove={() => removeImage(index)}
                      />
                    )
                  })}
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
