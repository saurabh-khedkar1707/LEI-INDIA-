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
  X,
  FileText,
} from 'lucide-react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { companyPolicySchema, generateSlug } from '@/lib/cms-validation'

type Attachment = {
  url: string
  filename?: string
  type?: 'image' | 'document'
  size?: number
}

type PolicyFormData = {
  title: string
  slug: string
  content: string
  policyType?: string
  attachments?: Attachment[]
  displayOrder: number
  active: boolean
}

interface Policy {
  id: string
  title: string
  slug: string
  content: string
  policyType?: string
  attachments?: Attachment[]
  displayOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminCompanyPoliciesPage() {
  const { isAuthenticated } = useAdminAuth()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PolicyFormData>({
    resolver: zodResolver(companyPolicySchema),
    defaultValues: {
      displayOrder: 0,
      active: true,
      attachments: [],
    },
  })

  useEffect(() => {
    fetchPolicies()
  }, [])

  const fetchPolicies = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/company-policies`)
      if (!response.ok) throw new Error('Failed to fetch policies')
      const data = await response.json()
      setPolicies(Array.isArray(data) ? data : [])
    } catch {
      setPolicies([])
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingPolicy(null)
    setAttachments([])
    reset({
      displayOrder: 0,
      active: true,
      attachments: [],
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (policy: Policy) => {
    setEditingPolicy(policy)
    const policyAttachments = Array.isArray(policy.attachments) ? policy.attachments : []
    setAttachments(policyAttachments)
    reset({
      title: policy.title,
      slug: policy.slug,
      content: policy.content,
      policyType: policy.policyType || '',
      attachments: policyAttachments,
      displayOrder: policy.displayOrder,
      active: policy.active,
    })
    setIsDialogOpen(true)
  }

  const handleTitleChange = (title: string) => {
    setValue('title', title)
    if (!editingPolicy) {
      // Auto-generate slug from title for new policies
      setValue('slug', generateSlug(title))
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!isAuthenticated) {
      alert('Authentication required. Please log in again.')
      return
    }

    if (!file || !(file instanceof File)) {
      alert('Invalid file selected. Please try again.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB. Please compress the image and try again.')
      return
    }

    if (!file.type || !file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP).')
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
      const newAttachment: Attachment = {
        url: data.url,
        filename: data.filename || file.name,
        type: 'image',
        size: data.size || file.size,
      }
      const newAttachments = [...attachments, newAttachment]
      setAttachments(newAttachments)
      setValue('attachments', newAttachments)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image. Please try again.'
      alert(errorMessage)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDocumentUpload = async (file: File) => {
    if (!isAuthenticated) {
      alert('Authentication required. Please log in again.')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('Document size must be less than 50MB')
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

    setUploadingDocument(true)
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
      const newAttachment: Attachment = {
        url: data.url,
        filename: data.filename || file.name,
        type: 'document',
        size: data.size || file.size,
      }
      const newAttachments = [...attachments, newAttachment]
      setAttachments(newAttachments)
      setValue('attachments', newAttachments)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload document. Please try again.'
      alert(errorMessage)
    } finally {
      setUploadingDocument(false)
    }
  }

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index)
    setAttachments(newAttachments)
    setValue('attachments', newAttachments)
  }

  const onSubmit = async (data: PolicyFormData) => {
    if (!isAuthenticated) {
      alert('Authentication required. Please log in again.')
      return
    }

    try {
      // Get CSRF token for state-changing operations
      const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/csrf-token`)
      const csrfData = await csrfResponse.json()
      const csrfToken = csrfData.token

      const url = editingPolicy
        ? `${process.env.NEXT_PUBLIC_API_URL || ''}/api/company-policies/${editingPolicy.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || ''}/api/company-policies`

      const method = editingPolicy ? 'PUT' : 'POST'

