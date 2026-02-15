import type { Metadata } from "next"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { pgPool } from "@/lib/pg"

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about LEI Indias - a leading B2B supplier of industrial connectors, cables, and automation solutions with global reach.",
}

export const dynamic = 'force-dynamic'

async function getAboutUsContent() {
  try {
    const result = await pgPool.query(
      `
      SELECT id, section, title, content, "displayOrder", "createdAt", "updatedAt"
      FROM "AboutUsContent"
      ORDER BY "displayOrder" ASC, "createdAt" ASC
      `,
    )
    return result.rows
  } catch (error) {
    console.error('Failed to fetch about us content:', error)
    return []
  }
}

function hasContent(content: any): boolean {
  return content && 
         typeof content.content === 'string' && 
         content.content.trim().length > 0
}

function getSectionClassName(index: number, total: number): string {
  // Alternate background colors for visual separation
  if (index === 0) {
    return "bg-gradient-to-br from-primary/10 to-primary/5"
  }
  return index % 2 === 0 ? "bg-white" : "bg-gray-50"
}

export default async function AboutPage() {
  const contents = await getAboutUsContent()
  const validContents = contents.filter(hasContent)

  return (
    <>
      <Header />
      <main>
        {validContents.length === 0 ? (
          /* Empty State */
          <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  About Us
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Content coming soon. Please check back later.
                </p>
              </div>
            </div>
          </section>
        ) : (
          validContents.map((content, index) => {
            const sectionClass = getSectionClassName(index, validContents.length)
            const isFirstSection = index === 0

            return (
              <section key={content.id} className={`py-16 ${sectionClass}`}>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                  <div className={`max-w-4xl mx-auto ${isFirstSection ? 'text-center' : ''}`}>
                    {content.title && content.title.trim() && (
                      <h2 className={`${isFirstSection ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'} font-bold text-gray-900 mb-6`}>
                        {content.title}
                      </h2>
                    )}
                    <div 
                      className={`${isFirstSection ? 'text-xl text-gray-600 prose prose-lg' : 'prose prose-lg'} max-w-none`}
                      dangerouslySetInnerHTML={{ __html: content.content }}
                    />
                  </div>
                </div>
              </section>
            )
          })
        )}

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Work Together?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Let&apos;s discuss how we can help with your industrial connectivity needs
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
