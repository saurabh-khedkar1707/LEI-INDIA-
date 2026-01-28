import type { Metadata } from "next"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { BentoResources } from "@/components/widgets/BentoResources"

export const metadata: Metadata = {
  title: "Resources",
  description: "Access technical documents, installation guides, and video tutorials for industrial connectors and cables.",
}

export default function ResourcesPage() {
  return (
    <>
      <Header />
      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Technical Knowledge Center
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Access technical documents, installation guides, datasheets, and video tutorials to help you with your industrial connector needs.
            </p>
          </div>
        </div>
        <BentoResources />
      </main>
      <Footer />
    </>
  )
}
