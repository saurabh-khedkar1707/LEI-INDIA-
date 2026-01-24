import { connectDatabase, disconnectDatabase } from '../src/utils/database.js'
import { Product } from '../src/models/Product.js'
import { Blog } from '../src/models/Blog.js'
import { Career } from '../src/models/Career.js'
import { ContactInfo } from '../src/models/ContactInfo.js'
import { Inquiry } from '../src/models/Inquiry.js'
import { Order } from '../src/models/Order.js'
import { Resource } from '../src/models/Resource.js'

async function seedProducts() {
  console.log('\n📦 Seeding Products...')
  
  const productsData = [
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
  ]

  let seeded = 0
  let skipped = 0

  for (const productData of productsData) {
    try {
      const existing = await Product.findOne({ sku: productData.sku })
      if (existing) {
        skipped++
        continue
      }

      const product = new Product(productData)
      await product.save()
      seeded++
    } catch (error: any) {
      console.error(`   ❌ Error seeding product "${productData.sku}":`, error.message)
    }
  }

  console.log(`   ✅ ${seeded} products seeded, ${skipped} skipped`)
}

async function seedBlogs() {
  console.log('\n📝 Seeding Blogs...')

  const blogsData = [
    {
      title: 'Understanding M12 Connectors: A Complete Guide for Industrial Applications',
      excerpt: 'Learn everything you need to know about M12 connectors, their coding systems, and how to choose the right connector for your industrial automation needs.',
      content: `# Understanding M12 Connectors: A Complete Guide

M12 connectors have become the standard in industrial automation, providing reliable connections for sensors, actuators, and fieldbus systems. In this comprehensive guide, we'll explore everything you need to know about M12 connectors.

## What are M12 Connectors?

M12 connectors are circular connectors with a 12mm thread diameter, designed specifically for industrial environments. They offer excellent protection against dust, moisture, and mechanical stress, making them ideal for harsh industrial applications.

## Coding Systems

M12 connectors use different coding systems to prevent mismating:

- **A-Code**: Standard sensor/actuator applications (4-5 pins)
- **B-Code**: Fieldbus applications (5 pins)
- **D-Code**: Industrial Ethernet (4 pins)
- **X-Code**: High-speed data transmission (8-12 pins)

## Choosing the Right Connector

When selecting an M12 connector, consider:
- Application requirements
- Pin count needed
- Environmental conditions
- IP rating requirements
- Cable specifications

## Installation Best Practices

Proper installation is crucial for reliable performance:
1. Ensure correct pin assignment
2. Use appropriate cable glands
3. Follow torque specifications
4. Verify IP rating compatibility
5. Test connections before deployment

## Conclusion

M12 connectors are essential components in modern industrial automation. Understanding their specifications and proper usage ensures reliable and efficient system operation.`,
      author: 'Rajesh Kumar',
      category: 'Technical Guides',
      image: '/images/blog/m12-guide.jpg',
      published: true,
      publishedAt: new Date('2024-01-15'),
    },
    {
      title: 'Industrial Ethernet: The Future of Manufacturing Connectivity',
      excerpt: 'Discover how Industrial Ethernet is transforming manufacturing operations and enabling Industry 4.0 initiatives.',
      content: `# Industrial Ethernet: The Future of Manufacturing Connectivity

Industrial Ethernet has revolutionized manufacturing connectivity, enabling real-time communication and data exchange in industrial environments.

## Benefits of Industrial Ethernet

- Real-time data transmission
- High bandwidth capabilities
- Standardized protocols
- Scalable network architecture
- Integration with IT systems

## Key Protocols

- PROFINET
- EtherNet/IP
- Modbus TCP/IP
- EtherCAT

## Implementation Considerations

When implementing Industrial Ethernet:
- Choose appropriate connectors (M12 D-coded)
- Ensure proper cable management
- Plan for network redundancy
- Consider environmental factors
- Implement security measures

## Future Trends

The future of Industrial Ethernet includes:
- Time-Sensitive Networking (TSN)
- 5G integration
- Edge computing
- AI-powered analytics

Industrial Ethernet is not just a technology—it's the foundation of smart manufacturing.`,
      author: 'Priya Sharma',
      category: 'Industry Trends',
      image: '/images/blog/industrial-ethernet.jpg',
      published: true,
      publishedAt: new Date('2024-02-10'),
    },
    {
      title: 'IP Ratings Explained: Protecting Your Industrial Equipment',
      excerpt: 'A comprehensive guide to IP ratings and how they protect your industrial connectors and equipment from environmental hazards.',
      content: `# IP Ratings Explained: Protecting Your Industrial Equipment

IP (Ingress Protection) ratings are crucial for selecting the right connectors for your industrial applications.

## Understanding IP Ratings

IP ratings consist of two digits:
- First digit: Protection against solid objects
- Second digit: Protection against liquids

## Common IP Ratings

- **IP20**: Basic protection, indoor use
- **IP67**: Dust-tight, waterproof up to 1m
- **IP68**: Dust-tight, waterproof beyond 1m

## Application Guidelines

Choose IP ratings based on:
- Operating environment
- Exposure to dust and moisture
- Temperature variations
- Mechanical stress

## Maintenance Considerations

Proper maintenance ensures continued protection:
- Regular inspection
- Seal replacement when needed
- Proper cable gland installation
- Environmental monitoring

Protecting your equipment starts with understanding IP ratings.`,
      author: 'Amit Patel',
      category: 'Technical Guides',
      image: '/images/blog/ip-ratings.jpg',
      published: true,
      publishedAt: new Date('2024-03-05'),
    },
    {
      title: 'PROFINET vs EtherNet/IP: Choosing the Right Protocol',
      excerpt: 'Compare PROFINET and EtherNet/IP to make informed decisions about your industrial network protocol.',
      content: `# PROFINET vs EtherNet/IP: Choosing the Right Protocol

Selecting the right industrial Ethernet protocol is crucial for system performance and compatibility.

## PROFINET Overview

PROFINET is an open standard for Industrial Ethernet, offering:
- Real-time communication
- High performance
- Easy integration
- Wide vendor support

## EtherNet/IP Overview

EtherNet/IP uses standard Ethernet technology:
- Based on CIP protocol
- Wide industry adoption
- Good for discrete manufacturing
- Strong in North America

## Comparison Factors

Consider these factors when choosing:
- Existing infrastructure
- Vendor preferences
- Performance requirements
- Integration needs
- Cost considerations

## Making the Decision

The best protocol depends on your specific requirements and existing systems. Both offer excellent performance when properly implemented.`,
      author: 'Sneha Reddy',
      category: 'Technical Guides',
      image: '/images/blog/profinet-vs-ethernet.jpg',
      published: true,
      publishedAt: new Date('2024-03-20'),
    },
    {
      title: 'Best Practices for Industrial Cable Management',
      excerpt: 'Learn essential cable management techniques to ensure reliability and longevity in industrial environments.',
      content: `# Best Practices for Industrial Cable Management

Proper cable management is essential for reliable industrial operations.

## Planning Your Installation

- Route planning
- Cable selection
- Connector placement
- Access considerations

## Installation Techniques

- Proper strain relief
- Cable routing
- Labeling systems
- Documentation

## Maintenance

Regular maintenance includes:
- Visual inspections
- Testing procedures
- Replacement schedules
- Documentation updates

## Common Mistakes to Avoid

- Over-tightening connectors
- Improper cable routing
- Inadequate strain relief
- Poor documentation

Good cable management practices ensure long-term reliability and easier troubleshooting.`,
      author: 'Vikram Singh',
      category: 'Best Practices',
      image: '/images/blog/cable-management.jpg',
      published: true,
      publishedAt: new Date('2024-04-12'),
    },
  ]

  let seeded = 0
  let skipped = 0

  for (const blogData of blogsData) {
    try {
      const existing = await Blog.findOne({ title: blogData.title })
      if (existing) {
        skipped++
        continue
      }

      const blog = new Blog(blogData)
      await blog.save()
      seeded++
    } catch (error: any) {
      console.error(`   ❌ Error seeding blog "${blogData.title}":`, error.message)
    }
  }

  console.log(`   ✅ ${seeded} blogs seeded, ${skipped} skipped`)
}

