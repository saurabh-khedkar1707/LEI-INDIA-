export interface RFQItem {
  productId: string
  sku: string
  name: string
  quantity: number
  notes?: string
}

export interface RFQ {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string
  companyAddress?: string
  items: RFQItem[]
  notes?: string
  status: 'pending' | 'quoted' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}
