import mongoose, { Schema, Document } from 'mongoose'

export interface ICareer extends Document {
  title: string
  department: string
  location: string
  type: string // Full-time, Part-time, Contract, etc.
  description: string
  requirements?: string
  responsibilities?: string
  benefits?: string
  salary?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const CareerSchema = new Schema<ICareer>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: {
      type: String,
    },
    responsibilities: {
      type: String,
    },
    benefits: {
      type: String,
    },
    salary: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

export const Career = mongoose.model<ICareer>('Career', CareerSchema)
