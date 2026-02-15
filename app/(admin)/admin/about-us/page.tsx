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
  Plus,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { aboutUsContentSchema } from '@/lib/cms-validation'

type AboutUsFormData = {
  section: string
  title?: string
  content: string
  displayOrder: number
}

interface AboutUsContent {
  id: string
  section: string
  title?: string
  content: string
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export default function AdminAboutUsPage() {
  const { isAuthenticated } = useAdminAuth()
  const [contents, setContents] = useState<AboutUsContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<AboutUsContent | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AboutUsFormData>({
    resolver: zodResolver(aboutUsContentSchema),
    defaultValues: {
      displayOrder: 0,
    },
  })

  useEffect(() => {
    fetchContents()
  }, [])

  const fetchContents = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/about-us-content`)
      if (!response.ok) throw new Error('Failed to fetch content')
      const data = await response.json()
      setContents(Array.isArray(data) ? data : [])
    } catch {
      setContents([])
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingContent(null)
    reset({
      displayOrder: 0,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (content: AboutUsContent) => {
    setEditingContent(content)
    reset({
      section: content.section,
      title: content.title || '',
      content: content.content,
      displayOrder: content.displayOrder,
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: AboutUsFormData) => {
    if (!isAuthenticated) {
      alert('Authentication required. Please log in again.')
      return
    }

    try {
      // Get CSRF token for state-changing operations
      const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/csrf-token`)
      const csrfData = await csrfResponse.json()
      const csrfToken = csrfData.token

      const url = editingContent
        ? `${process.env.NEXT_PUBLIC_API_URL || ''}/api/about-us-content/${editingContent.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || ''}/api/about-us-content`

      const method = editingContent ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save content' }))
        throw new Error(errorData.error || errorData.details?.[0]?.message || 'Failed to save content')
      }

      setIsDialogOpen(false)
      fetchContents()
      reset()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save content. Please try again.'
      alert(errorMessage)
    }
  }

  const handleDelete = async (id: string) => {
    if (!isAuthenticated || !confirm('Are you sure you want to delete this content?')) return

    try {
      // Get CSRF token for state-changing operations
      const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/csrf-token`)
      const csrfData = await csrfResponse.json()
      const csrfToken = csrfData.token

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/about-us-content/${id}`,
        {
          method: 'DELETE',
          headers: {
            'X-CSRF-Token': csrfToken,
          },
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete content' }))
        throw new Error(errorData.error || 'Failed to delete content')
      }

      fetchContents()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete content. Please try again.'
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
          <h1 className="text-3xl font-bold text-gray-900">About Us Content</h1>
          <p className="text-gray-600 mt-2">Manage About Us page content</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Content Section
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Display Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No content sections found
                  </TableCell>
                </TableRow>
              ) : (
                contents.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell className="font-medium">{content.section}</TableCell>
                    <TableCell>{content.title || '-'}</TableCell>
                    <TableCell>{content.displayOrder}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(content)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(content.id)}
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
              {editingContent ? 'Edit Content Section' : 'Create Content Section'}
            </DialogTitle>
            <DialogDescription>
              {editingContent
                ? 'Update About Us content section'
                : 'Add a new About Us content section'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="section">Section Identifier *</Label>
              <Input
                id="section"
                {...register('section')}
                placeholder="e.g., hero, story, mission, vision, values, stats"
                disabled={!!editingContent}
              />
              {errors.section && (
                <p className="text-sm text-red-500">{errors.section.message}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Unique identifier for this content section (cannot be changed after creation). Sections are displayed in order based on Display Order.
              </p>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} />
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
                {editingContent ? 'Update' : 'Create'} Content
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
