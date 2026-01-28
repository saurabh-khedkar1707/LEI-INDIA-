import type { Metadata } from "next"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Globe, Users, Award, Target, Zap } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about LEI Indias - a leading B2B supplier of industrial connectors, cables, and automation solutions with global reach.",
}

const values = [
  {
    icon: Target,
    title: "Quality First",
    description: "We maintain the highest standards in all our products and services, ensuring reliability and performance.",
  },
  {
    icon: Users,
    title: "Customer Focus",
    description: "Our customers are at the heart of everything we do. We build lasting relationships through exceptional service.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "We continuously innovate to bring cutting-edge solutions that meet evolving industrial needs.",
  },
  {
    icon: Award,
    title: "Excellence",
    description: "We strive for excellence in every aspect of our business, from product quality to customer support.",
  },
]

const stats = [
  { label: "Years of Experience", value: "15+" },
  { label: "Global Partners", value: "50+" },
  { label: "Products", value: "500+" },
  { label: "Happy Customers", value: "1000+" },
]

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                About LEI Indias
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Leading the way in industrial connectivity solutions
              </p>
            </div>
          </div>
        </section>

        {/* Company Story */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-600 mb-4">
                  LEI Indias was founded with a vision to provide high-quality industrial connectivity solutions to businesses worldwide. Over the years, we have established ourselves as a trusted partner in the industrial automation and connectivity space.
                </p>
                <p className="text-gray-600 mb-4">
                  We specialize in M12, M8, and RJ45 industrial connectors, PROFINET products, and custom cable solutions. Our commitment to quality, technical excellence, and customer service has made us a preferred supplier for leading industrial automation companies.
                </p>
                <p className="text-gray-600">
                  Today, we serve customers across multiple industries, from manufacturing and automation to telecommunications and energy. Our global network of partners ensures that we can deliver solutions wherever they're needed, with no minimum order quantities and comprehensive technical support.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Our Values
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle>{value.title}</CardTitle>
                      <CardDescription>{value.description}</CardDescription>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-6 w-6 text-primary" />
                    Our Mission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    To provide world-class industrial connectivity solutions that enable our customers to achieve their automation goals. We are committed to quality, innovation, and exceptional customer service in everything we do.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-6 w-6 text-primary" />
                    Our Vision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    To become the global leader in industrial connectivity solutions, recognized for our technical expertise, product quality, and commitment to customer success. We envision a future where seamless connectivity drives industrial innovation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Work Together?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Let's discuss how we can help with your industrial connectivity needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="secondary" size="lg">
                <Link href="/contact">Contact Us</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white/10">
                <Link href="/products">View Products</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
