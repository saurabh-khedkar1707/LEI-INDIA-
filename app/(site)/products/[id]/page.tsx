import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Product } from "@/types"
import { AddToRFQButton } from "@/components/features/AddToRFQButton"
import { Download, CheckCircle2 } from "lucide-react"
import { pgPool } from "@/lib/pg"

interface ProductPageProps {
  params: { id: string }
}

async function getProduct(id: string): Promise<Product | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const url = new URL(`/api/products/${id}`, baseUrl)
  const response = await fetch(url.toString(), {
    cache: 'no-store', // Always fetch fresh data
  })
  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    // Let Next.js error boundary handle non-404 errors
    throw new Error('Failed to fetch product')
  }
  return await response.json()
}

async function getTechnicalDetails(productId: string) {
  try {
    const result = await pgPool.query(
      `
      SELECT id, "productId", tab, title, content, "displayOrder", "createdAt", "updatedAt"
      FROM "TechnicalDetails"
      WHERE ("productId" = $1 OR "productId" IS NULL)
      ORDER BY "displayOrder" ASC, "createdAt" ASC
      `,
      [productId],
    )
    return result.rows
  } catch (error) {
    console.error('Failed to fetch technical details:', error)
    return []
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.id)
  
  if (!product) {
    return {
      title: "Product Not Found",
    }
  }

  return {
    title: product.mpn || product.description.substring(0, 50) || 'Product',
    description: product.description,
    openGraph: {
      title: product.mpn || product.description.substring(0, 50) || 'Product',
      description: product.description,
      images: product.images,
    },
  }
}

