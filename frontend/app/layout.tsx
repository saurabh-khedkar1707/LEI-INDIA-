import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "LEI Indias - Industrial Connectors & Cables",
    template: "%s | LEI Indias"
  },
  description: "Professional B2B supplier of M12, M8, and RJ45 industrial connectors, cables, and PROFINET products. No MOQ, technical support, and global partnerships.",
  keywords: ["industrial connectors", "M12 connectors", "M8 connectors", "RJ45 patch cords", "PROFINET", "industrial cables", "B2B electronics"],
  authors: [{ name: "LEI Indias" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://leiindias.com",
    siteName: "LEI Indias",
    title: "LEI Indias - Industrial Connectors & Cables",
    description: "Professional B2B supplier of industrial connectors and cables",
  },
  twitter: {
    card: "summary_large_image",
    title: "LEI Indias - Industrial Connectors & Cables",
    description: "Professional B2B supplier of industrial connectors and cables",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
