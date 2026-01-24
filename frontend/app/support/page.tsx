import type { Metadata } from "next"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wrench, FileText, Video, MessageSquare, Download, BookOpen } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Technical Support",
  description: "Get technical support for our products. Access documentation, guides, and expert assistance.",
}

const supportOptions = [
  {
    icon: FileText,
    title: "Product Documentation",
    description: "Comprehensive technical documentation, datasheets, and specifications for all our products.",
    link: "/resources",
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description: "Step-by-step video guides for installation, configuration, and troubleshooting.",
    link: "/resources",
  },
  {
    icon: Download,
    title: "Downloads & Software",
    description: "Download drivers, firmware updates, configuration tools, and software utilities.",
    link: "/resources",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description: "Search our extensive knowledge base for answers to common technical questions.",
    link: "/resources",
  },
  {
    icon: MessageSquare,
    title: "Live Technical Support",
    description: "Chat with our technical experts for real-time assistance with your technical questions.",
    link: "/contact",
  },
  {
    icon: Wrench,
    title: "Installation Support",
    description: "Get help with product installation, wiring, and configuration from our technical team.",
    link: "/contact",
  },
]

const supportTopics = [
  {
    category: "Installation & Setup",
    topics: [
      "M12 Connector Installation Guide",
      "RJ45 Patch Cord Wiring",
      "PROFINET Configuration",
      "Network Setup & Troubleshooting",
    ],
  },
  {
    category: "Product Specifications",
    topics: [
      "Technical Datasheets",
      "Pin Configurations",
      "Environmental Ratings",
      "Compatibility Information",
    ],
  },
  {
    category: "Troubleshooting",
    topics: [
      "Connection Issues",
      "Signal Problems",
      "Compatibility Issues",
      "Performance Optimization",
    ],
  },
]

export default function TechnicalSupportPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Technical Support
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Expert technical assistance for all our products
              </p>
            </div>
          </div>
        </section>

        {/* Support Options */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How We Can Help
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Access technical resources and get expert support
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supportOptions.map((option, index) => {
                const Icon = option.icon
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{option.title}</CardTitle>
                      <CardDescription>{option.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* <Button asChild variant="outline" className="w-full">
                        <Link href={option.link}>Access Resource</Link>
                      </Button> */}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Support Topics */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
                Popular Support Topics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {supportTopics.map((category, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{category.category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {category.topics.map((topic, topicIndex) => (
                          <li key={topicIndex} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl">Need Direct Technical Support?</CardTitle>
                  <CardDescription className="text-base">
                    Our technical support team is available to help with complex issues, custom configurations, and specialized technical questions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold mb-2">When contacting technical support, please provide:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        <li>Product model number and part number</li>
                        <li>Detailed description of the issue or question</li>
                        <li>Error messages or symptoms (if applicable)</li>
                        <li>Your application environment and requirements</li>
                        <li>Photos or diagrams (if helpful)</li>
                      </ul>
                    </div>
                    <div className="pt-4">
                      <Button asChild size="lg" className="w-full sm:w-auto">
                        <Link href="/contact">Contact Technical Support</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {/* <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Explore Our Resources
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Browse our comprehensive resource library for documentation, guides, and more
            </p>
            <Button asChild variant="secondary" size="lg">
              <Link href="/resources">View Resources</Link>
            </Button>
          </div>
        </section> */}
      </main>
      <Footer />
    </>
  )
}
