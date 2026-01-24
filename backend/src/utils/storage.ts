import { connectDatabase } from './database.js'
import { Product, IProduct } from '../models/Product.js'
import { Order, IOrder } from '../models/Order.js'
import { Inquiry, IInquiry } from '../models/Inquiry.js'
import { Resource, IResource } from '../models/Resource.js'
import { Admin, IAdmin } from '../models/Admin.js'
import { ContactInfo, IContactInfo } from '../models/ContactInfo.js'
import { User, IUser } from '../models/User.js'
import { Idempotency } from '../models/Idempotency.js'
import mongoose from 'mongoose'

// Ensure database connection before operations
async function ensureConnection() {
  await connectDatabase()
}

// Products
export async function readProducts() {
  await ensureConnection()
  const products = await Product.find().lean()
  return products.map((p) => ({
    ...p,
    id: p._id.toString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    relatedProducts: p.relatedProducts?.map((id) => id.toString()) || [],
  }))
}

export async function getProductById(id: string) {
  await ensureConnection()
  
  // Try ObjectId first
  if (mongoose.Types.ObjectId.isValid(id)) {
    const product = await Product.findById(id).lean()
    if (product) {
      return {
        ...product,
        id: product._id.toString(),
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        relatedProducts: product.relatedProducts?.map((id) => id.toString()) || [],
      }
    }
  }
  
  // If not found by ObjectId, try SKU
  const product = await Product.findOne({ sku: id }).lean()
  if (!product) return null
  
  return {
    ...product,
    id: product._id.toString(),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    relatedProducts: product.relatedProducts?.map((id) => id.toString()) || [],
  }
}

export async function createProduct(productData: any) {
  await ensureConnection()
  const relatedProducts = productData.relatedProducts?.map(
    (id: string) => new mongoose.Types.ObjectId(id)
  ) || []
  
  const product = new Product({
    ...productData,
    relatedProducts,
  })
  await product.save()
  return {
    ...product.toObject(),
    id: product._id.toString(),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    relatedProducts: (product.relatedProducts || []).map((id) => id.toString()),
  }
}

export async function updateProduct(id: string, updates: any) {
  await ensureConnection()
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null
  }
  
  if (updates.relatedProducts) {
    updates.relatedProducts = updates.relatedProducts.map(
      (id: string) => new mongoose.Types.ObjectId(id)
    )
  }
  
  try {
    // Use findByIdAndUpdate with version check for optimistic locking
    const product = await Product.findById(id)
    if (!product) return null
    
    // Check version if provided (optimistic locking)
    if (updates.__v !== undefined && product.__v !== updates.__v) {
      throw new Error('Product has been modified by another user. Please refresh and try again.')
    }
    
    // Apply updates
    Object.assign(product, updates, { updatedAt: new Date() })
    await product.save()
    
    return {
      ...product.toObject(),
      id: product._id.toString(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      relatedProducts: product.relatedProducts?.map((id) => id.toString()) || [],
    }
  } catch (error: any) {
    if (error.message.includes('modified by another user')) {
      throw error // Re-throw version conflict errors
    }
    // For other errors, return null (product not found or validation error)
    return null
  }
}

export async function deleteProduct(id: string) {
  await ensureConnection()
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false
  }
  const result = await Product.findByIdAndDelete(id)
  return !!result
}

// Orders
export async function readOrders() {
  await ensureConnection()
  const orders = await Order.find().lean().sort({ createdAt: -1 })
  return orders.map((o) => ({
    ...o,
    id: o._id.toString(),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }))
}

export async function getOrderById(id: string) {
  await ensureConnection()
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null
  }
  const order = await Order.findById(id).lean()
  if (!order) return null
  return {
    ...order,
    id: order._id.toString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  }
}

