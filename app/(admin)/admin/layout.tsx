'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAdminAuth } from '@/store/admin-auth-store'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Mail,
  LogOut,
  Menu,
  X,
  FileText,
  Briefcase,
  Phone,
  Image as ImageIcon,
  FolderTree,
  Building2,
  Users,
  Settings,
  FileCheck,
  ArrowLeftRight,
  Wrench,
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, verifyToken, logout } = useAdminAuth()
  const [isVerifying, setIsVerifying] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      if (pathname === '/admin/login') {
        setIsVerifying(false)
        return
      }

      if (!isAuthenticated) {
        router.push('/admin/login')
        return
      }

      const isValid = await verifyToken()
      if (!isValid) {
        router.push('/admin/login')
      }
      setIsVerifying(false)
    }

    checkAuth()
  }, [isAuthenticated, pathname, router, verifyToken])

  const handleLogout = async () => {
    await logout()
    router.push('/admin/login')
  }

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/categories', label: 'Categories', icon: FolderTree },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/inquiries', label: 'Inquiries', icon: Mail },
    { href: '/admin/hero-slides', label: 'Hero Slider', icon: ImageIcon },
    { href: '/admin/blogs', label: 'Blogs', icon: FileText },
    { href: '/admin/careers', label: 'Careers', icon: Briefcase },
    { href: '/admin/contact-info', label: 'Contact Info', icon: Phone },
    { href: '/admin/authorised-distributors', label: 'Authorised Distributors', icon: Building2 },
    { href: '/admin/principal-partners', label: 'Principal Partners', icon: Users },
    { href: '/admin/about-us', label: 'About Us', icon: FileText },
    { href: '/admin/technical-support', label: 'Technical Support', icon: Settings },
    { href: '/admin/company-policies', label: 'Company Policies', icon: FileCheck },
    { href: '/admin/returns', label: 'Returns', icon: ArrowLeftRight },
    { href: '/admin/technical-details', label: 'Technical Details', icon: Wrench },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="LEI Indias Logo"
              width={120}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r z-40
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="p-6 border-b">
            <Link href="/">
              <Image
                src="/images/logo.png"
                alt="LEI Indias Logo"
                width={140}
                height={36}
                className="h-9 w-auto"
              />
            </Link>
          </div>

          <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 min-h-screen">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
