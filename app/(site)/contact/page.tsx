'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactFormSchema, type ContactFormData } from '@/lib/zod-schemas'
import { apiClient } from '@/lib/api-client'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Mail, Phone, MapPin } from 'lucide-react'

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
}

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone: '+91-XXX-XXXX-XXXX',
    email: 'info@leiindias.com',
    address: 'Industrial Area, India',
    registeredAddress: '',
    factoryLocation2: '',
    regionalContacts: {},
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      meetingRequest: false,
    },
  })

  const meetingRequest = watch('meetingRequest')

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const data = await apiClient.get<ContactInfo>('/api/contact-info')
        setContactInfo(data)
      } catch (error) {
        // Silently fail - use default contact info
      }
    }

    fetchContactInfo()
  }, [])

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        subject: 'Contact Form Inquiry',
        message: data.message,
      }
      const result = await apiClient.post('/api/inquiries', payload)

      setSubmitted(true)
      reset()
      setTimeout(() => setSubmitted(false), 5000)
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Submission error:', error)
      }
      // Handle validation errors with details
      if (error?.data?.details && Array.isArray(error.data.details)) {
        const errorMessages = error.data.details.map((d: any) => d.message).join(', ')
        setError(errorMessages)
      } else {
        setError(error?.message || 'Failed to submit form. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header />
      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get in touch with our team for technical support, product inquiries, or partnership opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submitted ? (
                    <div className="text-center py-8">
                      <div className="text-green-600 mb-2 text-lg font-semibold">
                        ✓ Message Sent Successfully!
                      </div>
                      <p className="text-sm text-gray-600">
                        We'll get back to you within 24 hours.
                      </p>
                    </div>
                  ) : (
                    <form 
                      onSubmit={handleSubmit(onSubmit, (errors) => {
                        if (process.env.NODE_ENV === 'development') {
                          console.log('Form validation errors:', errors)
                        }
                        // Show first error if validation fails
                        const firstError = Object.values(errors)[0]
                        if (firstError?.message) {
                          setError(firstError.message)
                        }
                      })} 
                      className="space-y-6"
                    >
                      {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                          {error}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            {...register('name')}
                            placeholder="Your Name"
                          />
                          {errors.name && (
                            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            {...register('email')}
                            placeholder="your.email@company.com"
                          />
                          {errors.email && (
                            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Phone *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            {...register('phone')}
                            placeholder="+91-XXX-XXXX-XXXX"
                          />
                          {errors.phone && (
                            <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="company">Company *</Label>
                          <Input
                            id="company"
                            {...register('company')}
                            placeholder="Your Company"
                          />
                          {errors.company && (
                            <p className="text-sm text-red-500 mt-1">{errors.company.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="message">Message *</Label>
                        <textarea
                          id="message"
                          {...register('message')}
                          rows={6}
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Tell us about your requirements..."
                        />
                        {errors.message && (
                          <p className="text-sm text-red-500 mt-1">{errors.message.message}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="meetingRequest"
                          checked={meetingRequest || false}
                          onCheckedChange={(checked) => {
                            const { onChange } = register('meetingRequest')
                            onChange({
                              target: { value: checked === true },
                            })
                          }}
                        />
                        <Label htmlFor="meetingRequest" className="text-sm cursor-pointer">
                          Request an online meeting
                        </Label>
                      </div>
                      {errors.meetingRequest && (
                        <p className="text-sm text-red-500 mt-1">{errors.meetingRequest.message}</p>
                      )}

                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Send Message'
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Telephone</p>
                      <p className="text-sm text-gray-600">{contactInfo.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Email</p>
                      <p className="text-sm text-gray-600">{contactInfo.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {(contactInfo.registeredAddress || contactInfo.factoryLocation2) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Locations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {contactInfo.registeredAddress && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-semibold">Registered Address & Factory Location I</p>
                          <p className="text-sm text-gray-600 whitespace-pre-line">{contactInfo.registeredAddress}</p>
                        </div>
                      </div>
                    )}
                    {contactInfo.factoryLocation2 && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-semibold">Factory Location II</p>
                          <p className="text-sm text-gray-600 whitespace-pre-line">{contactInfo.factoryLocation2}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {contactInfo.regionalContacts && 
                (contactInfo.regionalContacts.bangalore || 
                 contactInfo.regionalContacts.kolkata || 
                 contactInfo.regionalContacts.gurgaon) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pan India Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {contactInfo.regionalContacts.bangalore && (
                      <div>
                        <p className="font-semibold text-sm">Bangalore Contact:</p>
                        <p className="text-sm text-gray-600">{contactInfo.regionalContacts.bangalore}</p>
                      </div>
                    )}
                    {contactInfo.regionalContacts.kolkata && (
                      <div>
                        <p className="font-semibold text-sm">Kolkata Contact:</p>
                        <p className="text-sm text-gray-600">{contactInfo.regionalContacts.kolkata}</p>
                      </div>
                    )}
                    {contactInfo.regionalContacts.gurgaon && (
                      <div>
                        <p className="font-semibold text-sm">Gurgaon Contact:</p>
                        <p className="text-sm text-gray-600">{contactInfo.regionalContacts.gurgaon}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Business Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Monday - Friday</span>
                      <span>9:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Saturday</span>
                      <span>10:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Sunday</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
