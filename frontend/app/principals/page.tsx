import type { Metadata } from "next"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Globe, Award, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Principals",
  description: "Meet our principal partners and manufacturers. We work with leading brands in industrial connectivity.",
}

const principals = [
  {
    name: "Industrial Connectors Inc.",
    category: "M12 & M8 Connectors",
    description: "Leading manufacturer of industrial circular connectors with over 30 years of experience.",
    region: "Global",
    icon: Building2,
  },
  {
    name: "Network Solutions Pro",
    category: "RJ45 & Ethernet",
    description: "Specialized in high-performance network connectivity solutions for industrial applications.",
    region: "Global",
    icon: Building2,
  },
  {
    name: "PROFINET Systems",
    category: "PROFINET Products",
    description: "Expert in PROFINET communication solutions and industrial automation protocols.",
    region: "Europe & Asia",
    icon: Building2,
  },
  {
    name: "Cable Manufacturing Co.",
    category: "Custom Cables",
    description: "Custom cable solutions and assemblies for specialized industrial applications.",
    region: "Global",
    icon: Building2,
  },
]

const benefits = [
  {
    title: "Quality Assurance",
    description: "All our principals maintain the highest quality standards and certifications.",
    icon: Award,
  },
  {
    title: "Global Reach",
    description: "Our network spans multiple continents, ensuring reliable supply chain.",
    icon: Globe,
  },
  {
    title: "Technical Expertise",
    description: "Direct access to manufacturer technical support and engineering resources.",
    icon: CheckCircle2,
  },
  {
    title: "Innovation",
    description: "Partnership with industry leaders ensures access to latest technologies.",
    icon: Award,
  },
]

export default function PrincipalsPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Our Principals
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Trusted partnerships with leading manufacturers in industrial connectivity
              </p>
            </div>
          </div>
        </section>

        {/* Principals List */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Our Principal Partners
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We partner with industry-leading manufacturers to bring you the best products
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {principals.map((principal, index) => {
                const Icon = principal.icon
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{principal.name}</CardTitle>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-primary">{principal.category}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">{principal.region}</span>
                          </div>
                          <CardDescription>{principal.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
                Why Our Partnerships Matter
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon
                  return (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg mb-2">{benefit.title}</CardTitle>
                            <CardDescription>{benefit.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Partnership Info */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Become a Principal Partner</CardTitle>
                  <CardDescription>
                    We're always looking to expand our network of trusted manufacturing partners
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    If you're a manufacturer of industrial connectivity products and interested in partnering with us, we'd love to hear from you. We seek partners who share our commitment to quality, innovation, and customer service.
                  </p>
                  <div>
                    <p className="font-semibold mb-2">What we look for in partners:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      <li>High-quality products with industry certifications</li>
                      <li>Strong technical support capabilities</li>
                      <li>Reliable supply chain and manufacturing capacity</li>
                      <li>Commitment to innovation and product development</li>
                      <li>Alignment with our values and customer service standards</li>
                    </ul>
                  </div>
                  <div className="pt-4">
                    <Button asChild size="lg">
                      <Link href="/contact">Contact Us About Partnerships</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Explore Our Products
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Discover the quality products from our principal partners
            </p>
            <Button asChild variant="secondary" size="lg">
              <Link href="/products">View Products</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
