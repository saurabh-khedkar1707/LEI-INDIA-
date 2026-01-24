import { connectDatabase, disconnectDatabase } from '../src/utils/database.js'
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { Admin } from '../src/models/Admin.js'
import { Product } from '../src/models/Product.js'
import { Order } from '../src/models/Order.js'
import { Inquiry } from '../src/models/Inquiry.js'
import { Resource } from '../src/models/Resource.js'
import { ContactInfo } from '../src/models/ContactInfo.js'
import mongoose from 'mongoose'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dataDir = join(__dirname, '../data')

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const data = await readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.log(`⚠️  File not found or empty: ${filePath}`)
    return null
  }
}

async function migrateAdmins() {
  console.log('\n📦 Migrating Admins...')
  const adminsData = await readJsonFile<any[]>(join(dataDir, 'admins.json'))
  
  if (!adminsData || adminsData.length === 0) {
    console.log('   No admins to migrate')
    return
  }

  let migrated = 0
  let skipped = 0

  for (const admin of adminsData) {
    try {
      // Check if admin already exists
      const existing = await Admin.findOne({ username: admin.username.toLowerCase() })
      if (existing) {
        console.log(`   ⏭️  Skipped: Admin "${admin.username}" already exists`)
        skipped++
        continue
      }

      // Convert old id format to new format if needed
      const newAdmin = new Admin({
        username: admin.username.toLowerCase(),
        passwordHash: admin.passwordHash,
        role: admin.role || 'admin',
        createdAt: admin.createdAt ? new Date(admin.createdAt) : new Date(),
        updatedAt: admin.updatedAt ? new Date(admin.updatedAt) : new Date(),
      })

      await newAdmin.save()
      console.log(`   ✅ Migrated: Admin "${admin.username}"`)
      migrated++
    } catch (error: any) {
      console.error(`   ❌ Error migrating admin "${admin.username}":`, error.message)
    }
  }

  console.log(`   📊 Summary: ${migrated} migrated, ${skipped} skipped`)
}

async function migrateProducts() {
  console.log('\n📦 Migrating Products...')
  const productsData = await readJsonFile<any[]>(join(dataDir, 'products.json'))
  
  if (!productsData || productsData.length === 0) {
    console.log('   No products to migrate')
    return
  }

  let migrated = 0
  let skipped = 0

  for (const product of productsData) {
    try {
      // Check if product already exists by SKU
      const existing = await Product.findOne({ sku: product.sku })
      if (existing) {
        console.log(`   ⏭️  Skipped: Product "${product.sku}" already exists`)
        skipped++
        continue
      }

      // Convert relatedProducts from string IDs to ObjectIds
      const relatedProducts = product.relatedProducts?.map((id: string) => {
        // If it's already a valid ObjectId string, use it
        if (mongoose.Types.ObjectId.isValid(id)) {
          return new mongoose.Types.ObjectId(id)
        }
        return null
      }).filter(Boolean) || []

      const newProduct = new Product({
        sku: product.sku,
        name: product.name,
        category: product.category,
        description: product.description,
        technicalDescription: product.technicalDescription,
        coding: product.coding,
        pins: product.pins,
        ipRating: product.ipRating,
        gender: product.gender,
        connectorType: product.connectorType,
        specifications: product.specifications,
        price: product.price,
        priceType: product.priceType || 'quote',
        inStock: product.inStock !== undefined ? product.inStock : true,
        stockQuantity: product.stockQuantity,
        images: product.images || [],
        datasheetUrl: product.datasheetUrl,
        relatedProducts,
        createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
        updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      })

      await newProduct.save()
      console.log(`   ✅ Migrated: Product "${product.sku}"`)
      migrated++
    } catch (error: any) {
      console.error(`   ❌ Error migrating product "${product.sku}":`, error.message)
    }
  }

  console.log(`   📊 Summary: ${migrated} migrated, ${skipped} skipped`)
}

async function migrateOrders() {
  console.log('\n📦 Migrating Orders...')
  const ordersData = await readJsonFile<any[]>(join(dataDir, 'orders.json'))
  
  if (!ordersData || ordersData.length === 0) {
    console.log('   No orders to migrate')
    return
  }

  let migrated = 0

  for (const order of ordersData) {
    try {
      const newOrder = new Order({
        companyName: order.companyName,
        contactName: order.contactName,
        email: order.email,
        phone: order.phone,
        companyAddress: order.companyAddress,
        items: order.items || [],
        notes: order.notes,
        status: order.status || 'pending',
        createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
        updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
      })

      await newOrder.save()
      migrated++
    } catch (error: any) {
      console.error(`   ❌ Error migrating order:`, error.message)
    }
  }

  console.log(`   📊 Summary: ${migrated} orders migrated`)
}

