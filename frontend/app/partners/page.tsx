import type { Metadata } from "next"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Globe, Handshake, MapPin, CheckCircle2, Building2 } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Global Partners",
  description: "Our network of global partners ensures reliable supply and support worldwide.",
}

const regions = [
  {
    name: "Asia Pacific",
    countries: ["India", "China", "Singapore", "Japan", "South Korea", "Australia"],
    icon: Globe,
  },
  {
    name: "Europe",
    countries: ["Germany", "UK", "France", "Italy", "Netherlands", "Sweden"],
    icon: Globe,
  },
  {
    name: "Americas",
    countries: ["USA", "Canada", "Mexico", "Brazil", "Argentina"],
    icon: Globe,
  },
  {
    name: "Middle East & Africa",
    countries: ["UAE", "Saudi Arabia", "South Africa", "Egypt", "Kenya"],
    icon: Globe,
  },
]

const partnerBenefits = [
  {
    title: "Global Network",
    description: "Access to our extensive network of partners across 50+ countries ensures reliable supply and local support.",
    icon: Globe,
  },
  {
    title: "Local Expertise",
    description: "Our partners provide local market knowledge, language support, and regional compliance expertise.",
    icon: MapPin,
  },
  {
    title: "Quality Assurance",
    description: "All partners are vetted and certified to maintain our high standards of quality and service.",
    icon: CheckCircle2,
  },
  {
    title: "Technical Support",
    description: "Comprehensive technical support available through our global partner network.",
    icon: Building2,
  },
]

export default function GlobalPartnersPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Global Partners
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                A worldwide network of trusted partners delivering excellence
              </p>
            </div>
          </div>
        </section>

        {/* Partner Benefits */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Our Global Network Matters
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our partners enable us to serve customers worldwide with local expertise
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {partnerBenefits.map((benefit, index) => {
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

        {/* Regional Coverage */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
                Regional Coverage
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {regions.map((region, index) => {
                  const Icon = region.icon
                  return (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-4">
                          <Icon className="h-6 w-6 text-primary" />
                          <CardTitle className="text-lg">{region.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {region.countries.map((country, countryIndex) => (
                            <li key={countryIndex} className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                              <span>{country}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Become a Partner */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Handshake className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl">Become a Global Partner</CardTitle>
                  </div>
                  <CardDescription>
                    Join our network of trusted partners and help us serve customers worldwide
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    We're continuously expanding our global partner network. If you're a distributor, reseller, or service provider in the industrial connectivity space, we'd love to explore a partnership.
                  </p>
                  <div>
                    <p className="font-semibold mb-2">What we look for in partners:</p>
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
                      <Link href="/contact">Contact Us About Partnership</Link>
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
              Find a Partner Near You
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Contact us to connect with a partner in your region
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
