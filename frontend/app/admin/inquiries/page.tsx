'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/store/admin-auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Eye,
  Loader2,
  Download,
  Mail,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

interface Inquiry {
  id: string
  name: string
  email: string
  phone: string
  company: string
  message: string
  meetingRequest?: boolean
  read: boolean
  responded: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminInquiriesPage() {
  const { token } = useAdminAuth()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'responded'>('all')

  useEffect(() => {
    if (token) {
      fetchInquiries()
    }
  }, [token])

  useEffect(() => {
    let filtered = inquiries

    switch (filter) {
      case 'unread':
        filtered = inquiries.filter((i) => !i.read)
        break
      case 'read':
        filtered = inquiries.filter((i) => i.read && !i.responded)
        break
      case 'responded':
        filtered = inquiries.filter((i) => i.responded)
        break
      default:
        filtered = inquiries
    }

    setFilteredInquiries(filtered)
  }, [filter, inquiries])

  const fetchInquiries = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/inquiries`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to fetch inquiries')

      const data = await response.json()
      setInquiries(data)
      setFilteredInquiries(data)
    } catch (error) {
      console.error('Failed to fetch inquiries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (inquiryId: string, read: boolean) => {
    if (!token) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/inquiries/${inquiryId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ read }),
        }
      )

      if (!response.ok) throw new Error('Failed to update inquiry')

      fetchInquiries()
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry({ ...selectedInquiry, read })
      }
    } catch (error) {
      console.error('Failed to update inquiry:', error)
      alert('Failed to update inquiry')
    }
  }

  const handleMarkAsResponded = async (inquiryId: string, responded: boolean) => {
    if (!token) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/inquiries/${inquiryId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ responded }),
        }
      )

      if (!response.ok) throw new Error('Failed to update inquiry')

      fetchInquiries()
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry({ ...selectedInquiry, responded })
      }
    } catch (error) {
      console.error('Failed to update inquiry:', error)
      alert('Failed to update inquiry')
    }
  }

  const handleDelete = async (inquiryId: string) => {
    if (!token || !confirm('Are you sure you want to delete this inquiry?')) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/inquiries/${inquiryId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to delete inquiry')

      fetchInquiries()
      if (selectedInquiry?.id === inquiryId) {
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error('Failed to delete inquiry:', error)
      alert('Failed to delete inquiry')
    }
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Message', 'Read', 'Responded', 'Created At']
    const rows = inquiries.map((inquiry) => [
      inquiry.id,
      inquiry.name,
      inquiry.email,
      inquiry.phone,
      inquiry.company,
      inquiry.message.replace(/,/g, ';'), // Replace commas to avoid CSV issues
      inquiry.read ? 'Yes' : 'No',
      inquiry.responded ? 'Yes' : 'No',
      new Date(inquiry.createdAt).toLocaleString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `inquiries-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const openInquiryDetails = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    setIsDialogOpen(true)
    if (!inquiry.read) {
      handleMarkAsRead(inquiry.id, true)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inquiries</h1>
          <p className="text-gray-600 mt-2">Manage customer inquiries</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <div className="flex space-x-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Unread
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('read')}
            >
              Read
            </Button>
            <Button
              variant={filter === 'responded' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('responded')}
            >
              Responded
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No inquiries found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        {!inquiry.read && (
                          <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                        )}
                        <span>{inquiry.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{inquiry.email}</TableCell>
                    <TableCell>{inquiry.company}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {inquiry.message.substring(0, 50)}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {inquiry.responded ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Responded
                          </Badge>
                        ) : inquiry.read ? (
                          <Badge variant="secondary">Read</Badge>
                        ) : (
                          <Badge variant="outline">Unread</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(inquiry.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openInquiryDetails(inquiry)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Inquiry Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription>View and manage inquiry information</DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-6">
              {/* Inquiry Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>{' '}
                      <span className="font-medium">{selectedInquiry.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>{' '}
                      <a
                        href={`mailto:${selectedInquiry.email}`}
                        className="text-primary hover:underline"
                      >
                        {selectedInquiry.email}
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>{' '}
                      <a
                        href={`tel:${selectedInquiry.phone}`}
                        className="text-primary hover:underline"
                      >
                        {selectedInquiry.phone}
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-500">Company:</span>{' '}
                      <span className="font-medium">{selectedInquiry.company}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Inquiry Information</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-500">Inquiry ID:</span>{' '}
                      <span className="font-medium">{selectedInquiry.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>{' '}
                      {new Date(selectedInquiry.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <span className="text-gray-500">Updated:</span>{' '}
                      {new Date(selectedInquiry.updatedAt).toLocaleString()}
                    </div>
                    {selectedInquiry.meetingRequest && (
                      <div>
                        <Badge variant="secondary">Meeting Requested</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <h3 className="font-semibold mb-2">Message</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded whitespace-pre-wrap">
                  {selectedInquiry.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="read"
                      checked={selectedInquiry.read}
                      onCheckedChange={(checked) =>
                        handleMarkAsRead(selectedInquiry.id, checked as boolean)
                      }
                    />
                    <Label htmlFor="read" className="cursor-pointer">
                      Mark as read
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="responded"
                      checked={selectedInquiry.responded}
                      onCheckedChange={(checked) =>
                        handleMarkAsResponded(selectedInquiry.id, checked as boolean)
                      }
                    />
                    <Label htmlFor="responded" className="cursor-pointer">
                      Mark as responded
                    </Label>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.location.href = `mailto:${selectedInquiry.email}?subject=Re: Your Inquiry`
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(selectedInquiry.id)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