async function seedCareers() {
  console.log('\n💼 Seeding Careers...')

  const careersData = [
    {
      title: 'Senior Sales Engineer',
      department: 'Sales',
      location: 'Mumbai, India',
      type: 'Full-time',
      description: 'We are seeking an experienced Sales Engineer to join our team and drive growth in the industrial connector market.',
      requirements: 'Bachelor\'s degree in Engineering, 5+ years of sales experience in industrial automation, strong technical knowledge of connectors and cables.',
      responsibilities: 'Develop and maintain customer relationships, provide technical support, prepare quotations, achieve sales targets, attend trade shows and exhibitions.',
      benefits: 'Competitive salary, health insurance, performance bonuses, professional development opportunities, flexible work arrangements.',
      salary: '₹8,00,000 - ₹12,00,000 per annum',
      active: true,
    },
    {
      title: 'Product Development Engineer',
      department: 'Engineering',
      location: 'Bangalore, India',
      type: 'Full-time',
      description: 'Join our engineering team to develop new industrial connector products and improve existing designs.',
      requirements: 'Bachelor\'s/Master\'s in Mechanical/Electrical Engineering, 3+ years of product development experience, knowledge of CAD software, understanding of industrial standards.',
      responsibilities: 'Design new products, conduct testing and validation, work with manufacturing team, maintain technical documentation, support quality assurance.',
      benefits: 'Competitive salary, health insurance, stock options, professional development, state-of-the-art facilities.',
      salary: '₹7,00,000 - ₹10,00,000 per annum',
      active: true,
    },
    {
      title: 'Quality Assurance Manager',
      department: 'Quality',
      location: 'Pune, India',
      type: 'Full-time',
      description: 'Lead our quality assurance team to ensure all products meet the highest standards of quality and reliability.',
      requirements: 'Bachelor\'s degree in Engineering, 7+ years of QA experience, knowledge of ISO standards, strong leadership skills.',
      responsibilities: 'Develop QA procedures, manage quality team, conduct audits, ensure compliance, implement continuous improvement initiatives.',
      benefits: 'Competitive salary, health insurance, leadership development programs, performance bonuses.',
      salary: '₹10,00,000 - ₹15,00,000 per annum',
      active: true,
    },
    {
      title: 'Marketing Specialist',
      department: 'Marketing',
      location: 'Delhi, India',
      type: 'Full-time',
      description: 'Drive our marketing initiatives to increase brand awareness and generate leads in the B2B industrial market.',
      requirements: 'Bachelor\'s degree in Marketing or related field, 3+ years of B2B marketing experience, digital marketing skills, content creation abilities.',
      responsibilities: 'Develop marketing campaigns, create content, manage social media, organize events, analyze marketing metrics.',
      benefits: 'Competitive salary, health insurance, creative freedom, professional development, flexible work arrangements.',
      salary: '₹5,00,000 - ₹8,00,000 per annum',
      active: true,
    },
    {
      title: 'Customer Support Representative',
      department: 'Customer Service',
      location: 'Hyderabad, India',
      type: 'Full-time',
      description: 'Provide exceptional customer support and technical assistance to our clients.',
      requirements: 'Diploma/Bachelor\'s degree, excellent communication skills, technical aptitude, customer service experience preferred.',
      responsibilities: 'Handle customer inquiries, provide technical support, process orders, maintain customer relationships, escalate issues when needed.',
      benefits: 'Competitive salary, health insurance, training programs, performance incentives.',
      salary: '₹3,00,000 - ₹5,00,000 per annum',
      active: true,
    },
  ]

  let seeded = 0
  let skipped = 0

  for (const careerData of careersData) {
    try {
      const existing = await Career.findOne({ title: careerData.title, location: careerData.location })
      if (existing) {
        skipped++
        continue
      }

      const career = new Career(careerData)
      await career.save()
      seeded++
    } catch (error: any) {
      console.error(`   ❌ Error seeding career "${careerData.title}":`, error.message)
    }
  }

  console.log(`   ✅ ${seeded} careers seeded, ${skipped} skipped`)
}

