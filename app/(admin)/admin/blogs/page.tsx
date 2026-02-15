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
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  excerpt: z.string().min(1, 'Excerpt is required'),
  content: z.string().min(1, 'Content is required'),
  image: z.string().optional().or(z.literal('')),
  published: z.boolean(),
})

type BlogFormData = z.infer<typeof blogSchema>

interface Blog {
  id: string
  title: string
  slug: string
  excerpt?: string
  content?: string
  image?: string
  published: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminBlogsPage() {
  const { isAuthenticated } = useAdminAuth()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [blogImage, setBlogImage] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      published: false,
    },
  })

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/blogs`,
        {
          credentials: 'include',
        }
      )
      const data = await response.json()
      // API returns { blogs: [...], pagination: {...} }
      setBlogs(Array.isArray(data.blogs) ? data.blogs : (Array.isArray(data) ? data : []))
    } catch {
      setBlogs([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!isAuthenticated) return

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

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      setBlogImage(data.url)
      setValue('image', data.url)
    } catch {
      alert('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const openCreateDialog = () => {
    setEditingBlog(null)
    setBlogImage('')
    reset({
      published: false,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (blog: Blog) => {
    setEditingBlog(blog)
    setBlogImage(blog.image || '')
    reset({
      title: blog.title,
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      image: blog.image || '',
      published: blog.published,
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: BlogFormData) => {
    if (!isAuthenticated) {
      alert('Authentication required. Please log in again.')
      return
    }

    try {
      const blogData = {
        ...data,
        image: blogImage || '',
      }

      const url = editingBlog
        ? `${process.env.NEXT_PUBLIC_API_URL || ''}/api/blogs/${editingBlog.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || ''}/api/blogs`

      const method = editingBlog ? 'PUT' : 'POST'

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
        body: JSON.stringify(blogData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save blog' }))
        throw new Error(errorData.error || errorData.details?.[0]?.message || 'Failed to save blog')
      }

      setIsDialogOpen(false)
      await fetchBlogs()
      reset()
      setBlogImage('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save blog. Please try again.'
      alert(errorMessage)
    }
  }

  const handleDelete = async (id: string) => {
    if (!isAuthenticated || !confirm('Are you sure you want to delete this blog?')) return

    try {
      // Get CSRF token
      const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/csrf-token`)
      const csrfData = await csrfResponse.json()
      const csrfToken = csrfData.token

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/blogs/${id}`,
        {
          method: 'DELETE',
          headers: {
            'X-CSRF-Token': csrfToken,
          },
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete blog' }))
        throw new Error(errorData.error || 'Failed to delete blog')
      }

      await fetchBlogs()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete blog. Please try again.'
      alert(errorMessage)
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
          <h1 className="text-3xl font-bold text-gray-900">Blogs</h1>
          <p className="text-gray-600 mt-2">Manage your blog posts</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Blog
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No blogs found
                  </TableCell>
                </TableRow>
              ) : (
                blogs.map((blog) => (
                  <TableRow key={blog.id}>
                    <TableCell className="font-medium">{blog.title}</TableCell>
                    <TableCell>{blog.slug}</TableCell>
                    <TableCell>
                      {blog.published ? (
                        <span className="text-green-600">Published</span>
                      ) : (
                        <span className="text-gray-500">Draft</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(blog)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(blog.id)}
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

      {/* Blog Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBlog ? 'Edit Blog' : 'Create Blog'}
            </DialogTitle>
            <DialogDescription>
              {editingBlog
                ? 'Update blog information'
                : 'Add a new blog post'}
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
              <Label htmlFor="excerpt">Excerpt *</Label>
              <textarea
                id="excerpt"
                {...register('excerpt')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
              {errors.excerpt && (
                <p className="text-sm text-red-500">{errors.excerpt.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="content">Content *</Label>
              <textarea
                id="content"
                {...register('content')}
                className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={10}
              />
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content.message}</p>
              )}
            </div>


            <div>
              <Label>Blog Image</Label>
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
                {blogImage && (
                  <div className="relative w-full h-48">
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL || ''}${blogImage}`}
                      alt="Blog"
                      fill
                      className="object-contain rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setBlogImage('')
                        setValue('image', '')
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="published">Status</Label>
              <Select
                onValueChange={(value) => setValue('published', value === 'true')}
                defaultValue={watch('published')?.toString()}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Draft</SelectItem>
                  <SelectItem value="true">Published</SelectItem>
                </SelectContent>
              </Select>
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
                {editingBlog ? 'Update' : 'Create'} Blog
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
