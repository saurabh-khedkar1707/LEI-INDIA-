import { z } from 'zod'

// Authorised Distributor validation
export const authorisedDistributorSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  logo: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  displayOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
})

// Principal Partner validation
export const principalPartnerSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  logo: z.string().optional().or(z.literal('')),
  companyDetails: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  displayOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
})

// Technical Details validation
export const technicalDetailsSchema = z.object({
  productId: z.string().uuid().optional(),
  tab: z.enum(['sales', 'technical'], {
    errorMap: () => ({ message: 'Tab must be either "sales" or "technical"' }),
  }),
  title: z.string().optional().or(z.literal('')),
  content: z.string().optional().or(z.literal('')),
  displayOrder: z.number().int().min(0).default(0),
})

// About Us Content validation
export const aboutUsContentSchema = z.object({
  section: z.string().min(1, 'Section identifier is required'),
  title: z.string().optional().or(z.literal('')),
  content: z.string().min(1, 'Content is required'),
  displayOrder: z.number().int().min(0).default(0),
})

// Technical Support Content validation
export const technicalSupportContentSchema = z.object({
  section: z.string().min(1, 'Section identifier is required'),
  title: z.string().optional().or(z.literal('')),
  content: z.string().min(1, 'Content is required'),
  displayOrder: z.number().int().min(0).default(0),
})

// Company Policy validation
export const companyPolicySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().min(1, 'Content is required'),
  policyType: z.string().optional().or(z.literal('')),
  displayOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
})

// Returns Content validation
export const returnsContentSchema = z.object({
  section: z.string().min(1, 'Section identifier is required'),
  title: z.string().optional().or(z.literal('')),
  content: z.string().min(1, 'Content is required'),
  displayOrder: z.number().int().min(0).default(0),
})

// Helper function to generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
