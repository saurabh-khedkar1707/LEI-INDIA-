'use client'

import { useEffect, useState } from 'react'

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

export function ContactInfoCard() {
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
    <>
      <p className="text-gray-600 mb-4">
        If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
      </p>
      <div className="text-gray-600 space-y-2">
        <p><strong>Email:</strong> {contactInfo.email}</p>
        <p><strong>Telephone:</strong> {contactInfo.phone}</p>
        {contactInfo.registeredAddress ? (
          <div>
            <p><strong>Registered Address & Factory Location I:</strong></p>
            <p className="whitespace-pre-line pl-4">{contactInfo.registeredAddress}</p>
          </div>
        ) : (
          <p><strong>Address:</strong> {contactInfo.address}</p>
        )}
        {contactInfo.factoryLocation2 && (
          <div>
            <p><strong>Factory Location II:</strong></p>
            <p className="whitespace-pre-line pl-4">{contactInfo.factoryLocation2}</p>
          </div>
        )}
      </div>
    </>
  )
}
