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
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const careerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  type: z.string().min(1, 'Type is required'),
  description: z.string().min(1, 'Description is required'),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  benefits: z.string().optional(),
  salary: z.string().optional(),
  active: z.boolean(),
})

type CareerFormData = z.infer<typeof careerSchema>

interface Career {
  _id: string
  title: string
  department: string
  location: string
  type: string
  description: string
  requirements?: string
  responsibilities?: string
  benefits?: string
  salary?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminCareersPage() {
  const { token } = useAdminAuth()
  const [careers, setCareers] = useState<Career[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCareer, setEditingCareer] = useState<Career | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CareerFormData>({
    resolver: zodResolver(careerSchema),
    defaultValues: {
      active: true,
    },
  })

  useEffect(() => {
    fetchCareers()
  }, [token])

  const fetchCareers = async () => {
    if (!token) return
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/careers`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )
      const data = await response.json()
      setCareers(data)
    } catch (error) {
      console.error('Failed to fetch careers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingCareer(null)
    reset({
      active: true,
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (career: Career) => {
    setEditingCareer(career)
    reset({
      title: career.title,
      department: career.department,
      location: career.location,
      type: career.type,
      description: career.description,
      requirements: career.requirements || '',
      responsibilities: career.responsibilities || '',
      benefits: career.benefits || '',
      salary: career.salary || '',
      active: career.active,
    })
    setIsDialogOpen(true)
  }

  const onSubmit = async (data: CareerFormData) => {
    if (!token) return

    try {
      const url = editingCareer
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/careers/${editingCareer._id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/careers`

      const method = editingCareer ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save career')

      setIsDialogOpen(false)
      fetchCareers()
      reset()
    } catch (error) {
      console.error('Failed to save career:', error)
      alert('Failed to save career')
    }
  }

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Are you sure you want to delete this career?')) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/careers/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to delete career')

      fetchCareers()
    } catch (error) {
      console.error('Failed to delete career:', error)
      alert('Failed to delete career')
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
          <h1 className="text-3xl font-bold text-gray-900">Careers</h1>
          <p className="text-gray-600 mt-2">Manage job openings</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Career
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {careers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No careers found
                  </TableCell>
                </TableRow>
              ) : (
                careers.map((career) => (
                  <TableRow key={career._id}>
                    <TableCell className="font-medium">{career.title}</TableCell>
                    <TableCell>{career.department}</TableCell>
                    <TableCell>{career.location}</TableCell>
                    <TableCell>{career.type}</TableCell>
                    <TableCell>
                      {career.active ? (
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
                          onClick={() => openEditDialog(career)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(career._id)}
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

      {/* Career Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCareer ? 'Edit Career' : 'Create Career'}
            </DialogTitle>
            <DialogDescription>
              {editingCareer
                ? 'Update career information'
                : 'Add a new job opening'}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department *</Label>
                <Input id="department" {...register('department')} />
                {errors.department && (
                  <p className="text-sm text-red-500">{errors.department.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input id="location" {...register('location')} />
                {errors.location && (
                  <p className="text-sm text-red-500">{errors.location.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type *</Label>
                <Input id="type" {...register('type')} placeholder="e.g., Full-time, Part-time" />
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="salary">Salary</Label>
                <Input id="salary" {...register('salary')} placeholder="e.g., $50,000 - $70,000" />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                {...register('description')}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="requirements">Requirements</Label>
              <textarea
                id="requirements"
                {...register('requirements')}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={4}
                placeholder="List the requirements for this position..."
              />
            </div>

            <div>
              <Label htmlFor="responsibilities">Responsibilities</Label>
              <textarea
                id="responsibilities"
                {...register('responsibilities')}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={4}
                placeholder="List the key responsibilities..."
              />
            </div>

            <div>
              <Label htmlFor="benefits">Benefits</Label>
              <textarea
                id="benefits"
                {...register('benefits')}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={4}
                placeholder="List the benefits offered..."
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

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingCareer ? 'Update' : 'Create'} Career
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