async function TechnicalDetailsTabs({ productId }: { productId: string }) {
  const details = await getTechnicalDetails(productId)
  const salesDetails = details.filter(d => d.tab === 'sales')
  const technicalDetails = details.filter(d => d.tab === 'technical')

  // Don't show section if no details exist
  if (salesDetails.length === 0 && technicalDetails.length === 0) {
    return null
  }

  return (
    <Card className="mb-12">
      <CardHeader>
        <CardTitle>Technical Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sales" className="w-full">
          <TabsList>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
          </TabsList>
          <TabsContent value="sales" className="mt-4">
            {salesDetails.length > 0 ? (
              <div className="space-y-4">
                {salesDetails.map((detail) => (
                  <div key={detail.id}>
                    {detail.title && (
                      <h3 className="text-lg font-semibold mb-2">{detail.title}</h3>
                    )}
                    {detail.content && (
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: detail.content }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No sales information available.</p>
            )}
          </TabsContent>
          <TabsContent value="technical" className="mt-4">
            {technicalDetails.length > 0 ? (
              <div className="space-y-4">
                {technicalDetails.map((detail) => (
                  <div key={detail.id}>
                    {detail.title && (
                      <h3 className="text-lg font-semibold mb-2">{detail.title}</h3>
                    )}
                    {detail.content && (
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: detail.content }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No technical information available.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.id)

  if (!product) {
    notFound()
  }

  return (
    <>
      <Header />
      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Product Images */}
            <div>
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                <Image
                  src={product.images[0] || '/images/placeholder.jpg'}
                  alt={product.mpn || product.description.substring(0, 50) || 'Product'}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1).map((image, index) => (
                    <div key={index} className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                      <Image
                        src={image}
                        alt={`${product.mpn || 'Product'} ${index + 2}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {product.mpn || product.description.substring(0, 50)}
                </h1>
                {product.mpn && (
                  <p className="text-lg text-gray-600 mb-4">MPN: {product.mpn}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {product.connectorType && <Badge>{product.connectorType}</Badge>}
                {product.code && <Badge>{product.code}-Code</Badge>}
                {product.degreeOfProtection && <Badge>{product.degreeOfProtection}</Badge>}
              </div>

              <p className="text-gray-700 mb-6">{product.description}</p>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <AddToRFQButton product={product} />
              </div>

              {/* Download Options */}
              {(product.datasheetUrl || product.drawingUrl) && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Downloads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {product.datasheetUrl && (
                        <Button
                          asChild
                          variant="outline"
                          className="flex-1"
                          size="sm"
                        >
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL || ''}${product.datasheetUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                            Download Datasheet
                          </a>
                        </Button>
                      )}
                      {product.drawingUrl && (
                        <Button
                          asChild
                          variant="outline"
                          className="flex-1"
                          size="sm"
                        >
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL || ''}${product.drawingUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                            Download Drawing
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Quick Specs</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4">
                    {product.operatingVoltage && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Operating Voltage</dt>
                        <dd className="text-sm font-semibold">{product.operatingVoltage}</dd>
                      </div>
                    )}
                    {product.ratedCurrent && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Rated Current</dt>
                        <dd className="text-sm font-semibold">{product.ratedCurrent}</dd>
                      </div>
                    )}
                    {product.temperatureRange && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Temperature Range</dt>
                        <dd className="text-sm font-semibold">{product.temperatureRange}</dd>
                      </div>
                    )}
                    {product.degreeOfProtection && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Degree of Protection</dt>
                        <dd className="text-sm font-semibold">{product.degreeOfProtection}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Technical Details - Sales and Technical Tabs */}
          <TechnicalDetailsTabs productId={product.id} />

          {/* Technical Specifications */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Specification</th>
                      <th className="text-left p-3 font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.mpn && (
                      <tr className="border-b">
                        <td className="p-3">MPN</td>
                        <td className="p-3 font-medium">{product.mpn}</td>
                      </tr>
                    )}
                    {product.productType && (
                      <tr className="border-b">
                        <td className="p-3">Product Type</td>
                        <td className="p-3 font-medium">{product.productType}</td>
                      </tr>
                    )}
                    {product.coupling && (
                      <tr className="border-b">
                        <td className="p-3">Coupling</td>
                        <td className="p-3 font-medium">{product.coupling}</td>
                      </tr>
                    )}
                    {product.degreeOfProtection && (
                      <tr className="border-b">
                        <td className="p-3">Degree of Protection</td>
                        <td className="p-3 font-medium">{product.degreeOfProtection}</td>
                      </tr>
                    )}
                    {product.wireCrossSection && (
                      <tr className="border-b">
                        <td className="p-3">Wire Cross Section</td>
                        <td className="p-3 font-medium">{product.wireCrossSection}</td>
                      </tr>
                    )}
                    {product.temperatureRange && (
                      <tr className="border-b">
                        <td className="p-3">Temperature Range</td>
                        <td className="p-3 font-medium">{product.temperatureRange}</td>
                      </tr>
                    )}
                    {product.cableDiameter && (
                      <tr className="border-b">
                        <td className="p-3">Cable Diameter</td>
                        <td className="p-3 font-medium">{product.cableDiameter}</td>
                      </tr>
                    )}
                    {product.cableMantleColor && (
                      <tr className="border-b">
                        <td className="p-3">Color of Cable Mantle</td>
                        <td className="p-3 font-medium">{product.cableMantleColor}</td>
                      </tr>
                    )}
                    {product.cableMantleMaterial && (
                      <tr className="border-b">
                        <td className="p-3">Material of Cable Mantle</td>
                        <td className="p-3 font-medium">{product.cableMantleMaterial}</td>
                      </tr>
                    )}
                    {product.cableLength && (
                      <tr className="border-b">
                        <td className="p-3">Cable Length</td>
                        <td className="p-3 font-medium">{product.cableLength}</td>
                      </tr>
                    )}
                    {product.glandMaterial && (
                      <tr className="border-b">
                        <td className="p-3">Material of Gland</td>
                        <td className="p-3 font-medium">{product.glandMaterial}</td>
                      </tr>
                    )}
                    {product.housingMaterial && (
                      <tr className="border-b">
                        <td className="p-3">Housing Material</td>
                        <td className="p-3 font-medium">{product.housingMaterial}</td>
                      </tr>
                    )}
                    {product.pinContact && (
                      <tr className="border-b">
                        <td className="p-3">Pin Contact</td>
                        <td className="p-3 font-medium">{product.pinContact}</td>
                      </tr>
                    )}
                    {product.socketContact && (
                      <tr className="border-b">
                        <td className="p-3">Socket Contact</td>
                        <td className="p-3 font-medium">{product.socketContact}</td>
                      </tr>
                    )}
                    <tr className="border-b">
                      <td className="p-3">Cable Drag Chain Suitable</td>
                      <td className="p-3 font-medium">{product.cableDragChainSuitable ? 'Yes' : 'No'}</td>
                    </tr>
                    {product.tighteningTorqueMax && (
                      <tr className="border-b">
                        <td className="p-3">Tightening Torque Maximum</td>
                        <td className="p-3 font-medium">{product.tighteningTorqueMax}</td>
                      </tr>
                    )}
                    {product.bendingRadiusFixed && (
                      <tr className="border-b">
                        <td className="p-3">Bending Radius (Fixed)</td>
                        <td className="p-3 font-medium">{product.bendingRadiusFixed}</td>
                      </tr>
                    )}
                    {product.bendingRadiusRepeated && (
                      <tr className="border-b">
                        <td className="p-3">Bending Radius (Repeated)</td>
                        <td className="p-3 font-medium">{product.bendingRadiusRepeated}</td>
                      </tr>
                    )}
                    {product.contactPlating && (
                      <tr className="border-b">
                        <td className="p-3">Contact Plating</td>
                        <td className="p-3 font-medium">{product.contactPlating}</td>
                      </tr>
                    )}
                    {product.operatingVoltage && (
                      <tr className="border-b">
                        <td className="p-3">Operating Voltage</td>
                        <td className="p-3 font-medium">{product.operatingVoltage}</td>
                      </tr>
                    )}
                    {product.ratedCurrent && (
                      <tr className="border-b">
                        <td className="p-3">Rated Current</td>
                        <td className="p-3 font-medium">{product.ratedCurrent}</td>
                      </tr>
                    )}
                    <tr className="border-b">
                      <td className="p-3">Halogen Free</td>
                      <td className="p-3 font-medium">{product.halogenFree ? 'Yes' : 'No'}</td>
                    </tr>
                    {product.connectorType && (
                      <tr className="border-b">
                        <td className="p-3">Connector Type</td>
                        <td className="p-3 font-medium">{product.connectorType}</td>
                      </tr>
                    )}
                    {product.code && (
                      <tr className="border-b">
                        <td className="p-3">Code</td>
                        <td className="p-3 font-medium">{product.code}</td>
                      </tr>
                    )}
                    {product.strippingForce && (
                      <tr>
                        <td className="p-3">Stripping Force</td>
                        <td className="p-3 font-medium">{product.strippingForce}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  )
}