async function seedContactInfo() {
  console.log('\n📞 Seeding Contact Info...')

  try {
    const existing = await ContactInfo.findOne()
    if (existing) {
      console.log('   ⏭️  Contact info already exists, updating...')
      existing.phone = '+91 9641027452'
      existing.email = 'info@leiindias.com'
      existing.address = 'G 8/7 Ranjangao MIDC,\nVillage Karegaon, Taluka Shirur,\n412220, Pune, Maharashtra'
      existing.registeredAddress = 'G 8/7 Ranjangao MIDC,\nVillage Karegaon, Taluka Shirur,\n412220, Pune, Maharashtra'
      existing.factoryLocation2 = 'B2347 Wagholi Warehousing,\nPune-Nagar Road, Wagholi\nPune - 412207'
      existing.regionalContacts = {
        bangalore: 'info@leiindias.com',
        kolkata: 'info@leiindias.com',
        gurgaon: 'info@leiindias.com',
      }
      await existing.save()
      console.log('   ✅ Contact info updated')
      return
    }

    const contactInfo = new ContactInfo({
      phone: '+91 9641027452',
      email: 'info@leiindias.com',
      address: 'G 8/7 Ranjangao MIDC,\nVillage Karegaon, Taluka Shirur,\n412220, Pune, Maharashtra',
      registeredAddress: 'G 8/7 Ranjangao MIDC,\nVillage Karegaon, Taluka Shirur,\n412220, Pune, Maharashtra',
      factoryLocation2: 'B2347 Wagholi Warehousing,\nPune-Nagar Road, Wagholi\nPune - 412207',
      regionalContacts: {
        bangalore: 'info@leiindias.com',
        kolkata: 'info@leiindias.com',
        gurgaon: 'info@leiindias.com',
      },
    })

    await contactInfo.save()
    console.log('   ✅ Contact info seeded')
  } catch (error: any) {
    console.error(`   ❌ Error seeding contact info:`, error.message)
  }
}

