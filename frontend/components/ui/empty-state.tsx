'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  icon?: LucideIcon
  action?: {
    label: string
    onClick: () => void
    href?: string
  }
}

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  const content = (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        {Icon && (
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {action && (
        <CardContent className="text-center">
          {action.href ? (
            <Button asChild>
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </CardContent>
      )}
    </Card>
  )

  return (
    <div className="flex items-center justify-center min-h-[400px] py-12">
      {content}
    </div>
  )
}