export async function createOrder(orderData: any, session?: mongoose.ClientSession) {
  await ensureConnection()
  
  // If session provided, use transaction; otherwise create new session
  const shouldStartTransaction = !session
  if (shouldStartTransaction) {
    session = await mongoose.startSession()
    session.startTransaction()
  }

  try {
    // Validate all products exist and are available before creating order
    for (const item of orderData.items) {
      const product = await getProductById(item.productId)
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }
      
      if (!product.inStock) {
        throw new Error(`Product ${item.sku} is out of stock`)
      }
      
      if (product.sku !== item.sku) {
        throw new Error(`SKU mismatch for product ${item.productId}. Expected ${product.sku}, got ${item.sku}`)
      }
      
      // Validate stock quantity if stockQuantity is set
      if (product.stockQuantity !== undefined && product.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.sku}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`)
      }
    }

    // Create order within transaction
    const order = new Order({
      ...orderData,
      status: orderData.status || 'pending',
    })
    
    await order.save({ session })

    // Commit transaction if we started it
    if (shouldStartTransaction && session) {
      await session.commitTransaction()
    }

    return {
      ...order.toObject(),
      id: order._id.toString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }
  } catch (error) {
    // Abort transaction if we started it
    if (shouldStartTransaction && session) {
      await session.abortTransaction()
    }
    throw error
  } finally {
    // End session if we started it
    if (shouldStartTransaction && session) {
      session.endSession()
    }
  }
}

export async function updateOrder(id: string, updates: any) {
  await ensureConnection()
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null
  }
  
  try {
    // Use findById for optimistic locking
    const order = await Order.findById(id)
    if (!order) return null
    
    // Check version if provided (optimistic locking)
    if (updates.__v !== undefined && order.__v !== updates.__v) {
      throw new Error('Order has been modified by another user. Please refresh and try again.')
    }
    
    // Apply updates
    Object.assign(order, updates, { updatedAt: new Date() })
    await order.save()
    
    return {
      ...order.toObject(),
      id: order._id.toString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }
  } catch (error: any) {
    if (error.message.includes('modified by another user')) {
      throw error // Re-throw version conflict errors
    }
    // For other errors, return null (order not found or validation error)
    return null
  }
}

// Inquiries
export async function readInquiries() {
  await ensureConnection()
  const inquiries = await Inquiry.find().lean().sort({ createdAt: -1 })
  return inquiries.map((i) => ({
    ...i,
    id: i._id.toString(),
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }))
}

export async function getInquiryById(id: string) {
  await ensureConnection()
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null
  }
  const inquiry = await Inquiry.findById(id).lean()
  if (!inquiry) return null
  return {
    ...inquiry,
    id: inquiry._id.toString(),
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
  }
}

export async function createInquiry(inquiryData: any) {
  await ensureConnection()
  const inquiry = new Inquiry({
    ...inquiryData,
    read: false,
    responded: false,
  })
  await inquiry.save()
  return {
    ...inquiry.toObject(),
    id: inquiry._id.toString(),
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
  }
}

export async function updateInquiry(id: string, updates: any) {
  await ensureConnection()
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null
  }
  const inquiry = await Inquiry.findByIdAndUpdate(
    id,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).lean()
  
  if (!inquiry) return null
  
  return {
    ...inquiry,
    id: inquiry._id.toString(),
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
  }
}

export async function deleteInquiry(id: string) {
  await ensureConnection()
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false
  }
  const result = await Inquiry.findByIdAndDelete(id)
  return !!result
}

// Resources
export async function readResources() {
  await ensureConnection()
  const resources = await Resource.find().lean().sort({ createdAt: -1 })
  return resources.map((r) => ({
    ...r,
    id: r._id.toString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))
}

// Admin Users
export interface AdminUser {
  id: string
  username: string
  passwordHash: string
  role: 'admin' | 'superadmin'
  createdAt: string
  updatedAt: string
}

export async function readAdmins(): Promise<AdminUser[]> {
  await ensureConnection()
  const admins = await Admin.find().lean()
  return admins.map((a) => ({
    id: a._id.toString(),
    username: a.username,
    passwordHash: a.passwordHash,
    role: a.role,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))
}

export async function getAdminByUsername(username: string): Promise<AdminUser | null> {
  await ensureConnection()
  const admin = await Admin.findOne({ username: username.toLowerCase() }).lean()
  if (!admin) return null
  return {
    id: admin._id.toString(),
    username: admin.username,
    passwordHash: admin.passwordHash,
    role: admin.role,
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
  }
}

export async function createAdmin(adminData: Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<AdminUser> {
  await ensureConnection()
  const admin = new Admin({
    ...adminData,
    username: adminData.username.toLowerCase(),
  })
  await admin.save()
  return {
    id: admin._id.toString(),
    username: admin.username,
    passwordHash: admin.passwordHash,
    role: admin.role,
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
  }
}

export async function updateAdmin(id: string, updates: Partial<AdminUser>): Promise<AdminUser | null> {
  await ensureConnection()
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null
  }
  
  const updateData: any = { ...updates }
  if (updates.username) {
    updateData.username = updates.username.toLowerCase()
  }
  
  const admin = await Admin.findByIdAndUpdate(
    id,
    { ...updateData, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).lean()
  
  if (!admin) return null
  
  return {
    id: admin._id.toString(),
    username: admin.username,
    passwordHash: admin.passwordHash,
    role: admin.role,
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
  }
}

export async function deleteAdmin(id: string): Promise<boolean> {
  await ensureConnection()
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false
  }
  const result = await Admin.findByIdAndDelete(id)
  return !!result
}

// Contact Information
export interface ContactInfo {
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
  updatedAt: string
}

export async function readContactInfo(): Promise<ContactInfo> {
  await ensureConnection()
  let contactInfo = await ContactInfo.findOne().lean()
  if (!contactInfo) {
    // Create default contact info if none exists
    const newContactInfo = new ContactInfo({
      phone: '+91-XXX-XXXX-XXXX',
      email: 'info@leiindias.com',
      address: 'Industrial Area, India',
    })
    await newContactInfo.save()
    contactInfo = newContactInfo.toObject()
  }
  return {
    phone: contactInfo.phone,
    email: contactInfo.email,
    address: contactInfo.address,
    registeredAddress: contactInfo.registeredAddress,
    factoryLocation2: contactInfo.factoryLocation2,
    regionalContacts: contactInfo.regionalContacts,
    updatedAt: contactInfo.updatedAt.toISOString(),
  }
}

export async function updateContactInfo(updates: Partial<Omit<ContactInfo, 'updatedAt'>>): Promise<ContactInfo> {
  await ensureConnection()
  let contactInfo = await ContactInfo.findOne()
  if (!contactInfo) {
    contactInfo = new ContactInfo(updates)
  } else {
    Object.assign(contactInfo, updates)
  }
  await contactInfo.save()
  const saved = contactInfo.toObject()
  return {
    phone: saved.phone,
    email: saved.email,
    address: saved.address,
    registeredAddress: saved.registeredAddress,
    factoryLocation2: saved.factoryLocation2,
    regionalContacts: saved.regionalContacts,
    updatedAt: saved.updatedAt.toISOString(),
  }
}

// Users (Customers)
export interface UserData {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
  role: 'customer'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export async function getUserByEmail(email: string): Promise<IUser | null> {
  await ensureConnection()
  return await User.findOne({ email: email.toLowerCase() })
}

export async function createUser(userData: {
  name: string
  email: string
  password: string
  company?: string
  phone?: string
}): Promise<UserData> {
  await ensureConnection()
  const user = new User({
    ...userData,
    email: userData.email.toLowerCase(),
  })
  await user.save()
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    company: user.company,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

export async function getUserById(id: string): Promise<UserData | null> {
  await ensureConnection()
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null
  }
  const user = await User.findById(id).lean()
  if (!user) return null
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    company: user.company,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

// Idempotency helpers
export async function getCachedResponse(idempotencyKey: string): Promise<{ response: any; statusCode: number } | null> {
  await ensureConnection()
  const cached = await Idempotency.findOne({ key: idempotencyKey }).lean()
  if (!cached || new Date() > cached.expiresAt) {
    return null
  }
  return {
    response: cached.response,
    statusCode: cached.statusCode,
  }
}

export async function cacheResponse(
  idempotencyKey: string,
  response: any,
  statusCode: number,
  ttlSeconds: number = 3600 // Default 1 hour
): Promise<void> {
  await ensureConnection()
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)
  await Idempotency.findOneAndUpdate(
    { key: idempotencyKey },
    {
      key: idempotencyKey,
      response,
      statusCode,
      expiresAt,
    },
    { upsert: true, new: true }
  )
}
