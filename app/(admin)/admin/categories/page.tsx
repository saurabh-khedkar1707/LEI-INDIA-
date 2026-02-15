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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { categorySchema } from '@/lib/category-validation'
import { Category } from '@/types'

type CategoryFormData = {
  name: string
  slug: string
  description?: string
  image?: string
  parentId?: string
}

export default function AdminCategoriesPage() {
  const { isAuthenticated } = useAdminAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [categoryImage, setCategoryImage] = useState<string>('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/categories?limit=1000`,
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch categories' }))
        throw new Error(errorData.error || `Failed to fetch categories: ${response.statusText}`)
      }
      
      const data = await response.json()
      setCategories(Array.isArray(data.categories) ? data.categories : [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load categories. Please refresh the page or try again later.'
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
      setCategoryImage(data.url)
      setValue('image', data.url)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image. Please try again.'
      alert(errorMessage)
    } finally {
      setUploadingImage(false)
    }
  }

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setValue('name', name)
    if (!editingCategory) {
      // Only auto-generate slug when creating, not editing
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setValue('slug', slug)
    }
  }

  const openCreateDialog = () => {
    setEditingCategory(null)
    setCategoryImage('')
    reset({
      name: '',
      slug: '',
      description: '',
      image: '',
      parentId: '',
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setCategoryImage(category.image || '')
    reset({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image || '',
      parentId: category.parentId || undefined,
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: CategoryFormData) => {
    if (!isAuthenticated) {
      alert('Authentication required. Please log in again.')
      return
    }

    try {
      // Handle parentId: if it's "__none__" or empty, send empty string to remove parent relationship
      // The API will convert empty string to null
      let parentIdValue: string | undefined
      if (data.parentId && data.parentId !== '__none__' && data.parentId.trim()) {
        parentIdValue = data.parentId.trim()
      } else {
        // Send empty string to explicitly remove parent relationship
        // For creates, undefined is fine (will be null in DB)
        // For updates, empty string tells API to remove parent
        parentIdValue = editingCategory ? '' : undefined
      }

      const categoryData = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description?.trim() || undefined,
        image: categoryImage || data.image || undefined,
        parentId: parentIdValue,
      }

      const url = editingCategory
        ? `${process.env.NEXT_PUBLIC_API_URL || ''}/api/categories/${editingCategory.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || ''}/api/categories`

      const method = editingCategory ? 'PUT' : 'POST'

      // Get CSRF token
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
        body: JSON.stringify(categoryData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save category' }))
        throw new Error(errorData.error || errorData.details?.[0]?.message || 'Failed to save category')
      }

      setIsDialogOpen(false)
      await fetchCategories()
      reset()
      setCategoryImage('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save category. Please try again.'
      alert(errorMessage)
    }
  }

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!isAuthenticated || !categoryToDelete) {
      setError('Authentication required. Please log in again.')
      setDeleteDialogOpen(false)
      return
    }

    try {
      setIsDeleting(true)
      setError(null)

      // Get CSRF token
      const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/csrf-token`)
      const csrfData = await csrfResponse.json()
      const csrfToken = csrfData.token

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/categories/${categoryToDelete}`,
        {
          method: 'DELETE',
          headers: {
            'X-CSRF-Token': csrfToken,
          },
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete category' }))
        throw new Error(errorData.error || 'Failed to delete category')
      }

      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
      await fetchCategories()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category. Please try again.'
      setError(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  // Helper function to get all descendant category IDs (to prevent circular references)
  const getDescendantIds = (categoryId: string): string[] => {
    const descendants: string[] = []
    const findChildren = (id: string) => {
      categories.forEach(cat => {
        if (cat.parentId === id) {
          descendants.push(cat.id)
          findChildren(cat.id)
        }
      })
    }
    findChildren(categoryId)
    return descendants
  }

  // Get available parent categories (exclude current category and its descendants)
  const getAvailableParentCategories = (): Category[] => {
    if (!editingCategory) {
      // When creating, all categories without parents are available
      return categories.filter(cat => !cat.parentId)
    }
    // When editing, exclude current category and all its descendants
    const excludedIds = new Set([editingCategory.id, ...getDescendantIds(editingCategory.id)])
    // Include top-level categories (no parent) that aren't excluded
    // Also include the current parent if it exists (so it shows in the dropdown when editing)
    const availableCategories = categories.filter(cat => 
      !excludedIds.has(cat.id) && !cat.parentId
    )
    
    // If the category being edited has a parent, include that parent in the list
    // so it can be displayed and selected
    if (editingCategory.parentId) {
      const currentParent = categories.find(cat => cat.id === editingCategory.parentId)
      if (currentParent && !availableCategories.find(cat => cat.id === currentParent.id)) {
        availableCategories.push(currentParent)
      }
    }
    
    return availableCategories
  }

  // Get parent category name by ID
  const getParentCategoryName = (parentId: string | undefined): string | null => {
    if (!parentId) return null
    const parent = categories.find(cat => cat.id === parentId)
    return parent?.name || null
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
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-2">Manage product categories</p>
        </div>
        <Button onClick={openCreateDialog} aria-label="Add new category">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Category
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
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Parent Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Image</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-gray-600">{category.slug}</TableCell>
                    <TableCell className="text-gray-600">
                      {getParentCategoryName(category.parentId) || (
                        <span className="text-gray-400 italic">Top-level</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600 max-w-md truncate">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell>
                      {category.image ? (
                        <div className="relative w-16 h-16">
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_URL || ''}${category.image}`}
                            alt={category.name}
                            fill
                            className="object-contain rounded border"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(category)}
                          aria-label={`Edit category ${category.name}`}
                        >
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(category.id)}
                          aria-label={`Delete category ${category.name}`}
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

      {/* Category Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update category information'
                : 'Add a new product category'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register('name')}
                onChange={(e) => handleNameChange(e.target.value)}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="e.g., m12-connectors"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL-friendly identifier (lowercase letters, numbers, and hyphens only)
              </p>
              {errors.slug && (
                <p className="text-sm text-red-500">{errors.slug.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                {...register('description')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="Brief description of the category"
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="parentId">Parent Category (Optional)</Label>
              <Select
                value={watch('parentId') || '__none__'}
                onValueChange={(value) => {
                  setValue('parentId', value === '__none__' ? undefined : value)
                }}
              >
                <SelectTrigger id="parentId">
                  <SelectValue placeholder="Select a parent category" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="__none__">No Parent (Top-level)</SelectItem>
                  {getAvailableParentCategories().map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {editingCategory
                  ? 'Select a parent category to make this a subcategory. Current category and its subcategories are excluded to prevent circular references.'
                  : 'Select a parent category to create a nested category'}
              </p>
              {errors.parentId && (
                <p className="text-sm text-red-500">{errors.parentId.message}</p>
              )}
            </div>

            <div>
              <Label>Category Image</Label>
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
                {categoryImage && (
                  <div className="relative w-full h-48">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL || ''}${categoryImage}`}
                      alt="Category"
                      fill
                      className="object-contain rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setCategoryImage('')
                        setValue('image', '')
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
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
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}
