import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').trim(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    })
    .trim(),
  description: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
  parentId: z.union([z.string().uuid(), z.literal('')]).optional(),
})

export const categoryUpdateSchema = categorySchema.partial()

export type CategoryInput = z.infer<typeof categorySchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>

