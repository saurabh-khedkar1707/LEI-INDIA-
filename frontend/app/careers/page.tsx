'use client'

import { useEffect, useState } from 'react'
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Briefcase, Clock, Mail } from "lucide-react"
import Link from "next/link"

interface JobOpening {
  _id: string
  title: string
  department: string
  location: string
  type: string
  description: string
  salary?: string
}

const benefits = [
  {
    title: "Competitive Salary",
    description: "We offer competitive compensation packages based on experience and skills.",
  },
  {
    title: "Health Insurance",
    description: "Comprehensive health insurance coverage for you and your family.",
  },
  {
    title: "Professional Development",
    description: "Continuous learning opportunities and training programs to advance your career.",
  },
  {
    title: "Flexible Work",
    description: "Work-life balance with flexible working hours and remote work options.",
  },
  {
    title: "Team Culture",
    description: "Collaborative and inclusive work environment with a focus on innovation.",
  },
  {
    title: "Growth Opportunities",
    description: "Clear career progression paths and opportunities to take on new challenges.",
  },
]

export default function CareersPage() {
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCareers()
  }, [])

  const fetchCareers = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/careers`
      )
      const data = await response.json()
      setJobOpenings(data)
    } catch (error) {
      console.error('Failed to fetch careers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Join Our Team
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                At LEI Indias, we're building the future of industrial connectivity. Join us in delivering innovative solutions to customers worldwide.
              </p>
              <Button asChild size="lg">
                <Link href="#openings">
                  View Open Positions
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Why Work With Us */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Work With Us
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We offer a supportive environment where you can grow your career and make an impact
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    <CardDescription>{benefit.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Job Openings */}
        <section id="openings" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Open Positions
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore current job opportunities and find your next career move
              </p>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : jobOpenings.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No job openings available at the moment.</p>
                <p className="text-gray-400 text-sm mt-2">Please check back later or send us your resume.</p>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {jobOpenings.map((job) => (
                  <Card key={job._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              <span>{job.department}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{job.type}</span>
                            </div>
                            {job.salary && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{job.salary}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button asChild>
                          <Link href={`/careers/${job._id}`}>
                            Apply Now
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{job.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Don't See a Role That Fits?</CardTitle>
                <CardDescription>
                  We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <Mail className="h-5 w-5" />
                  <span>careers@leiindias.com</span>
                </div>
                <Button asChild>
                  <Link href="/contact">
                    Get in Touch
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
