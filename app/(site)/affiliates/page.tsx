import type { Metadata } from "next"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, DollarSign, TrendingUp, CheckCircle2, Gift } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Affiliate Program",
  description: "Join our affiliate program and earn commissions by promoting our industrial connectivity products.",
}

const benefits = [
  {
    icon: DollarSign,
    title: "Competitive Commissions",
    description: "Earn attractive commissions on every sale you refer. Higher tiers available for top performers.",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Tracking",
    description: "Monitor your performance with our comprehensive affiliate dashboard and analytics.",
  },
  {
    icon: Gift,
    title: "Marketing Materials",
    description: "Access banners, product images, and promotional content to help you promote effectively.",
  },
  {
    icon: CheckCircle2,
    title: "Easy Integration",
    description: "Simple tracking links and API access for seamless integration with your website or platform.",
  },
]

const programDetails = [
  {
    title: "Commission Structure",
    details: [
      "5% commission on all referred sales",
      "10% commission for sales over ₹50,000",
      "15% commission for sales over ₹1,00,000",
      "Monthly bonus for top performers",
    ],
  },
  {
    title: "Payment Terms",
    details: [
      "Monthly payments via bank transfer or PayPal",
      "Minimum payout threshold: ₹5,000",
      "30-day cookie duration for tracking",
      "Transparent reporting and analytics",
    ],
  },
  {
    title: "Support & Resources",
    details: [
      "Dedicated affiliate manager",
      "Marketing materials and banners",
      "Product training and resources",
      "Regular performance reviews",
    ],
  },
]

export default function AffiliatesPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Affiliate Program
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Earn commissions by promoting our industrial connectivity products
              </p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Join Our Affiliate Program?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Partner with us and start earning today
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => {
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

        {/* Program Details */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
                Program Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {programDetails.map((section, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {section.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="text-sm text-gray-600 flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{detail}</span>
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

        {/* How It Works */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
                How It Works
              </h2>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        1
                      </div>
                      <CardTitle className="text-xl">Sign Up</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Complete our simple affiliate application form. We review applications within 2-3 business days and notify you of approval.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        2
                      </div>
                      <CardTitle className="text-xl">Get Your Links</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Once approved, access your unique affiliate links and marketing materials through our affiliate dashboard.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        3
                      </div>
                      <CardTitle className="text-xl">Promote & Earn</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Share your links with your audience. When someone makes a purchase through your link, you earn a commission!
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join our affiliate program and start earning commissions today
            </p>
            <Button asChild variant="secondary" size="lg">
              <Link href="/contact">Apply Now</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
