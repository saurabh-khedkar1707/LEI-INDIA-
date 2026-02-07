import type { Metadata } from "next"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Package, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { pgPool } from "@/lib/pg"

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description: "Learn about our return policy, refund process, and how to return products.",
}

export const dynamic = 'force-dynamic'

const returnSteps = [
  {
    step: 1,
    title: "Contact Us",
    description: "Reach out to our customer service team within 30 days of delivery to initiate a return.",
    icon: CheckCircle2,
  },
  {
    step: 2,
    title: "Get Authorization",
    description: "We'll provide you with a Return Authorization (RA) number and return instructions.",
    icon: CheckCircle2,
  },
  {
    step: 3,
    title: "Package & Ship",
    description: "Package the item securely in its original packaging and ship it back using the provided label.",
    icon: Package,
  },
  {
    step: 4,
    title: "Receive Refund",
    description: "Once we receive and inspect the item, we'll process your refund within 5-7 business days.",
    icon: CheckCircle2,
  },
]

const returnPolicy = [
  {
    title: "30-Day Return Window",
    description: "Items must be returned within 30 days of delivery date.",
    icon: Clock,
  },
  {
    title: "Original Condition",
    description: "Items must be unused, unopened, and in original packaging with all tags and labels attached.",
    icon: Package,
  },
  {
    title: "Proof of Purchase",
    description: "Original invoice or order confirmation is required for all returns.",
    icon: CheckCircle2,
  },
  {
    title: "Non-Returnable Items",
    description: "Custom orders, personalized items, and software licenses are not eligible for return.",
    icon: XCircle,
  },
]

async function getReturnsContent() {
  try {
    const result = await pgPool.query(
      `
      SELECT id, section, title, content, "displayOrder", "createdAt", "updatedAt"
      FROM "ReturnsContent"
      ORDER BY "displayOrder" ASC, "createdAt" ASC
      `,
    )
    return result.rows
  } catch (error) {
    console.error('Failed to fetch returns content:', error)
    return []
  }
}

function getContentBySection(contents: Array<{ section: string; title?: string; content: string }>, section: string) {
  return contents.find(c => c.section === section)
}

export default async function ReturnsPage() {
  const contents = await getReturnsContent()
  const heroContent = getContentBySection(contents, 'hero')
  const returnProcessContent = getContentBySection(contents, 'return-process')
  const returnPolicyContent = getContentBySection(contents, 'return-policy')
  const importantInfoContent = getContentBySection(contents, 'important-info')

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              {heroContent ? (
                <>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    {heroContent.title || 'Returns & Refunds'}
                  </h1>
                  <div 
                    className="text-xl text-gray-600 mb-8 prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: heroContent.content }}
                  />
                </>
              ) : (
                <>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    Returns & Refunds
                  </h1>
                  <p className="text-xl text-gray-600 mb-8">
                    We want you to be completely satisfied with your purchase
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Return Process */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {returnProcessContent ? (
              <div className="max-w-4xl mx-auto">
                {returnProcessContent.title && (
                  <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                      {returnProcessContent.title}
                    </h2>
                  </div>
                )}
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: returnProcessContent.content }}
                />
              </div>
            ) : (
              <>
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    How to Return an Item
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Follow these simple steps to return your purchase
                  </p>
                </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {returnSteps.map((item, index) => {
                const Icon = item.icon
                return (
                  <Card key={index} className="relative">
                    <CardHeader>
                      <div className="absolute -top-4 left-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {item.step}
                      </div>
                      <div className="mt-4 mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
              </>
            )}
          </div>
        </section>

        {/* Return Policy */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {returnPolicyContent ? (
                <>
                  {returnPolicyContent.title && (
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
                      {returnPolicyContent.title}
                    </h2>
                  )}
                  <div 
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: returnPolicyContent.content }}
                  />
                </>
              ) : (
                <>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
                    Return Policy
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {returnPolicy.map((item, index) => {
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
                  </>
                )}
            </div>
          </div>
        </section>

        {/* Important Information */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 text-amber-600 mt-1" />
                    <div>
                      <CardTitle className="text-lg text-amber-900">
                        {importantInfoContent?.title || 'Important Information'}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-amber-800">
                  {importantInfoContent ? (
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: importantInfoContent.content }}
                    />
                  ) : (
                    <ul className="list-disc list-inside space-y-2">
                      <li>Return shipping costs are the responsibility of the customer unless the item is defective or incorrect.</li>
                      <li>Refunds will be issued to the original payment method used for the purchase.</li>
                      <li>Processing time for refunds is 5-7 business days after we receive the returned item.</li>
                      <li>For damaged or defective items, please contact us immediately for expedited processing.</li>
                      <li>International returns may be subject to customs fees and duties.</li>
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start a Return?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Contact our customer service team to begin the return process
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="secondary" size="lg">
                <Link href="/contact">Contact Customer Service</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white/10">
                <Link href="/customer-service">View Customer Service</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
