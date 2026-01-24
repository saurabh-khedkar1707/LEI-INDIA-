import mongoose, { Schema, Document } from 'mongoose'

export interface IResource extends Document {
  title: string
  type: string
  description: string
  url: string
  createdAt: Date
  updatedAt: Date
}

const ResourceSchema = new Schema<IResource>(
  {
    title: {
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
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

export const Resource = mongoose.model<IResource>('Resource', ResourceSchema)
