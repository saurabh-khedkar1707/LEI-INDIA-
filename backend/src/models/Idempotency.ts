import mongoose, { Schema, Document } from 'mongoose'

export interface IIdempotency extends Document {
  key: string
  response: any
  statusCode: number
  createdAt: Date
  expiresAt: Date
}

const IdempotencySchema = new Schema<IIdempotency>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    response: {
      type: Schema.Types.Mixed,
      required: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index - auto-delete expired documents
    },
  },
  {
    timestamps: true,
  }
)

export const Idempotency = mongoose.model<IIdempotency>('Idempotency', IdempotencySchema)
