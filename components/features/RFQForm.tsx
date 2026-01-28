'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { rfqFormSchema, type RFQFormData } from '@/lib/zod-schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RFQItem } from '@/types'
import { Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useUserAuth } from '@/store/user-auth-store'
import Link from 'next/link'

interface RFQFormProps {
  items: RFQItem[]
  onSuccess?: () => void
}

export function RFQForm({ items, onSuccess }: RFQFormProps) {
  const router = useRouter()
  const { isAuthenticated } = useUserAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const idempotencyKeyRef = useRef<string | null>(null)

  // We rely on the persisted auth store and httpOnly cookie; no manual initialization needed.

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RFQFormData>({
    resolver: zodResolver(rfqFormSchema),
  })

  const onSubmit = async (data: RFQFormData) => {
    // Check authentication before submission
    if (!isAuthenticated) {
      setError('Please login or register to submit RFQ')
      router.push('/login?redirect=/rfq')
      return
    }

    // Prevent double submission
    if (isSubmitting) {
      return
    }

    // Cancel any previous request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    // Generate idempotency key if not already set
    if (!idempotencyKeyRef.current) {
      // Generate a simple UUID-like string
      idempotencyKeyRef.current = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Submit order with idempotency key (CSRF token handled automatically by apiClient)
      const response = await apiClient.post(
        '/api/orders',
        {
          ...data,
          items: items.map(item => ({
            productId: item.productId,
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            notes: item.notes,
          })),
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKeyRef.current,
          },
          signal: abortControllerRef.current.signal,
        }
      )

      setSubmitted(true)
      reset()
      idempotencyKeyRef.current = null // Reset after successful submission
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
          setSubmitted(false)
        }, 2000)
      }
    } catch (error: any) {
      // Don't set error if request was aborted
      if (error.name === 'AbortError') {
        return
      }
      
      setError(error?.message || 'Failed to submit RFQ. Please try again.')
    } finally {
      setIsSubmitting(false)
      abortControllerRef.current = null
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800 mb-4">
            You need to login or register to submit a Request for Quote.
          </p>
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href="/login?redirect=/rfq">Login</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/register?redirect=/rfq">Register</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 mb-2">✓ RFQ Submitted Successfully!</div>
        <p className="text-sm text-gray-600">We'll contact you shortly with a quote.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}
      <div>
        <Label htmlFor="companyName">Company Name *</Label>
        <Input
          id="companyName"
          {...register('companyName')}
          placeholder="Your Company Name"
        />
        {errors.companyName && (
          <p className="text-sm text-red-500 mt-1">{errors.companyName.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="contactName">Contact Name *</Label>
        <Input
          id="contactName"
          {...register('contactName')}
          placeholder="Your Name"
        />
        {errors.contactName && (
          <p className="text-sm text-red-500 mt-1">{errors.contactName.message}</p>
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
        <Label htmlFor="companyAddress">Company Address</Label>
        <Input
          id="companyAddress"
          {...register('companyAddress')}
          placeholder="Optional"
        />
      </div>

      <div>
        <Label htmlFor="notes">Additional Notes</Label>
        <textarea
          id="notes"
          {...register('notes')}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Any special requirements or notes..."
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || items.length === 0}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit RFQ'
        )}
      </Button>
    </form>
  )
}
