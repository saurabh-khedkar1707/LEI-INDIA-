import { z } from 'zod'

// Custom validator for image URLs: accepts full URLs or relative paths starting with /
const imageUrlSchema = z
  .string()
  .refine(
    (val) => {
      if (!val || val === '') return true // Empty string is valid
      // Accept full URLs (http:// or https://)
      if (val.startsWith('http://') || val.startsWith('https://')) {
        try {
          new URL(val)
          return true
        } catch {
          return false
        }
      }
      // Accept relative paths starting with /
      if (val.startsWith('/')) {
        return true
      }
      return false
    },
    {
      message: 'Image must be a valid URL (http:// or https://) or a relative path starting with /',
    }
  )
  .optional()
  .or(z.literal(''))

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
  image: imageUrlSchema,
  parentId: z.union([z.string().uuid(), z.literal('')]).optional(),
})

export const categoryUpdateSchema = categorySchema.partial()

export type CategoryInput = z.infer<typeof categorySchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>

