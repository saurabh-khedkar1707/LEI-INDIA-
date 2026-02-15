import type { Metadata } from "next"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Globe, Handshake, MapPin, CheckCircle2, Building2, Mail, Phone, ExternalLink } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { pgPool } from "@/lib/pg"

export const metadata: Metadata = {
  title: "Authorised Distributors",
  description: "Our network of authorised distributors ensures reliable supply and support worldwide.",
}

export const dynamic = 'force-dynamic'

const distributorBenefits = [
  {
    title: "Authorised & Certified",
    description: "All our distributors are officially authorised and certified to maintain our high standards of quality and service.",
    icon: CheckCircle2,
  },
  {
    title: "Local Presence",
    description: "Our distributors provide local market knowledge, language support, and regional compliance expertise.",
    icon: MapPin,
  },
  {
    title: "Quality Assurance",
    description: "All distributors are vetted and certified to maintain our high standards of quality and service.",
    icon: Building2,
  },
  {
    title: "Global Network",
    description: "Access to our extensive network of authorised distributors across multiple regions ensures reliable supply.",
    icon: Globe,
  },
]

async function getAuthorisedDistributors() {
  try {
    const result = await pgPool.query(
      `
      SELECT id, "companyName", logo, email, phone, address, website,
             "displayOrder", active, "createdAt", "updatedAt"
      FROM "AuthorisedDistributor"
      WHERE active = true
      ORDER BY "displayOrder" ASC, "createdAt" DESC
      `,
    )
    return result.rows
  } catch (error) {
    console.error('Failed to fetch authorised distributors:', error)
    return []
  }
}

export default async function AuthorisedDistributorsPage() {
  const distributors = await getAuthorisedDistributors()

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Authorised Distributors
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                A trusted network of authorised distributors delivering excellence
              </p>
            </div>
          </div>
        </section>

        {/* Distributor Benefits */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose Our Authorised Distributors
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our authorised distributors enable us to serve customers worldwide with local expertise
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {distributorBenefits.map((benefit, index) => {
                const Icon = benefit.icon
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{benefit.title}</CardTitle>
                      <CardDescription>{benefit.description}</CardDescription>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Authorised Distributors List */}
        {distributors.length > 0 && (
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Our Authorised Distributors
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Trusted distributors delivering excellence worldwide
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {distributors.map((distributor) => (
                  <Card key={distributor.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      {distributor.logo && (
                        <div className="mb-4 flex justify-center">
                          <Image
                            src={distributor.logo}
                            alt={distributor.companyName}
                            width={120}
                            height={60}
                            className="object-contain"
                          />
                        </div>
                      )}
                      <CardTitle className="text-xl">{distributor.companyName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {distributor.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${distributor.email}`} className="hover:text-primary">
                            {distributor.email}
                          </a>
                        </div>
                      )}
                      {distributor.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${distributor.phone}`} className="hover:text-primary">
                            {distributor.phone}
                          </a>
                        </div>
                      )}
                      {distributor.address && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mt-0.5" />
                          <span>{distributor.address}</span>
                        </div>
                      )}
                      {distributor.website && (
                        <div className="pt-2">
                          <Button asChild variant="outline" size="sm" className="w-full">
                            <a href={distributor.website} target="_blank" rel="noopener noreferrer">
                              Visit Website
                              <ExternalLink className="h-4 w-4 ml-2" />
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Become a Distributor */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Handshake className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl">Become an Authorised Distributor</CardTitle>
                  </div>
                  <CardDescription>
                    Join our network of trusted authorised distributors and help us serve customers worldwide
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    We&apos;re continuously expanding our global distributor network. If you&apos;re a distributor, reseller, or service provider in the industrial connectivity space, we&apos;d love to explore a partnership.
                  </p>
                  <div>
                    <p className="font-semibold mb-2">What we look for in distributors:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      <li>Established presence in your local market</li>
                      <li>Experience with industrial connectivity products</li>
                      <li>Strong customer service capabilities</li>
                      <li>Technical support and engineering resources</li>
                      <li>Commitment to quality and customer satisfaction</li>
                      <li>Alignment with our values and business practices</li>
                    </ul>
                  </div>
                  <div className="pt-4">
                    <Button asChild size="lg">
                      <Link href="/contact">Contact Us About Distribution</Link>
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
              Find a Distributor Near You
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Contact us to connect with an authorised distributor in your region
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
