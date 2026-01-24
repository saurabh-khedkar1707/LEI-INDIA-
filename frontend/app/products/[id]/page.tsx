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

interface ProductPageProps {
  params: { id: string }
}

async function getProduct(id: string): Promise<Product | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  try {
    const response = await fetch(`${apiUrl}/api/products/${id}`, {
      cache: 'no-store', // Always fetch fresh data
    })
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch product')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
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
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images,
    },
  }
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
                  alt={product.name}
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
                        alt={`${product.name} ${index + 2}`}
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
                <Badge variant="outline" className="mb-2">{product.category}</Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                <p className="text-lg text-gray-600 mb-4">SKU: {product.sku}</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <Badge>{product.connectorType}</Badge>
                <Badge>{product.coding}-Code</Badge>
                <Badge>{product.pins} Pin</Badge>
                <Badge>{product.ipRating}</Badge>
                <Badge>{product.gender}</Badge>
                {product.inStock && (
                  <Badge className="bg-green-500">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    In Stock
                  </Badge>
                )}
              </div>

              <p className="text-gray-700 mb-6">{product.description}</p>

              <div className="mb-6">
                {product.priceType === 'quote' ? (
                  <p className="text-2xl font-bold text-gray-900 mb-2">Request Quote</p>
                ) : (
                  <p className="text-2xl font-bold text-primary mb-2">
                    ${product.price?.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <AddToRFQButton product={product} />
                {product.datasheetUrl && (
                  <Button variant="outline" asChild>
                    <a href={product.datasheetUrl} download>
                      <Download className="h-4 w-4 mr-2" />
                      Download Datasheet
                    </a>
                  </Button>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Specs</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Material</dt>
                      <dd className="text-sm font-semibold">{product.specifications.material}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Voltage</dt>
                      <dd className="text-sm font-semibold">{product.specifications.voltage}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Current</dt>
                      <dd className="text-sm font-semibold">{product.specifications.current}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Temperature</dt>
                      <dd className="text-sm font-semibold">{product.specifications.temperatureRange}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Technical Specifications */}
          <Tabs defaultValue="specs" className="mb-12">
            <TabsList>
              <TabsTrigger value="specs">Technical Specifications</TabsTrigger>
              <TabsTrigger value="description">Description</TabsTrigger>
            </TabsList>
            <TabsContent value="specs">
              <Card>
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
                        <tr className="border-b">
                          <td className="p-3">Material</td>
                          <td className="p-3 font-medium">{product.specifications.material}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Voltage</td>
                          <td className="p-3 font-medium">{product.specifications.voltage}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Current</td>
                          <td className="p-3 font-medium">{product.specifications.current}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-3">Temperature Range</td>
                          <td className="p-3 font-medium">{product.specifications.temperatureRange}</td>
                        </tr>
                        {product.specifications.wireGauge && (
                          <tr className="border-b">
                            <td className="p-3">Wire Gauge</td>
                            <td className="p-3 font-medium">{product.specifications.wireGauge}</td>
                          </tr>
                        )}
                        {product.specifications.cableLength && (
                          <tr className="border-b">
                            <td className="p-3">Cable Length</td>
                            <td className="p-3 font-medium">{product.specifications.cableLength}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="p-3">IP Rating</td>
                          <td className="p-3 font-medium">{product.ipRating}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="description">
              <Card>
                <CardHeader>
                  <CardTitle>Product Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">
                    {product.technicalDescription}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  )
}
