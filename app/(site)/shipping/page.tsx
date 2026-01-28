import type { Metadata } from "next"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Truck, Globe, Clock, Package, MapPin, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Shipping Information",
  description: "Learn about our shipping options, delivery times, and international shipping policies.",
}

const shippingOptions = [
  {
    name: "Standard Shipping",
    duration: "5-7 business days",
    description: "Economical shipping option for non-urgent orders",
    icon: Truck,

  },
  {
    name: "Express Shipping",
    duration: "2-3 business days",
    description: "Fast delivery for urgent orders",
    icon: Clock,

  },
  {
    name: "International Shipping",
    duration: "7-14 business days",
    description: "Worldwide shipping to over 50 countries",
    icon: Globe,

  },
  {
    name: "Same-Day Delivery",
    duration: "Same day",
    description: "Available in select metropolitan areas",
    icon: Package,

  },
]

const shippingInfo = [
  {
    title: "Order Processing",
    description: "Orders are typically processed within 1-2 business days. You'll receive an email confirmation with tracking information once your order ships.",
    icon: CheckCircle2,
  },
  {
    title: "Delivery Areas",
    description: "We ship to all major cities in India and internationally to over 50 countries. International shipping times vary by destination.",
    icon: MapPin,
  },
  {
    title: "Tracking",
    description: "All orders include tracking information. You'll receive updates via email and can track your shipment in real-time on our website.",
    icon: Package,
  },
  {
    title: "Customs & Duties",
    description: "International orders may be subject to customs fees and import duties, which are the responsibility of the customer.",
    icon: Globe,
  },
]

export default function ShippingPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Shipping Information
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Fast, reliable shipping options to meet your needs
              </p>
            </div>
          </div>
        </section>

        {/* Shipping Options */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Shipping Options
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Choose the shipping method that works best for you
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {shippingOptions.map((option, index) => {
                const Icon = option.icon
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{option.name}</CardTitle>
                      <CardDescription>{option.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{option.duration}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Shipping Information */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
                Important Shipping Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {shippingInfo.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
                            <CardDescription>{item.description}</CardDescription>
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

        {/* Delivery Times */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Estimated Delivery Times</CardTitle>
                  <CardDescription>
                    Delivery times are estimates and may vary based on location, weather, and carrier delays
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="font-medium">Metro Cities (Delhi, Mumbai, Bangalore, etc.)</span>
                      <span className="text-gray-600">2-3 business days</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="font-medium">Tier 2 Cities</span>
                      <span className="text-gray-600">3-5 business days</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b">
                      <span className="font-medium">Tier 3 Cities & Rural Areas</span>
                      <span className="text-gray-600">5-7 business days</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="font-medium">International (Asia Pacific)</span>
                      <span className="text-gray-600">7-10 business days</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-t">
                      <span className="font-medium">International (Europe, Americas)</span>
                      <span className="text-gray-600">10-14 business days</span>
                    </div>
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
              Questions About Shipping?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Contact our customer service team for shipping inquiries
            </p>
            <Button asChild variant="secondary" size="lg">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
