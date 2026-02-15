/**
 * @deprecated This file contains hardcoded category data and is no longer used.
 * Categories are now managed dynamically through the admin panel and fetched from the database via API.
 * 
 * All components now fetch categories from /api/categories endpoint.
 * This file is kept for reference only and can be removed in the future.
 */

// Products are now stored in the database and fetched via API
// Categories are managed through admin panel and fetched dynamically

export const categories = [
  {
    id: 'm12-connectors',
    name: 'M12 Connectors',
    slug: 'm12-connectors',
    description: 'Professional M12 industrial connectors for sensors and actuators',
    image: '/images/categories/m12.jpg'
  },
  {
    id: 'm8-connectors',
    name: 'M8 Connectors',
    slug: 'm8-connectors',
    description: 'Compact M8 industrial connectors for space-constrained applications',
    image: '/images/categories/m8.jpg'
  },
  {
    id: 'rj45-patch-cords',
    name: 'RJ45 Patch Cords',
    slug: 'rj45-patch-cords',
    description: 'Industrial Ethernet patch cords with IP20 and IP67 ratings',
    image: '/images/categories/rj45.jpg'
  },
  {
    id: 'profinet-products',
    name: 'PROFINET Products',
    slug: 'profinet-products',
    description: 'PROFINET cordsets and cables for Industrial Ethernet',
    image: '/images/categories/profinet.jpg'
  }
]
