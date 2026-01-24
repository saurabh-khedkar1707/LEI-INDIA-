import type { Metadata } from "next"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, MessageSquare, Phone, Mail, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Customer Service",
  description: "Get help with your orders, products, and inquiries. Our customer service team is here to assist you.",
}

const services = [
  {
    icon: MessageSquare,
    title: "Live Chat Support",
    description: "Chat with our support team in real-time for immediate assistance.",
    available: "Mon-Fri, 9 AM - 6 PM IST",
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Call us directly for urgent matters or complex technical questions.",
    available: "Mon-Fri, 9 AM - 6 PM IST",
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Send us an email and we'll respond within 24 hours.",
    available: "24/7",
  },
  {
    icon: HelpCircle,
    title: "FAQ & Resources",
    description: "Browse our comprehensive FAQ section and technical resources.",
    available: "24/7",
  },
]

const commonQuestions = [
  {
    question: "How do I track my order?",
    answer: "Once your order is shipped, you'll receive a tracking number via email. You can use this number to track your shipment on our website or the carrier's website.",
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy for unused products in original packaging. Please visit our Returns page for detailed information.",
  },
  {
    question: "Do you offer technical support?",
    answer: "Yes, we provide comprehensive technical support for all our products. Visit our Technical Support page or contact our support team.",
  },
  {
    question: "What are your shipping options?",
    answer: "We offer various shipping options including standard, express, and international shipping. Visit our Shipping Info page for details.",
  },
]

export default function CustomerServicePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Customer Service
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                We're here to help you with any questions or concerns
              </p>
            </div>
          </div>
        </section>

        {/* Support Options */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How Can We Help?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Choose the support option that works best for you
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service, index) => {
                const Icon = service.icon
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{service.available}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Common Questions */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {commonQuestions.map((item, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{item.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{item.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
                Quick Links
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild variant="outline" className="h-auto py-6 justify-start">
                  <Link href="/returns">
                    <div className="text-left">
                      <div className="font-semibold">Returns & Refunds</div>
                      <div className="text-sm text-gray-500">Learn about our return policy</div>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-6 justify-start">
                  <Link href="/shipping">
                    <div className="text-left">
                      <div className="font-semibold">Shipping Information</div>
                      <div className="text-sm text-gray-500">Shipping options and delivery times</div>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-6 justify-start">
                  <Link href="/support">
                    <div className="text-left">
                      <div className="font-semibold">Technical Support</div>
                      <div className="text-sm text-gray-500">Get technical assistance</div>
                    </div>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-6 justify-start">
                  <Link href="/contact">
                    <div className="text-left">
                      <div className="font-semibold">Contact Us</div>
                      <div className="text-sm text-gray-500">Send us a message</div>
                    </div>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Still Need Help?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Our customer service team is ready to assist you
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