async function migrateInquiries() {
  console.log('\n📦 Migrating Inquiries...')
  const inquiriesData = await readJsonFile<any[]>(join(dataDir, 'inquiries.json'))
  
  if (!inquiriesData || inquiriesData.length === 0) {
    console.log('   No inquiries to migrate')
    return
  }

  let migrated = 0

  for (const inquiry of inquiriesData) {
    try {
      const newInquiry = new Inquiry({
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        company: inquiry.company,
        subject: inquiry.subject,
        message: inquiry.message,
        read: inquiry.read || false,
        responded: inquiry.responded || false,
        createdAt: inquiry.createdAt ? new Date(inquiry.createdAt) : new Date(),
        updatedAt: inquiry.updatedAt ? new Date(inquiry.updatedAt) : new Date(),
      })

      await newInquiry.save()
      migrated++
    } catch (error: any) {
      console.error(`   ❌ Error migrating inquiry:`, error.message)
    }
  }

  console.log(`   📊 Summary: ${migrated} inquiries migrated`)
}

async function migrateResources() {
  console.log('\n📦 Migrating Resources...')
  const resourcesData = await readJsonFile<any[]>(join(dataDir, 'resources.json'))
  
  if (!resourcesData || resourcesData.length === 0) {
    console.log('   No resources to migrate')
    return
  }

  let migrated = 0
  let skipped = 0

  for (const resource of resourcesData) {
    try {
      // Check if resource already exists by URL
      const existing = await Resource.findOne({ url: resource.url })
      if (existing) {
        console.log(`   ⏭️  Skipped: Resource "${resource.title}" already exists`)
        skipped++
        continue
      }

      const newResource = new Resource({
        title: resource.title,
        type: resource.type,
        description: resource.description,
        url: resource.url,
        createdAt: resource.createdAt ? new Date(resource.createdAt) : new Date(),
        updatedAt: resource.updatedAt ? new Date(resource.updatedAt) : new Date(),
      })

      await newResource.save()
      console.log(`   ✅ Migrated: Resource "${resource.title}"`)
      migrated++
    } catch (error: any) {
      console.error(`   ❌ Error migrating resource "${resource.title}":`, error.message)
    }
  }

  console.log(`   📊 Summary: ${migrated} migrated, ${skipped} skipped`)
}

async function migrateContactInfo() {
  console.log('\n📦 Migrating Contact Info...')
  const contactInfoData = await readJsonFile<any>(join(dataDir, 'contact-info.json'))
  
  if (!contactInfoData) {
    console.log('   No contact info to migrate (will use defaults)')
    return
  }

  try {
    const existing = await ContactInfo.findOne()
    if (existing) {
      console.log('   ⏭️  Contact info already exists, updating...')
      existing.phone = contactInfoData.phone || existing.phone
      existing.email = contactInfoData.email || existing.email
      existing.address = contactInfoData.address || existing.address
      if (contactInfoData.registeredAddress) existing.registeredAddress = contactInfoData.registeredAddress
      if (contactInfoData.factoryLocation2) existing.factoryLocation2 = contactInfoData.factoryLocation2
      if (contactInfoData.regionalContacts) existing.regionalContacts = contactInfoData.regionalContacts
      await existing.save()
      console.log('   ✅ Updated existing contact info')
    } else {
      const newContactInfo = new ContactInfo({
        phone: contactInfoData.phone || '+91-XXX-XXXX-XXXX',
        email: contactInfoData.email || 'info@leiindias.com',
        address: contactInfoData.address || 'Industrial Area, India',
        registeredAddress: contactInfoData.registeredAddress,
        factoryLocation2: contactInfoData.factoryLocation2,
        regionalContacts: contactInfoData.regionalContacts,
      })
      await newContactInfo.save()
      console.log('   ✅ Migrated contact info')
    }
  } catch (error: any) {
    console.error(`   ❌ Error migrating contact info:`, error.message)
  }
}

async function main() {
  console.log('🚀 Starting JSON to Database Migration...\n')

  try {
    // Connect to database
    await connectDatabase()
    console.log('✅ Connected to database\n')

    // Run migrations
    await migrateAdmins()
    await migrateProducts()
    await migrateOrders()
    await migrateInquiries()
    await migrateResources()
    await migrateContactInfo()

    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await disconnectDatabase()
  }
}

main()