async function seedInquiries() {
  console.log('\n📧 Seeding Inquiries...')

  const inquiriesData = [
    {
      name: 'Ramesh Kumar',
      email: 'ramesh.kumar@techcorp.in',
      phone: '+91-98765-43210',
      company: 'TechCorp Industries',
      subject: 'Bulk Order Inquiry for M12 Connectors',
      message: 'We are looking to place a bulk order for M12 A-coded connectors. Could you please provide pricing for quantities of 500, 1000, and 5000 units?',
      read: true,
      responded: true,
    },
    {
      name: 'Anjali Mehta',
      email: 'anjali.mehta@automationltd.com',
      phone: '+91-98765-43211',
      company: 'Automation Ltd',
      subject: 'Technical Specification Question',
      message: 'I need clarification on the IP67 rating for your M12 connectors. Can they withstand continuous exposure to water?',
      read: true,
      responded: false,
    },
    {
      name: 'Suresh Patel',
      email: 'suresh.patel@manufacturing.co.in',
      phone: '+91-98765-43212',
      company: 'Advanced Manufacturing Solutions',
      subject: 'Custom Cable Assembly Request',
      message: 'We require custom cable assemblies with M12 connectors on both ends. Can you provide custom manufacturing services?',
      read: false,
      responded: false,
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@industrial.com',
      phone: '+91-98765-43213',
      company: 'Industrial Solutions Pvt Ltd',
      subject: 'Product Catalog Request',
      message: 'Could you please send us your complete product catalog? We are evaluating suppliers for our new manufacturing facility.',
      read: true,
      responded: true,
    },
    {
      name: 'Vikram Singh',
      email: 'vikram.singh@engineering.in',
      phone: '+91-98765-43214',
      company: 'Engineering Solutions',
      subject: 'PROFINET Product Inquiry',
      message: 'We are implementing PROFINET in our facility. Do you have PROFINET-compatible M12 to RJ45 cordsets available?',
      read: false,
      responded: false,
    },
    {
      name: 'Deepak Reddy',
      email: 'deepak.reddy@techsystems.in',
      phone: '+91-98765-43215',
      company: 'Tech Systems India',
      subject: 'Warranty Information',
      message: 'What is the warranty period for your industrial connectors? Also, do you provide on-site technical support?',
      read: true,
      responded: true,
    },
    {
      name: 'Meera Nair',
      email: 'meera.nair@automationtech.com',
      phone: '+91-98765-43216',
      company: 'Automation Technologies',
      subject: 'Sample Request',
      message: 'We would like to request samples of your M12 and M8 connectors for evaluation. How can we proceed?',
      read: false,
      responded: false,
    },
    {
      name: 'Arjun Desai',
      email: 'arjun.desai@industrial.co.in',
      phone: '+91-98765-43217',
      company: 'Industrial Components Co',
      subject: 'Partnership Inquiry',
      message: 'We are interested in becoming a distributor for your products. Could we schedule a meeting to discuss partnership opportunities?',
      read: true,
      responded: false,
    },
  ]

  let seeded = 0
  let skipped = 0

  // Add date variations for inquiries
  const baseDate = new Date()
  const dateOffsets = [0, -2, -5, -7, -10, -12, -15, -20] // Days ago

  for (let i = 0; i < inquiriesData.length; i++) {
    try {
      const inquiryDate = new Date(baseDate)
      inquiryDate.setDate(inquiryDate.getDate() + dateOffsets[i])
      
      const inquiry = new Inquiry({
        ...inquiriesData[i],
        createdAt: inquiryDate,
        updatedAt: inquiryDate,
      })
      await inquiry.save()
      seeded++
    } catch (error: any) {
      console.error(`   ❌ Error seeding inquiry:`, error.message)
    }
  }

  console.log(`   ✅ ${seeded} inquiries seeded, ${skipped} skipped`)
}

