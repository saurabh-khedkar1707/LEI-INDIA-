'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  Mail,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { useAdminAuth } from '@/store/admin-auth-store'

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalInquiries: number
  pendingOrders: number
  pendingInquiries: number
  recentOrders: any[]
  recentInquiries: any[]
}

export default function AdminDashboard() {
  const { isAuthenticated } = useAdminAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
        const [productsRes, ordersRes, inquiriesRes] = await Promise.all([
          fetch(`${baseUrl}/api/products?limit=10000`),
          fetch(`${baseUrl}/api/orders`),
          fetch(`${baseUrl}/api/inquiries`),
        ])

        if (!productsRes.ok) {
          const errorData = await productsRes.json().catch(() => ({ error: 'Failed to fetch products' }))
          throw new Error(errorData.error || 'Failed to fetch products')
        }
        if (!ordersRes.ok) {
          const errorData = await ordersRes.json().catch(() => ({ error: 'Failed to fetch orders' }))
          throw new Error(errorData.error || 'Failed to fetch orders')
        }
        if (!inquiriesRes.ok) {
          const errorData = await inquiriesRes.json().catch(() => ({ error: 'Failed to fetch inquiries' }))
          throw new Error(errorData.error || 'Failed to fetch inquiries')
        }

        const productsData = await productsRes.json()
        const orders = await ordersRes.json()
        const inquiries = await inquiriesRes.json()

        // Handle paginated response for products
        const products = Array.isArray(productsData) ? productsData : (productsData.products || [])

        const pendingOrders = Array.isArray(orders) ? orders.filter((o: any) => o.status === 'pending').length : 0
        const pendingInquiries = Array.isArray(inquiries) ? inquiries.filter((i: any) => !i.read || !i.responded).length : 0

        const ordersArray = Array.isArray(orders) ? orders : []
        const inquiriesArray = Array.isArray(inquiries) ? inquiries : []

        const recentOrders = ordersArray
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)

        const recentInquiries = inquiriesArray
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)

        setStats({
          totalProducts: products.length,
          totalOrders: ordersArray.length,
          totalInquiries: inquiriesArray.length,
          pendingOrders,
          pendingInquiries,
          recentOrders,
          recentInquiries,
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data. Please refresh the page or try again later.'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchStats()
    }
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="text-center py-8">
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md max-w-md mx-auto">
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center py-8">Loading dashboard data...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingOrders} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInquiries}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingInquiries} unread
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pendingOrders + stats.pendingInquiries}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/products">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Manage Products
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="h-4 w-4 mr-2" />
                View Orders
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Link href="/admin/inquiries">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                View Inquiries
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest 5 orders</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{order.companyName || 'N/A'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {order.status === 'pending' ? (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      ) : order.status === 'approved' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-xs capitalize">{order.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/admin/orders">
              <Button variant="ghost" className="w-full mt-4" size="sm">
                View All Orders
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Inquiries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Inquiries</CardTitle>
            <CardDescription>Latest 5 inquiries</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentInquiries.length === 0 ? (
              <p className="text-sm text-gray-500">No inquiries yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentInquiries.map((inquiry: any) => (
                  <div
                    key={inquiry.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{inquiry.name || inquiry.email}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {inquiry.message?.substring(0, 30) || 'No message'}...
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!inquiry.read && (
                        <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/admin/inquiries">
              <Button variant="ghost" className="w-full mt-4" size="sm">
                View All Inquiries
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
