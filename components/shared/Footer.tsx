'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin } from 'lucide-react'

interface ContactInfo {
  phone: string
  email: string
  address: string
  registeredAddress?: string
  factoryLocation2?: string
  regionalContacts?: {
    bangalore?: string
    kolkata?: string
    gurgaon?: string
  }
}

export function Footer() {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone: '+91-XXX-XXXX-XXXX',
    email: 'info@leiindias.com',
    address: 'Industrial Area, India',
    registeredAddress: '',
    factoryLocation2: '',
    regionalContacts: {},
  })

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await fetch('/api/contact-info')
        if (response.ok) {
          const data = await response.json()
          setContactInfo(data)
        }
      } catch (error) {
        console.error('Failed to fetch contact info:', error)
      }
    }

    fetchContactInfo()
  }, [])

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.3fr] gap-8 lg:gap-12 items-start">
          {/* Logo & Company Info */}
          <div className="lg:pl-4">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/images/logo.png"
                alt="LEI Indias Logo"
                width={150}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm text-gray-400 max-w-xs">
              Leading provider of industrial automation solutions and quality products across India.
            </p>
          </div>

          {/* Information */}
          <div className="lg:pl-2">
            <h3 className="text-white font-semibold mb-4">Information</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white transition-colors">
                  Technical Support
                </Link>
              </li>
            </ul>
          </div>

          {/* My Account & Contact */}
          <div className="lg:ml-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <h3 className="text-white font-semibold mb-4">My Account</h3>
                <ul className="space-y-2 sm:space-y-1">
                  <li>
                    <Link href="/login" className="hover:text-white transition-colors">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="hover:text-white transition-colors">
                      Register
                    </Link>
                  </li>
                  <li>
                    <Link href="/rfq" className="hover:text-white transition-colors">
                      My RFQ
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/company-policies"
                      className="hover:text-white transition-colors"
                    >
                      Company Policies
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Contact</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{contactInfo.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{contactInfo.email}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <div>
                      {contactInfo.registeredAddress ? (
                        <span className="whitespace-pre-line">{contactInfo.registeredAddress}</span>
                      ) : (
                        <span>{contactInfo.address}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p>&copy; {new Date().getFullYear()} LEI Indias. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
