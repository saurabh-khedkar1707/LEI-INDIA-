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
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Upload,
  X,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const heroSlideSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  image: z.string().min(1, 'Image is required'),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  displayOrder: z.number().int().min(0),
  active: z.boolean(),
})

type HeroSlideFormData = z.infer<typeof heroSlideSchema>

interface HeroSlide {
  id: string
  title: string
  subtitle?: string
  description?: string
  image: string
  ctaText?: string
  ctaLink?: string
  displayOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminHeroSlidesPage() {
  const { isAuthenticated } = useAdminAuth()
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [slideImage, setSlideImage] = useState<string>('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [slideToDelete, setSlideToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<HeroSlideFormData>({
    resolver: zodResolver(heroSlideSchema),
    defaultValues: {
      displayOrder: 0,
      active: true,
    },
  })

  useEffect(() => {
    fetchSlides()
  }, [])

  const fetchSlides = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/hero-slides`,
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch hero slides' }))
        throw new Error(errorData.error || `Failed to fetch hero slides: ${response.statusText}`)
      }

      const data = await response.json()
      setSlides(Array.isArray(data) ? data : [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load hero slides. Please refresh the page or try again later.'
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

    // Validate file size (2MB limit for hero images)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file')
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

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
      setSlideImage(data.url)
      setValue('image', data.url)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image. Please try again.'
      alert(errorMessage)
    } finally {
      setUploadingImage(false)
    }
  }

  const openCreateDialog = () => {
    setEditingSlide(null)
    setSlideImage('')
    reset({
      displayOrder: slides.length,
      active: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setSlideImage(slide.image)
    reset({
      title: slide.title,
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      image: slide.image,
      ctaText: slide.ctaText || '',
      ctaLink: slide.ctaLink || '',
      displayOrder: slide.displayOrder,
      active: slide.active,
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: HeroSlideFormData) => {
    if (!isAuthenticated) {
      alert('Authentication required. Please log in again.')
      return
    }

    try {
      // Ensure image is set - use existing image if updating and no new image uploaded
      const imageUrl = slideImage || (editingSlide?.image || '')
      
      if (!imageUrl) {
        alert('Image is required. Please upload an image.')
        return
      }

      const slideData = {
        ...data,
        image: imageUrl,
      }

      const url = editingSlide
        ? `${process.env.NEXT_PUBLIC_API_URL || ''}/api/hero-slides/${editingSlide.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || ''}/api/hero-slides`

      const method = editingSlide ? 'PUT' : 'POST'

      // Get CSRF token for state-changing operations
      const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/csrf-token`)
      const csrfData = await csrfResponse.json()
      const csrfToken = csrfData.token

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(slideData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save hero slide' }))
        throw new Error(errorData.error || errorData.details?.[0]?.message || 'Failed to save hero slide')
      }

      setIsDialogOpen(false)
      await fetchSlides()
      reset()
      setSlideImage('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save hero slide. Please try again.'
      alert(errorMessage)
    }
  }

  const handleDeleteClick = (id: string) => {
    setSlideToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!isAuthenticated || !slideToDelete) {
      setError('Authentication required. Please log in again.')
      setDeleteDialogOpen(false)
      return
    }

    try {
      setIsDeleting(true)
      setError(null)
      
      // Get CSRF token for state-changing operations
      const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/csrf-token`)
      const csrfData = await csrfResponse.json()
      const csrfToken = csrfData.token
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/hero-slides/${slideToDelete}`,
        {
          method: 'DELETE',
          headers: {
            'X-CSRF-Token': csrfToken,
          },
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete hero slide' }))
        throw new Error(errorData.error || 'Failed to delete hero slide')
      }

      setDeleteDialogOpen(false)
      setSlideToDelete(null)
      await fetchSlides()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete hero slide. Please try again.'
      setError(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOrderChange = async (id: string, direction: 'up' | 'down') => {
    const slide = slides.find(s => s.id === id)
    if (!slide) return

    const currentIndex = slides.findIndex(s => s.id === id)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= slides.length) return

    const targetSlide = slides[targetIndex]
    const newOrder = targetSlide.displayOrder

    try {
      // Get CSRF token for state-changing operations
      const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/csrf-token`)
      const csrfData = await csrfResponse.json()
      const csrfToken = csrfData.token
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/hero-slides/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({ displayOrder: newOrder }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update order')
      }

      // Also update the target slide's order
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/hero-slides/${targetSlide.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({ displayOrder: slide.displayOrder }),
        }
      )

      await fetchSlides()
    } catch (error) {
      alert('Failed to update slide order. Please try again.')
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
          <h1 className="text-3xl font-bold text-gray-900">Hero Slider</h1>
          <p className="text-gray-600 mt-2">Manage homepage hero slider slides</p>
          <p className="text-sm text-gray-500 mt-1">
            Recommended image size: 1920x700px (or similar aspect ratio). Max file size: 2MB
          </p>
        </div>
        <Button onClick={openCreateDialog} aria-label="Add new hero slide">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Slide
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
                <TableHead>Order</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Subtitle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No hero slides found. Add your first slide to get started.
                  </TableCell>
                </TableRow>
              ) : (
                slides
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((slide, index) => (
                    <TableRow key={slide.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{slide.displayOrder}</span>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleOrderChange(slide.id, 'up')}
                              disabled={index === 0}
                              aria-label="Move up"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleOrderChange(slide.id, 'down')}
                              disabled={index === slides.length - 1}
                              aria-label="Move down"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="relative h-16 w-32">
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_URL || ''}${slide.image}`}
                            alt={slide.title}
                            fill
                            className="object-contain rounded border"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{slide.title}</TableCell>
                      <TableCell>{slide.subtitle || '-'}</TableCell>
                      <TableCell>
                        {slide.active ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-gray-400">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(slide)}
                            aria-label={`Edit slide ${slide.title}`}
                          >
                            <Edit className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(slide.id)}
                            aria-label={`Delete slide ${slide.title}`}
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

      {/* Hero Slide Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSlide ? 'Edit Hero Slide' : 'Create Hero Slide'}
            </DialogTitle>
            <DialogDescription>
              {editingSlide
                ? 'Update hero slide information'
                : 'Add a new hero slide to the homepage slider'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register('title')} />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" {...register('subtitle')} />
              {errors.subtitle && (
                <p className="text-sm text-red-500">{errors.subtitle.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
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
              <Label htmlFor="image">Hero Image *</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                    }}
                    disabled={uploadingImage}
                    className="flex-1"
                  />
                  {uploadingImage && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Recommended: 1920x700px. Max size: 2MB. Formats: JPEG, PNG, WebP
                </p>
                {slideImage && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL || ''}${slideImage}`}
                      alt="Preview"
                      fill
                      className="object-contain rounded border"
                    />
                  </div>
                )}
                <Input
                  id="image"
                  {...register('image')}
                  value={slideImage}
                  onChange={(e) => {
                    setSlideImage(e.target.value)
                    setValue('image', e.target.value)
                  }}
                  placeholder="Or enter image URL directly"
                  className="mt-2"
                />
                {errors.image && (
                  <p className="text-sm text-red-500">{errors.image.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ctaText">CTA Button Text</Label>
                <Input id="ctaText" {...register('ctaText')} placeholder="e.g., Explore Products" />
              </div>

              <div>
                <Label htmlFor="ctaLink">CTA Button Link</Label>
                <Input id="ctaLink" {...register('ctaLink')} placeholder="e.g., /products" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  {...register('displayOrder', { valueAsNumber: true })}
                />
                {errors.displayOrder && (
                  <p className="text-sm text-red-500">{errors.displayOrder.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="active">Status</Label>
                <Select
                  onValueChange={(value) => setValue('active', value === 'true')}
                  defaultValue={watch('active')?.toString()}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
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
                {editingSlide ? 'Update' : 'Create'} Slide
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Hero Slide"
        description="Are you sure you want to delete this hero slide? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}
