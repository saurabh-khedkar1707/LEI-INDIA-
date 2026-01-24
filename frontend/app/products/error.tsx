'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Products page error:', error)
    }
  }, [error])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Something went wrong!</CardTitle>
          <CardDescription>
            We encountered an error while loading products. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={() => reset()} className="w-full">
              Try again
            </Button>
            <Button variant="outline" asChild className="w-full">
              <a href="/">Go to Homepage</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
