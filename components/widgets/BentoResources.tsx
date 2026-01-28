'use client'

import { motion } from 'framer-motion'
import { FileText, Video, Download, BookOpen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const resources = [
  {
    id: 1,
    title: 'M12 Connector Installation Guide',
    type: 'guide',
    description: 'Step-by-step installation instructions for M12 connectors',
    icon: BookOpen,
    size: 'large',
    color: 'bg-blue-500',
  },
  {
    id: 2,
    title: 'Product Catalog 2024',
    type: 'catalog',
    description: 'Complete product catalog with specifications',
    icon: FileText,
    size: 'medium',
    color: 'bg-orange-500',
  },
  {
    id: 3,
    title: 'Industrial Ethernet Setup',
    type: 'video',
    description: 'Video tutorial on setting up Industrial Ethernet',
    icon: Video,
    size: 'small',
    color: 'bg-purple-500',
  },
  {
    id: 4,
    title: 'Technical Specifications',
    type: 'specs',
    description: 'Detailed technical specifications for all products',
    icon: FileText,
    size: 'small',
    color: 'bg-green-500',
  },
  {
    id: 5,
    title: 'PROFINET Configuration',
    type: 'guide',
    description: 'Complete guide to PROFINET configuration',
    icon: BookOpen,
    size: 'medium',
    color: 'bg-indigo-500',
  },
  {
    id: 6,
    title: 'Safety Standards',
    type: 'document',
    description: 'Industry safety standards and compliance',
    icon: FileText,
    size: 'large',
    color: 'bg-red-500',
  },
]

const sizeClasses = {
  small: 'col-span-1 row-span-1',
  medium: 'col-span-1 md:col-span-2 lg:col-span-2 row-span-1',
  large: 'col-span-1 md:col-span-2 lg:col-span-2 row-span-2',
}

export function BentoResources() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Technical Knowledge Center
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Access technical documents, installation guides, and video tutorials
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {resources.map((resource, index) => {
            const Icon = resource.icon
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={sizeClasses[resource.size as keyof typeof sizeClasses]}
              >
                <Card className="h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${resource.color} flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
