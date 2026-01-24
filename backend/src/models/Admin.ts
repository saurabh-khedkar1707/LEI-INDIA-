import mongoose, { Schema, Document } from 'mongoose'

export interface IAdmin extends Document {
  username: string
  passwordHash: string
  role: 'admin' | 'superadmin'
  createdAt: Date
  updatedAt: Date
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin',
    },
  },
  {
    timestamps: true,
  }
)

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema)
