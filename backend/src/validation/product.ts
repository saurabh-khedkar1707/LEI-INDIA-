import { z } from 'zod'

export const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required').trim(),
  name: z.string().min(1, 'Product name is required').trim(),
  category: z.string().min(1, 'Category is required').trim(),
  description: z.string().min(1, 'Description is required'),
  technicalDescription: z.string().min(1, 'Technical description is required'),
  coding: z.enum(['A', 'B', 'D', 'X'], {
    errorMap: () => ({ message: 'Coding must be A, B, D, or X' })
  }),
  pins: z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(8), z.literal(12)], {
    errorMap: () => ({ message: 'Pins must be 3, 4, 5, 8, or 12' })
  }),
  ipRating: z.enum(['IP67', 'IP68', 'IP20'], {
    errorMap: () => ({ message: 'IP Rating must be IP67, IP68, or IP20' })
  }),
  gender: z.enum(['Male', 'Female'], {
    errorMap: () => ({ message: 'Gender must be Male or Female' })
  }),
  connectorType: z.enum(['M12', 'M8', 'RJ45'], {
    errorMap: () => ({ message: 'Connector type must be M12, M8, or RJ45' })
  }),
  specifications: z.object({
    material: z.string().min(1, 'Material is required'),
    voltage: z.string().min(1, 'Voltage is required'),
    current: z.string().min(1, 'Current is required'),
    temperatureRange: z.string().min(1, 'Temperature range is required'),
    wireGauge: z.string().optional(),
    cableLength: z.string().optional(),
  }),
  price: z.number().positive().optional(),
  priceType: z.enum(['fixed', 'quote']).default('quote'),
  inStock: z.boolean().default(true),
  stockQuantity: z.number().int().positive().optional(),
  images: z.array(z.string()).default([]),
  datasheetUrl: z.string().url().optional().or(z.literal('')),
  relatedProducts: z.array(z.string()).optional(),
})

export const productUpdateSchema = productSchema.partial()