async function seedOrders() {
  console.log('\n📦 Seeding Orders...')

  // Get products to use in orders
  const products = await Product.find().limit(5)
  if (products.length === 0) {
    console.log('   ⚠️  No products found. Please seed products first.')
    return
  }

  const ordersData = [
    {
      companyName: 'TechCorp Industries',
      contactName: 'Ramesh Kumar',
      email: 'ramesh.kumar@techcorp.in',
      phone: '+91-98765-43210',
      companyAddress: '123 Industrial Area, Sector 18, Noida, UP 201301',
      items: [
        {
          productId: products[0]._id.toString(),
          sku: products[0].sku,
          name: products[0].name,
          quantity: 500,
          notes: 'Need delivery within 2 weeks',
        },
        {
          productId: products[1]._id.toString(),
          sku: products[1].sku,
          name: products[1].name,
          quantity: 300,
        },
      ],
      notes: 'Urgent order for new production line',
      status: 'pending',
    },
    {
      companyName: 'Automation Ltd',
      contactName: 'Anjali Mehta',
      email: 'anjali.mehta@automationltd.com',
      phone: '+91-98765-43211',
      companyAddress: '456 Tech Park, Bangalore, Karnataka 560001',
      items: [
        {
          productId: products[2]._id.toString(),
          sku: products[2].sku,
          name: products[2].name,
          quantity: 1000,
        },
      ],
      status: 'quoted',
    },
    {
      companyName: 'Advanced Manufacturing Solutions',
      contactName: 'Suresh Patel',
      email: 'suresh.patel@manufacturing.co.in',
      phone: '+91-98765-43212',
      companyAddress: '789 Industrial Estate, Pune, Maharashtra 411001',
      items: [
        {
          productId: products[0]._id.toString(),
          sku: products[0].sku,
          name: products[0].name,
          quantity: 2000,
        },
        {
          productId: products[3]._id.toString(),
          sku: products[3].sku,
          name: products[3].name,
          quantity: 1500,
        },
        {
          productId: products[4]._id.toString(),
          sku: products[4].sku,
          name: products[4].name,
          quantity: 800,
        },
      ],
      notes: 'Bulk order for annual requirements',
      status: 'approved',
    },
    {
      companyName: 'Industrial Solutions Pvt Ltd',
      contactName: 'Priya Sharma',
      email: 'priya.sharma@industrial.com',
      phone: '+91-98765-43213',
      companyAddress: '321 Business Park, Mumbai, Maharashtra 400001',
      items: [
        {
          productId: products[1]._id.toString(),
          sku: products[1].sku,
          name: products[1].name,
          quantity: 750,
        },
      ],
      status: 'pending',
    },
    {
      companyName: 'Engineering Solutions',
      contactName: 'Vikram Singh',
      email: 'vikram.singh@engineering.in',
      phone: '+91-98765-43214',
      companyAddress: '654 Engineering Hub, Chennai, Tamil Nadu 600001',
      items: [
        {
          productId: products[2]._id.toString(),
          sku: products[2].sku,
          name: products[2].name,
          quantity: 500,
        },
        {
          productId: products[0]._id.toString(),
          sku: products[0].sku,
          name: products[0].name,
          quantity: 300,
        },
      ],
      status: 'quoted',
    },
  ]

  let seeded = 0
  let skipped = 0

  // Add date variations for orders
  const baseDate = new Date()
  const dateOffsets = [0, -3, -8, -12, -18] // Days ago

  for (let i = 0; i < ordersData.length; i++) {
    try {
      const orderDate = new Date(baseDate)
      orderDate.setDate(orderDate.getDate() + dateOffsets[i])
      
      const order = new Order({
        ...ordersData[i],
        createdAt: orderDate,
        updatedAt: orderDate,
      })
      await order.save()
      seeded++
    } catch (error: any) {
      console.error(`   ❌ Error seeding order:`, error.message)
    }
  }

  console.log(`   ✅ ${seeded} orders seeded, ${skipped} skipped`)
}

