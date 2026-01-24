import mongoose, { Schema, Document } from 'mongoose'

export interface IContactInfo extends Document {
  phone: string
  email: string
  address: string
  registeredAddress?: string
  factoryLocation2?: string
  regionalContacts?: {
    bangalore?: string
    kolkata?: string
    gurgaon?: string
  }
  createdAt: Date
  updatedAt: Date
}

const ContactInfoSchema = new Schema<IContactInfo>(
  {
    phone: {
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
    address: {
      type: String,
      required: true,
      trim: true,
    },
    registeredAddress: {
      type: String,
      trim: true,
    },
    factoryLocation2: {
      type: String,
      trim: true,
    },
    regionalContacts: {
      bangalore: {
        type: String,
        trim: true,
      },
      kolkata: {
        type: String,
        trim: true,
      },
      gurgaon: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
)

export const ContactInfo = mongoose.model<IContactInfo>('ContactInfo', ContactInfoSchema)
