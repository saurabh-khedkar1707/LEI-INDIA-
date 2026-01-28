'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/store/admin-auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Mail, Phone, MapPin } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const contactInfoSchema = z.object({
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  address: z.string().min(1, 'Address is required'),
  registeredAddress: z.string().optional(),
  factoryLocation2: z.string().optional(),
  regionalContacts: z.object({
    bangalore: z.string().optional(),
    kolkata: z.string().optional(),
    gurgaon: z.string().optional(),
  }).optional(),
})

type ContactInfoFormData = z.infer<typeof contactInfoSchema>

interface ContactInfo {
  phone: string
  email: string
  address: string
  registeredAddress?: string
  factoryLocation2?: string
  regionalContacts?: {
    bangalore?: string
    kolkata?: string
    gurgaon?: string
  }
  updatedAt: string
}

export default function AdminContactInfoPage() {
  const { isAuthenticated } = useAdminAuth()
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactInfoFormData>({
    resolver: zodResolver(contactInfoSchema),
  })

  useEffect(() => {
    fetchContactInfo()
  }, [])

  const fetchContactInfo = async () => {
    try {
      const response = await fetch(`/api/contact-info`)
      const data = await response.json()
      setContactInfo(data)
      reset({
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        registeredAddress: data.registeredAddress || '',
        factoryLocation2: data.factoryLocation2 || '',
        regionalContacts: {
          bangalore: data.regionalContacts?.bangalore || '',
          kolkata: data.regionalContacts?.kolkata || '',
          gurgaon: data.regionalContacts?.gurgaon || '',
        },
      })
    } catch (error) {
      console.error('Failed to fetch contact info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ContactInfoFormData) => {
    if (!isAuthenticated) return

    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const response = await fetch(`/api/contact-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update contact information')
      }

      const updated = await response.json()
      setContactInfo(updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update contact info:', error)
      alert('Failed to update contact information')
    } finally {
      setIsSaving(false)
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contact Information</h1>
        <p className="text-gray-600 mt-2">Manage your company's contact details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Contact Information</CardTitle>
          <CardDescription>
            Update the contact information that appears on your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+91-XXX-XXXX-XXXX"
                  className="mt-2"
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="info@leiindias.com"
                  className="mt-2"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address (Primary)
                </Label>
                <textarea
                  id="address"
                  {...register('address')}
                  placeholder="Industrial Area, India"
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                />
                {errors.address && (
                  <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="registeredAddress" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Registered Address & Factory Location I
                </Label>
                <textarea
                  id="registeredAddress"
                  {...register('registeredAddress')}
                  placeholder="Registered address and factory location..."
                  rows={4}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                />
              </div>

              <div>
                <Label htmlFor="factoryLocation2" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Factory Location II
                </Label>
                <textarea
                  id="factoryLocation2"
                  {...register('factoryLocation2')}
                  placeholder="Second factory location..."
                  rows={4}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                />
              </div>

              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-4 block">Pan India Contacts</Label>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="regionalContacts.bangalore">Bangalore Contact</Label>
                    <Input
                      id="regionalContacts.bangalore"
                      type="email"
                      {...register('regionalContacts.bangalore')}
                      placeholder="info@leiindias.com"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="regionalContacts.kolkata">Kolkata Contact</Label>
                    <Input
                      id="regionalContacts.kolkata"
                      type="email"
                      {...register('regionalContacts.kolkata')}
                      placeholder="info@leiindias.com"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="regionalContacts.gurgaon">Gurgaon Contact</Label>
                    <Input
                      id="regionalContacts.gurgaon"
                      type="email"
                      {...register('regionalContacts.gurgaon')}
                      placeholder="info@leiindias.com"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {contactInfo && (
              <div className="text-sm text-gray-500 pt-4 border-t">
                Last updated: {new Date(contactInfo.updatedAt).toLocaleString()}
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <Button type="submit" disabled={isSaving} className="min-w-[120px]">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              {saveSuccess && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ Contact information updated successfully!
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
