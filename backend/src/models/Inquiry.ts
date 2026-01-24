import mongoose, { Schema, Document } from 'mongoose'

export interface IInquiry extends Document {
  name: string
  email: string
  phone?: string
  company?: string
  subject: string
  message: string
  read: boolean
  responded: boolean
  createdAt: Date
  updatedAt: Date
}

const InquirySchema = new Schema<IInquiry>(
  {
    name: {
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
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    responded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

export const Inquiry = mongoose.model<IInquiry>('Inquiry', InquirySchema)
