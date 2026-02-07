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
  Upload,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { principalPartnerSchema } from '@/lib/cms-validation'
import Image from 'next/image'

type PartnerFormData = {
  companyName: string
  logo?: string
  companyDetails?: string
  email?: string
  phone?: string
  address?: string
  website?: string
  displayOrder: number
  active: boolean
}

interface Partner {
  id: string
  companyName: string
  logo?: string
  companyDetails?: string
  email?: string
  phone?: string
  address?: string
  website?: string
  displayOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminPrincipalPartnersPage() {
  const { isAuthenticated } = useAdminAuth()
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PartnerFormData>({
    resolver: zodResolver(principalPartnerSchema),
    defaultValues: {
      displayOrder: 0,
      active: true,
    },
  })

  useEffect(() => {
    fetchPartners()
  }, [])

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/principal-partners')
      if (!response.ok) throw new Error('Failed to fetch partners')
      const data = await response.json()
      setPartners(Array.isArray(data) ? data : [])
    } catch {
      setPartners([])
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingPartner(null)
    reset({
      displayOrder: 0,
      active: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (partner: Partner) => {
    setEditingPartner(partner)
    reset({
      companyName: partner.companyName,
      logo: partner.logo || '',
      companyDetails: partner.companyDetails || '',
      email: partner.email || '',
      phone: partner.phone || '',
      address: partner.address || '',
      website: partner.website || '',
      displayOrder: partner.displayOrder,
      active: partner.active,
    })
    setIsDialogOpen(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      setValue('logo', data.url)
    } catch {
      alert('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const onSubmit = async (data: PartnerFormData) => {
    if (!isAuthenticated) return

    try {
      const url = editingPartner
        ? `/api/principal-partners/${editingPartner.id}`
        : '/api/principal-partners'

      const method = editingPartner ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save partner')

      setIsDialogOpen(false)
      fetchPartners()
      reset()
    } catch {
      alert('Failed to save partner')
    }
  }

  const handleDelete = async (id: string) => {
    if (!isAuthenticated || !confirm('Are you sure you want to delete this partner?')) return

    try {
      const response = await fetch(`/api/principal-partners/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete partner')

      fetchPartners()
    } catch {
      alert('Failed to delete partner')
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
          <h1 className="text-3xl font-bold text-gray-900">Principal Partners</h1>
          <p className="text-gray-600 mt-2">Manage principal partners</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Partner
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Logo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No partners found
                  </TableCell>
                </TableRow>
              ) : (
                partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.companyName}</TableCell>
                    <TableCell>
                      {partner.logo ? (
                        <Image
                          src={partner.logo}
                          alt={partner.companyName}
                          width={40}
                          height={40}
                          className="rounded"
                        />
                      ) : (
                        <span className="text-gray-400">No logo</span>
                      )}
                    </TableCell>
                    <TableCell>{partner.email || '-'}</TableCell>
                    <TableCell>{partner.phone || '-'}</TableCell>
                    <TableCell>
                      {partner.active ? (
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
                          onClick={() => openEditDialog(partner)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(partner.id)}
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
              {editingPartner ? 'Edit Partner' : 'Create Partner'}
            </DialogTitle>
            <DialogDescription>
              {editingPartner
                ? 'Update partner information'
                : 'Add a new principal partner'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input id="companyName" {...register('companyName')} />
              {errors.companyName && (
                <p className="text-sm text-red-500">{errors.companyName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="logo">Logo</Label>
              <div className="flex items-center gap-4">
                {watch('logo') && (
                  <Image
                    src={watch('logo') || ''}
                    alt="Logo preview"
                    width={100}
                    height={100}
                    className="rounded border"
                  />
                )}
                <div className="flex-1">
                  <Input
                    id="logo"
                    {...register('logo')}
                    placeholder="Logo URL or upload image"
                  />
                  <div className="mt-2">
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          {uploadingImage ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          Upload Image
                        </span>
                      </Button>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="companyDetails">Company Details</Label>
              <textarea
                id="companyDetails"
                {...register('companyDetails')}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <textarea
                id="address"
                {...register('address')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" {...register('website')} />
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
                {editingPartner ? 'Update' : 'Create'} Partner
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