      const payload = {
        ...data,
        attachments: attachments || [],
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save policy' }))
        throw new Error(errorData.error || errorData.details?.[0]?.message || 'Failed to save policy')
      }

      setIsDialogOpen(false)
      fetchPolicies()
      reset()
      setAttachments([])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save policy. Please try again.'
      alert(errorMessage)
    }
  }

  const handleDelete = async (id: string) => {
    if (!isAuthenticated || !confirm('Are you sure you want to delete this policy?')) return

    try {
      // Get CSRF token for state-changing operations
      const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/csrf-token`)
      const csrfData = await csrfResponse.json()
      const csrfToken = csrfData.token

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/company-policies/${id}`,
        {
          method: 'DELETE',
          headers: {
            'X-CSRF-Token': csrfToken,
          },
          credentials: 'include',
        }
      )

      if (!response.ok) throw new Error('Failed to delete policy')

      fetchPolicies()
    } catch {
      alert('Failed to delete policy')
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
          <h1 className="text-3xl font-bold text-gray-900">Company Policies</h1>
          <p className="text-gray-600 mt-2">Manage company policies</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Policy
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No policies found
                  </TableCell>
                </TableRow>
              ) : (
                policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.title}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{policy.slug}</TableCell>
                    <TableCell>{policy.policyType || '-'}</TableCell>
                    <TableCell>
                      {policy.active ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-gray-500">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(policy)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(policy.id)}
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
              {editingPolicy ? 'Edit Policy' : 'Create Policy'}
            </DialogTitle>
            <DialogDescription>
              {editingPolicy
                ? 'Update policy information'
                : 'Add a new company policy'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title')}
                onChange={(e) => {
                  handleTitleChange(e.target.value)
                  register('title').onChange(e)
                }}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="Auto-generated from title"
              />
              {errors.slug && (
                <p className="text-sm text-red-500">{errors.slug.message}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                URL-friendly identifier (auto-generated from title)
              </p>
            </div>

            <div>
              <Label htmlFor="policyType">Policy Type</Label>
              <Input
                id="policyType"
                {...register('policyType')}
                placeholder="e.g., Privacy, Terms, Refund"
              />
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
              <Label>Attachments</Label>
              <div className="mt-2 space-y-4">
                <div>
                  <Label htmlFor="image-upload" className="text-sm font-normal text-gray-600">
                    Upload Image
                  </Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file)
                        e.target.value = '' // Reset input
                      }}
                      disabled={uploadingImage}
                      className="flex-1"
                    />
                    {uploadingImage && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Max size: 10MB. Formats: JPEG, PNG, GIF, WebP
                  </p>
                </div>

                <div>
                  <Label htmlFor="document-upload" className="text-sm font-normal text-gray-600">
                    Upload Document
                  </Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="document-upload"
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleDocumentUpload(file)
                        e.target.value = '' // Reset input
                      }}
                      disabled={uploadingDocument}
                      className="flex-1"
                    />
                    {uploadingDocument && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Max size: 50MB. Formats: PDF, DOC, DOCX
                  </p>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-normal">Uploaded Attachments</Label>
                    <div className="space-y-2">
                      {attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-md bg-gray-50"
                        >
                          {attachment.type === 'image' ? (
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="relative h-12 w-12 flex-shrink-0">
                                <Image
                                  src={`${process.env.NEXT_PUBLIC_API_URL || ''}${attachment.url}`}
                                  alt={attachment.filename || 'Attachment'}
                                  fill
                                  className="object-contain rounded"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {attachment.filename || 'Image'}
                                </p>
                                {attachment.size && (
                                  <p className="text-xs text-gray-500">
                                    {(attachment.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {attachment.filename || 'Document'}
                                </p>
                                {attachment.size && (
                                  <p className="text-xs text-gray-500">
                                    {(attachment.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL || ''}${attachment.url}`}
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
                              onClick={() => removeAttachment(index)}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                {editingPolicy ? 'Update' : 'Create'} Policy
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
