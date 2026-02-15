import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface BlogPageProps {
  params: { id: string }
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content?: string
  image?: string
  published: boolean
  createdAt: string
  updatedAt: string
}

async function getBlog(id: string): Promise<BlogPost | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const url = new URL(`/api/blogs/${id}`, baseUrl)
  const response = await fetch(url.toString(), {
    cache: 'no-store', // Always fetch fresh data
  })
  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    // Let Next.js error boundary handle non-404 errors
    throw new Error('Failed to fetch blog')
  }
  return await response.json()
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const blog = await getBlog(params.id)
  
  if (!blog) {
    return {
      title: "Blog Not Found",
    }
  }

  return {
    title: blog.title,
    description: blog.excerpt || blog.title,
    openGraph: {
      title: blog.title,
      description: blog.excerpt || blog.title,
      images: blog.image ? [blog.image] : [],
    },
  }
}

export default async function BlogDetailPage({ params }: BlogPageProps) {
  const blog = await getBlog(params.id)

  if (!blog) {
    notFound()
  }

  return (
    <>
      <Header />
      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Button asChild variant="ghost" className="mb-6">
              <Link href="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Link>
            </Button>

            {/* Blog Header */}
            <article>
              <header className="mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  {blog.title}
                </h1>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(blog.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {blog.excerpt && (
                  <p className="text-xl text-gray-600 mb-6">{blog.excerpt}</p>
                )}
              </header>

              {/* Blog Image */}
              {blog.image && (
                <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
                  <Image
                    src={blog.image}
                    alt={blog.title}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              )}

              {/* Blog Content */}
              <div 
                className="prose prose-lg max-w-none mb-12"
                dangerouslySetInnerHTML={{ __html: blog.content || '' }}
              />

              {/* Back to Blog Button */}
              <div className="mt-12 pt-8 border-t">
                <Button asChild variant="outline">
                  <Link href="/blog">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to All Posts
                  </Link>
                </Button>
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