async function seedResources() {
  console.log('\n📚 Seeding Resources...')

  const resourcesData = [
    {
      title: 'M12 Connector Installation Guide',
      type: 'Technical Guide',
      description: 'Comprehensive guide for installing and maintaining M12 connectors in industrial environments.',
      url: '/resources/m12-installation-guide.pdf',
    },
    {
      title: 'Industrial Ethernet Best Practices',
      type: 'White Paper',
      description: 'Best practices for implementing Industrial Ethernet networks in manufacturing facilities.',
      url: '/resources/industrial-ethernet-best-practices.pdf',
    },
    {
      title: 'IP Rating Selection Guide',
      type: 'Technical Guide',
      description: 'Guide to selecting the appropriate IP rating for your application requirements.',
      url: '/resources/ip-rating-selection-guide.pdf',
    },
    {
      title: 'PROFINET Implementation Handbook',
      type: 'Handbook',
      description: 'Complete handbook for implementing PROFINET in industrial automation systems.',
      url: '/resources/profinet-implementation-handbook.pdf',
    },
    {
      title: 'Cable Management Standards',
      type: 'Technical Guide',
      description: 'Industry standards and best practices for cable management in industrial settings.',
      url: '/resources/cable-management-standards.pdf',
    },
    {
      title: 'Product Catalog 2024',
      type: 'Catalog',
      description: 'Complete product catalog featuring all our industrial connectors and cables.',
      url: '/resources/product-catalog-2024.pdf',
    },
    {
      title: 'Safety Guidelines for Industrial Connectors',
      type: 'Safety Guide',
      description: 'Important safety guidelines for working with industrial connectors and electrical systems.',
      url: '/resources/safety-guidelines.pdf',
    },
    {
      title: 'Troubleshooting Common Connector Issues',
      type: 'Technical Guide',
      description: 'Guide to identifying and resolving common issues with industrial connectors.',
      url: '/resources/troubleshooting-guide.pdf',
    },
  ]

  let seeded = 0
  let skipped = 0

  for (const resourceData of resourcesData) {
    try {
      const existing = await Resource.findOne({ title: resourceData.title })
      if (existing) {
        skipped++
        continue
      }

      const resource = new Resource(resourceData)
      await resource.save()
      seeded++
    } catch (error: any) {
      console.error(`   ❌ Error seeding resource "${resourceData.title}":`, error.message)
    }
  }

  console.log(`   ✅ ${resourcesData.length} resources seeded, ${skipped} skipped`)
}

async function main() {
  console.log('🚀 Starting comprehensive data seeding...\n')

  try {
    await connectDatabase()
    console.log('✅ Connected to database\n')

    await seedProducts()
    await seedBlogs()
    await seedCareers()
    await seedContactInfo()
    await seedInquiries()
    await seedOrders()
    await seedResources()

    console.log('\n✅ All data seeding completed successfully!')
  } catch (error) {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await disconnectDatabase()
  }
}

main()
