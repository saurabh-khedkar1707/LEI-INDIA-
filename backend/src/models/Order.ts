import mongoose, { Schema, Document } from 'mongoose'

export interface IRFQItem {
  productId: string
  sku: string
  name: string
  quantity: number
  notes?: string
}

export interface IOrder extends Document {
  companyName: string
  contactName: string
  email: string
  phone: string
  companyAddress?: string
  items: IRFQItem[]
  notes?: string
  status: 'pending' | 'quoted' | 'approved' | 'rejected'
  createdAt: Date
  updatedAt: Date
}

const OrderSchema = new Schema<IOrder>(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    companyAddress: {
      type: String,
      trim: true,
    },
    items: [
      {
        productId: { type: String, required: true },
        sku: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        notes: { type: String },
      },
    ],
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'quoted', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true, // Enable optimistic locking
  }
)

// Add version key for optimistic locking
OrderSchema.set('versionKey', '__v')

export const Order = mongoose.model<IOrder>('Order', OrderSchema)
