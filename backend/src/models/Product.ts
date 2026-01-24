import mongoose, { Schema, Document } from 'mongoose'

export type ConnectorCoding = 'A' | 'B' | 'D' | 'X'
export type PinCount = 3 | 4 | 5 | 8 | 12
export type IPRating = 'IP67' | 'IP68' | 'IP20'
export type ConnectorGender = 'Male' | 'Female'
export type ConnectorType = 'M12' | 'M8' | 'RJ45'

export interface IProduct extends Document {
  sku: string
  name: string
  category: string
  description: string
  technicalDescription: string
  coding: ConnectorCoding
  pins: PinCount
  ipRating: IPRating
  gender: ConnectorGender
  connectorType: ConnectorType
  specifications: {
    material: string
    voltage: string
    current: string
    temperatureRange: string
    wireGauge?: string
    cableLength?: string
  }
  price?: number
  priceType: 'fixed' | 'quote'
  inStock: boolean
  stockQuantity?: number
  images: string[]
  datasheetUrl?: string
  relatedProducts?: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    technicalDescription: {
      type: String,
      required: true,
    },
    coding: {
      type: String,
      enum: ['A', 'B', 'D', 'X'],
      required: true,
    },
    pins: {
      type: Number,
      enum: [3, 4, 5, 8, 12],
      required: true,
    },
    ipRating: {
      type: String,
      enum: ['IP67', 'IP68', 'IP20'],
      required: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: true,
    },
    connectorType: {
      type: String,
      enum: ['M12', 'M8', 'RJ45'],
      required: true,
    },
    specifications: {
      material: { type: String, required: true },
      voltage: { type: String, required: true },
      current: { type: String, required: true },
      temperatureRange: { type: String, required: true },
      wireGauge: { type: String },
      cableLength: { type: String },
    },
    price: {
      type: Number,
    },
    priceType: {
      type: String,
      enum: ['fixed', 'quote'],
      required: true,
      default: 'quote',
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
    },
    images: {
      type: [String],
      default: [],
    },
    datasheetUrl: {
      type: String,
    },
    relatedProducts: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      default: [],
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true, // Enable optimistic locking
  }
)

// Add version key for optimistic locking
ProductSchema.set('versionKey', '__v')

export const Product = mongoose.model<IProduct>('Product', ProductSchema)
