import { connectDatabase, disconnectDatabase } from '../src/utils/database.js'
import { Product } from '../src/models/Product.js'

async function seedProducts() {
  console.log('🌱 Seeding products into database...\n')

  try {
    await connectDatabase()
    console.log('✅ Connected to database\n')

    // Products data to seed
    const productsData = [
      {
        id: 'm12-a-5pin-male',
        sku: 'LEI-M12-A-5P-M',
        name: 'M12 A-Coded 5-Pin Male Field Wireable Connector',
        category: 'M12 Connectors',
        description: 'Professional grade M12 A-coded 5-pin male connector for field wiring applications.',
        technicalDescription: 'This M12 A-coded connector features 5 pins and is designed for sensor and actuator applications. Field wireable design allows for easy installation in industrial environments.',
        coding: 'A',
        pins: 5,
        ipRating: 'IP67',
        gender: 'Male',
        connectorType: 'M12',
        specifications: {
          material: 'Nickel-plated brass, PBT housing',
          voltage: '250V AC/DC',
          current: '4A',
          temperatureRange: '-40°C to +85°C',
          wireGauge: 'AWG 24-28'
        },
        priceType: 'quote',
        inStock: true,
        stockQuantity: 150,
        images: ['/images/m12-a-5pin-male.jpg'],
        datasheetUrl: '/datasheets/m12-a-5pin-male.pdf',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'm12-a-5pin-female',
        sku: 'LEI-M12-A-5P-F',
        name: 'M12 A-Coded 5-Pin Female Field Wireable Connector',
        category: 'M12 Connectors',
        description: 'Professional grade M12 A-coded 5-pin female connector for field wiring applications.',
        technicalDescription: 'This M12 A-coded connector features 5 pins and is designed for sensor and actuator applications. Field wireable design allows for easy installation in industrial environments.',
        coding: 'A',
        pins: 5,
        ipRating: 'IP67',
        gender: 'Female',
        connectorType: 'M12',
        specifications: {
          material: 'Nickel-plated brass, PBT housing',
          voltage: '250V AC/DC',
          current: '4A',
          temperatureRange: '-40°C to +85°C',
          wireGauge: 'AWG 24-28'
        },
        priceType: 'quote',
        inStock: true,
        stockQuantity: 120,
        images: ['/images/m12-a-5pin-female.jpg'],
        datasheetUrl: '/datasheets/m12-a-5pin-female.pdf',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'm12-a-4pin-male',
        sku: 'LEI-M12-A-4P-M',
        name: 'M12 A-Coded 4-Pin Male Field Wireable Connector',
        category: 'M12 Connectors',
        description: 'Professional grade M12 A-coded 4-pin male connector for sensor applications.',
        technicalDescription: 'This M12 A-coded connector features 4 pins and is designed for standard sensor applications. Field wireable design allows for easy installation.',
        coding: 'A',
        pins: 4,
        ipRating: 'IP67',
        gender: 'Male',
        connectorType: 'M12',
        specifications: {
          material: 'Nickel-plated brass, PBT housing',
          voltage: '250V AC/DC',
          current: '4A',
          temperatureRange: '-40°C to +85°C',
          wireGauge: 'AWG 24-28'
        },
        priceType: 'quote',
        inStock: true,
        stockQuantity: 200,
        images: ['/images/m12-a-4pin-male.jpg'],
        datasheetUrl: '/datasheets/m12-a-4pin-male.pdf',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'm12-b-5pin-male',
        sku: 'LEI-M12-B-5P-M',
        name: 'M12 B-Coded 5-Pin Male Field Wireable Connector',
        category: 'M12 Connectors',
        description: 'Professional grade M12 B-coded 5-pin male connector for fieldbus applications.',
        technicalDescription: 'This M12 B-coded connector features 5 pins and is designed for fieldbus and network applications. Field wireable design allows for easy installation.',
        coding: 'B',
        pins: 5,
        ipRating: 'IP67',
        gender: 'Male',
        connectorType: 'M12',
        specifications: {
          material: 'Nickel-plated brass, PBT housing',
          voltage: '30V DC',
          current: '2A',
          temperatureRange: '-40°C to +85°C',
          wireGauge: 'AWG 24-28'
        },
        priceType: 'quote',
        inStock: true,
        stockQuantity: 80,
        images: ['/images/m12-b-5pin-male.jpg'],
        datasheetUrl: '/datasheets/m12-b-5pin-male.pdf',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'm12-d-4pin-male',
        sku: 'LEI-M12-D-4P-M',
        name: 'M12 D-Coded 4-Pin Male Field Wireable Connector',
        category: 'M12 Connectors',
        description: 'Professional grade M12 D-coded 4-pin male connector for Ethernet applications.',
        technicalDescription: 'This M12 D-coded connector features 4 pins and is designed for Industrial Ethernet applications. Field wireable design allows for easy installation.',
        coding: 'D',
        pins: 4,
        ipRating: 'IP67',
        gender: 'Male',
        connectorType: 'M12',
        specifications: {
          material: 'Nickel-plated brass, PBT housing',
          voltage: '30V DC',
          current: '1.5A',
          temperatureRange: '-40°C to +85°C',
          wireGauge: 'AWG 24-28'
        },
        priceType: 'quote',
        inStock: true,
        stockQuantity: 95,
        images: ['/images/m12-d-4pin-male.jpg'],
        datasheetUrl: '/datasheets/m12-d-4pin-male.pdf',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'm8-a-4pin-male',
        sku: 'LEI-M8-A-4P-M',
        name: 'M8 A-Coded 4-Pin Male Field Wireable Connector',
        category: 'M8 Connectors',
        description: 'Professional grade M8 A-coded 4-pin male connector for compact sensor applications.',
        technicalDescription: 'This M8 A-coded connector features 4 pins and is designed for compact sensor and actuator applications. Field wireable design allows for easy installation in tight spaces.',
        coding: 'A',
        pins: 4,
        ipRating: 'IP67',
        gender: 'Male',
        connectorType: 'M8',
        specifications: {
          material: 'Nickel-plated brass, PBT housing',
          voltage: '250V AC/DC',
          current: '2A',
          temperatureRange: '-40°C to +85°C',
          wireGauge: 'AWG 24-28'
        },
        priceType: 'quote',
        inStock: true,
        stockQuantity: 175,
        images: ['/images/m8-a-4pin-male.jpg'],
        datasheetUrl: '/datasheets/m8-a-4pin-male.pdf',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'm8-d-4pin-male',
        sku: 'LEI-M8-D-4P-M',
        name: 'M8 D-Coded 4-Pin Male Ethernet Connector',
        category: 'M8 Connectors',
        description: 'Professional grade M8 D-coded 4-pin male connector for Industrial Ethernet applications.',
        technicalDescription: 'This M8 D-coded connector features 4 pins and is designed for Industrial Ethernet applications in compact spaces. Field wireable design allows for easy installation.',
        coding: 'D',
        pins: 4,
        ipRating: 'IP67',
        gender: 'Male',
        connectorType: 'M8',
        specifications: {
          material: 'Nickel-plated brass, PBT housing',
          voltage: '30V DC',
          current: '1.5A',
          temperatureRange: '-40°C to +85°C',
          wireGauge: 'AWG 24-28'
        },
        priceType: 'quote',
        inStock: true,
        stockQuantity: 60,
        images: ['/images/m8-d-4pin-male.jpg'],
        datasheetUrl: '/datasheets/m8-d-4pin-male.pdf',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'rj45-ip67-patch',
        sku: 'LEI-RJ45-IP67-1M',
        name: 'RJ45 Industrial IP67 Patch Cord (1m)',
        category: 'RJ45 Patch Cords',
        description: 'Professional grade RJ45 Industrial Ethernet patch cord with IP67 rating.',
        technicalDescription: 'This RJ45 Industrial patch cord features IP67 protection and is designed for harsh industrial environments. Available in multiple lengths.',
        coding: 'X',
        pins: 8,
        ipRating: 'IP67',
        gender: 'Male',
        connectorType: 'RJ45',
        specifications: {
          material: 'Shielded Cat5e cable, IP67 connectors',
          voltage: '30V DC',
          current: '1.5A',
          temperatureRange: '-40°C to +85°C',
          cableLength: '1m'
        },
        priceType: 'quote',
        inStock: true,
        stockQuantity: 250,
        images: ['/images/rj45-ip67-1m.jpg'],
        datasheetUrl: '/datasheets/rj45-ip67-patch.pdf',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'rj45-ip20-patch',
        sku: 'LEI-RJ45-IP20-2M',
        name: 'RJ45 Industrial IP20 Patch Cord (2m)',
        category: 'RJ45 Patch Cords',
        description: 'Professional grade RJ45 Industrial Ethernet patch cord with IP20 rating for indoor use.',
        technicalDescription: 'This RJ45 Industrial patch cord features IP20 protection and is designed for indoor industrial environments. Available in multiple lengths.',
        coding: 'X',
        pins: 8,
        ipRating: 'IP20',
        gender: 'Male',
        connectorType: 'RJ45',
        specifications: {
          material: 'Shielded Cat5e cable, IP20 connectors',
          voltage: '30V DC',
          current: '1.5A',
          temperatureRange: '0°C to +60°C',
          cableLength: '2m'
        },
        priceType: 'quote',
        inStock: true,
        stockQuantity: 300,
        images: ['/images/rj45-ip20-2m.jpg'],
        datasheetUrl: '/datasheets/rj45-ip20-patch.pdf',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'profinet-m12-rj45',
        sku: 'LEI-PROFINET-M12-RJ45-3M',
        name: 'PROFINET M12 to RJ45 Cordset (3m)',
        category: 'PROFINET Products',
        description: 'Professional grade PROFINET cordset with M12 D-coded connector to RJ45.',
        technicalDescription: 'This PROFINET cordset features an M12 D-coded connector on one end and an RJ45 connector on the other, designed for Industrial Ethernet applications.',
        coding: 'D',
        pins: 4,
        ipRating: 'IP67',
        gender: 'Male',
        connectorType: 'M12',
        specifications: {
          material: 'Shielded Cat5e cable, M12 D-coded and RJ45 connectors',
          voltage: '30V DC',
          current: '1.5A',
          temperatureRange: '-40°C to +85°C',
          cableLength: '3m'
        },
        priceType: 'quote',
        inStock: true,
        stockQuantity: 45,
        images: ['/images/profinet-m12-rj45-3m.jpg'],
        datasheetUrl: '/datasheets/profinet-m12-rj45.pdf',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'm12-a-3pin-male',
        sku: 'LEI-M12-A-3P-M',
        name: 'M12 A-Coded 3-Pin Male Field Wireable Connector',
        category: 'M12 Connectors',
        description: 'Professional grade M12 A-coded 3-pin male connector for simple sensor applications.',
        technicalDescription: 'This M12 A-coded connector features 3 pins and is designed for simple sensor applications. Field wireable design allows for easy installation.',
        coding: 'A',
        pins: 3,
        ipRating: 'IP67',
        gender: 'Male',
        connectorType: 'M12',
        specifications: {
          material: 'Nickel-plated brass, PBT housing',
          voltage: '250V AC/DC',
          current: '4A',
          temperatureRange: '-40°C to +85°C',
          wireGauge: 'AWG 24-28'
        },
        priceType: 'quote',
        inStock: true,
        stockQuantity: 110,
        images: ['/images/m12-a-3pin-male.jpg'],
        datasheetUrl: '/datasheets/m12-a-3pin-male.pdf',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'm12-x-12pin-male',
        sku: 'LEI-M12-X-12P-M',
        name: 'M12 X-Coded 12-Pin Male Field Wireable Connector',
        category: 'M12 Connectors',
        description: 'Professional grade M12 X-coded 12-pin male connector for high-speed data applications.',
        technicalDescription: 'This M12 X-coded connector features 12 pins and is designed for high-speed data transmission applications. Field wireable design allows for easy installation.',
        coding: 'X',
        pins: 12,
        ipRating: 'IP67',
        gender: 'Male',
        connectorType: 'M12',
        specifications: {
          material: 'Nickel-plated brass, PBT housing',
          voltage: '60V DC',
          current: '4A',
          temperatureRange: '-40°C to +85°C',
          wireGauge: 'AWG 24-28'
        },
        priceType: 'quote',
        inStock: true,
        stockQuantity: 35,
        images: ['/images/m12-x-12pin-male.jpg'],
        datasheetUrl: '/datasheets/m12-x-12pin-male.pdf',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }
    ]

    let migrated = 0
    let skipped = 0

    for (const productData of productsData) {
      try {
        // Check if product already exists by SKU
        const existing = await Product.findOne({ sku: productData.sku })
        if (existing) {
          console.log(`   ⏭️  Skipped: Product "${productData.sku}" already exists`)
          skipped++
          continue
        }

        const newProduct = new Product({
          sku: productData.sku,
          name: productData.name,
          category: productData.category,
          description: productData.description,
          technicalDescription: productData.technicalDescription,
          coding: productData.coding,
          pins: productData.pins,
          ipRating: productData.ipRating,
          gender: productData.gender,
          connectorType: productData.connectorType,
          specifications: productData.specifications,
          price: productData.price,
          priceType: productData.priceType || 'quote',
          inStock: productData.inStock !== undefined ? productData.inStock : true,
          stockQuantity: productData.stockQuantity,
          images: productData.images || [],
          datasheetUrl: productData.datasheetUrl,
          relatedProducts: [],
          createdAt: productData.createdAt ? new Date(productData.createdAt) : new Date(),
          updatedAt: productData.updatedAt ? new Date(productData.updatedAt) : new Date(),
        })

        await newProduct.save()
        console.log(`   ✅ Seeded: Product "${productData.sku}"`)
        migrated++
      } catch (error: any) {
        console.error(`   ❌ Error seeding product "${productData.sku}":`, error.message)
      }
    }

    console.log(`\n📊 Summary: ${migrated} seeded, ${skipped} skipped`)
    console.log('\n✅ Product seeding completed successfully!')
  } catch (error) {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await disconnectDatabase()
  }
}

seedProducts()
