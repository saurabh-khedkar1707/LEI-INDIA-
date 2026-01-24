export type ConnectorCoding = 'A' | 'B' | 'D' | 'X'
export type PinCount = 3 | 4 | 5 | 8 | 12
export type IPRating = 'IP67' | 'IP68' | 'IP20'
export type ConnectorGender = 'Male' | 'Female'
export type ConnectorType = 'M12' | 'M8' | 'RJ45'

export interface Product {
  id: string
  sku: string
  name: string
  category: string
  description: string
  technicalDescription: string
  coding: ConnectorCoding
  pins: PinCount
  ipRating: IPRating
  gender: ConnectorGender
  connectorType: ConnectorType
  specifications: {
    material: string
    voltage: string
    current: string
    temperatureRange: string
    wireGauge?: string
    cableLength?: string
  }
  price?: number
  priceType: 'fixed' | 'quote'
  inStock: boolean
  stockQuantity?: number
  images: string[]
  datasheetUrl?: string
  relatedProducts?: string[]
  createdAt: string
  updatedAt: string
}
