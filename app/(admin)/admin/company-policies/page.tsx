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
import { companyPolicySchema, generateSlug } from '@/lib/cms-validation'

type PolicyFormData = {
  title: string
  slug: string
  content: string
  policyType?: string
  displayOrder: number
  active: boolean
}

interface Policy {
  id: string
  title: string
  slug: string
  content: string
  policyType?: string
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
    },
  })

  useEffect(() => {
    fetchPolicies()
  }, [])

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/company-policies')
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
    reset({
      displayOrder: 0,
      active: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (policy: Policy) => {
    setEditingPolicy(policy)
    reset({
      title: policy.title,
      slug: policy.slug,
      content: policy.content,
      policyType: policy.policyType || '',
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

  const onSubmit = async (data: PolicyFormData) => {
    if (!isAuthenticated) return

    try {
      const url = editingPolicy
        ? `/api/company-policies/${editingPolicy.id}`
        : '/api/company-policies'

      const method = editingPolicy ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save policy')

      setIsDialogOpen(false)
      fetchPolicies()
      reset()
    } catch {
      alert('Failed to save policy')
    }
  }

  const handleDelete = async (id: string) => {
    if (!isAuthenticated || !confirm('Are you sure you want to delete this policy?')) return

    try {
      const response = await fetch(`/api/company-policies/${id}`, {
        method: 'DELETE',
      })

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
