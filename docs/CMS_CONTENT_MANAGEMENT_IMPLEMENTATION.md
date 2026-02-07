# CMS Content Management Implementation Guide

## Overview

This document describes the Content Management System (CMS) implementation for managing various content types from the admin panel.

## Database Schema

All CMS tables have been created in the migration file: `prisma/migrate-add-cms-content.sql`

### Tables Created:
1. **AuthorisedDistributor** - Replaces "Kitting Facility"
2. **PrincipalPartner** - Replaces "Global Partner"
3. **TechnicalDetails** - Sales and Technical tabs for products
4. **AboutUsContent** - Editable About Us page sections
5. **TechnicalSupportContent** - Editable Technical Support page sections
6. **CompanyPolicy** - Add/modify/remove company policies
7. **ReturnsContent** - Editable Returns page sections

## API Routes

All API routes follow RESTful conventions:

### Authorised Distributors
- `GET /api/authorised-distributors` - List all (public: active only, admin: all)
- `POST /api/authorised-distributors` - Create (admin-only)
- `GET /api/authorised-distributors/:id` - Get one
- `PUT /api/authorised-distributors/:id` - Update (admin-only)
- `DELETE /api/authorised-distributors/:id` - Delete (admin-only)

### Principal Partners
- `GET /api/principal-partners` - List all (public: active only, admin: all)
- `POST /api/principal-partners` - Create (admin-only)
- `GET /api/principal-partners/:id` - Get one
- `PUT /api/principal-partners/:id` - Update (admin-only)
- `DELETE /api/principal-partners/:id` - Delete (admin-only)

### Technical Details
- `GET /api/technical-details?productId=xxx&tab=sales|technical` - List with filters
- `POST /api/technical-details` - Create (admin-only)
- `GET /api/technical-details/:id` - Get one
- `PUT /api/technical-details/:id` - Update (admin-only)
- `DELETE /api/technical-details/:id` - Delete (admin-only)

### About Us Content
- `GET /api/about-us-content` - List all sections
- `POST /api/about-us-content` - Create (admin-only)
- `GET /api/about-us-content/:id` - Get one
- `PUT /api/about-us-content/:id` - Update (admin-only)
- `DELETE /api/about-us-content/:id` - Delete (admin-only)

### Technical Support Content
- `GET /api/technical-support-content` - List all sections
- `POST /api/technical-support-content` - Create (admin-only)
- `GET /api/technical-support-content/:id` - Get one
- `PUT /api/technical-support-content/:id` - Update (admin-only)
- `DELETE /api/technical-support-content/:id` - Delete (admin-only)

### Company Policies
- `GET /api/company-policies` - List all (public: active only, admin: all)
- `POST /api/company-policies` - Create (admin-only)
- `GET /api/company-policies/:id` - Get one
- `PUT /api/company-policies/:id` - Update (admin-only)
- `DELETE /api/company-policies/:id` - Delete (admin-only)

### Returns Content
- `GET /api/returns-content` - List all sections
- `POST /api/returns-content` - Create (admin-only)
- `GET /api/returns-content/:id` - Get one
- `PUT /api/returns-content/:id` - Update (admin-only)
- `DELETE /api/returns-content/:id` - Delete (admin-only)

## Admin Panel Pages

### Completed Admin Pages:
1. ✅ `/admin/authorised-distributors` - Full CRUD
2. ✅ `/admin/principal-partners` - Full CRUD
3. ✅ `/admin/about-us` - Full CRUD

### Remaining Admin Pages to Create:
Following the same pattern as the About Us page, create:

1. **Technical Support** (`/admin/technical-support/page.tsx`)
   - Similar to About Us page
   - Use `technicalSupportContentSchema` from `@/lib/cms-validation`
   - API endpoint: `/api/technical-support-content`

2. **Company Policies** (`/admin/company-policies/page.tsx`)
   - Similar to Careers page (list with table)
   - Use `companyPolicySchema` from `@/lib/cms-validation`
   - API endpoint: `/api/company-policies`
   - Include slug generation

3. **Returns** (`/admin/returns/page.tsx`)
   - Similar to About Us page
   - Use `returnsContentSchema` from `@/lib/cms-validation`
   - API endpoint: `/api/returns-content`

4. **Technical Details** (`/admin/technical-details/page.tsx`)
   - Similar to Careers page but with product selection
   - Use `technicalDetailsSchema` from `@/lib/cms-validation`
   - API endpoint: `/api/technical-details`
   - Include product dropdown and tab selector (Sales/Technical)

## Frontend Pages Updates

### Completed:
1. ✅ Homepage - Updated "Kitting Facility" → "Authorised Distributor" and "Global Partners" → "Principal Partners"
2. ✅ Partners page - Updated title to "Principal Partners"

### Remaining Frontend Updates:

1. **Partners Page** (`app/(site)/partners/page.tsx`)
   - Fetch Principal Partners from `/api/principal-partners`
   - Display dynamically instead of hardcoded content
   - Show company logos, details, contact info

2. **About Us Page** (`app/(site)/about/page.tsx`)
   - Fetch content sections from `/api/about-us-content`
   - Render sections dynamically based on `displayOrder`
   - Support multiple sections (hero, story, mission, vision, etc.)

3. **Technical Support Page** (`app/(site)/support/page.tsx`)
   - Fetch content sections from `/api/technical-support-content`
   - Render sections dynamically

4. **Returns Page** (`app/(site)/returns/page.tsx`)
   - Fetch content sections from `/api/returns-content`
   - Render sections dynamically

5. **Product Details Page** (`app/(site)/products/[id]/page.tsx`)
   - Add tabs for "Sales" and "Technical"
   - Fetch technical details from `/api/technical-details?productId=xxx&tab=sales` and `tab=technical`
   - Display content in respective tabs

6. **Company Policies Page** (create new if needed)
   - Fetch policies from `/api/company-policies`
   - Display list of active policies
   - Link to individual policy pages using slugs

## Implementation Steps

### Step 1: Run Database Migration
```bash
psql -U postgres -d <database_name> -f prisma/migrate-add-cms-content.sql
```

### Step 2: Create Remaining Admin Pages
Follow the pattern established in:
- `app/(admin)/admin/about-us/page.tsx` for content management pages
- `app/(admin)/admin/authorised-distributors/page.tsx` for list-based pages

### Step 3: Update Frontend Pages
Update each frontend page to:
1. Fetch data from respective API endpoints
2. Handle loading states
3. Render content dynamically
4. Handle empty states gracefully

### Step 4: Test
1. Test admin panel CRUD operations
2. Test frontend pages display correctly
3. Test with empty data (graceful degradation)
4. Test with multiple entries

## Example: Updating Partners Page

```typescript
// In app/(site)/partners/page.tsx
'use client'

import { useEffect, useState } from 'react'
// ... other imports

interface PrincipalPartner {
  id: string
  companyName: string
  logo?: string
  companyDetails?: string
  email?: string
  phone?: string
  address?: string
  website?: string
}

export default function PrincipalPartnersPage() {
  const [partners, setPartners] = useState<PrincipalPartner[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/principal-partners')
      .then(res => res.json())
      .then(data => {
        setPartners(Array.isArray(data) ? data : [])
        setIsLoading(false)
      })
      .catch(() => {
        setPartners([])
        setIsLoading(false)
      })
  }, [])

  // Render partners dynamically
  // ...
}
```

## Notes

- All content is sanitized using `sanitizeRichText` before storage
- All API routes include rate limiting and CSRF protection
- Admin routes require authentication via `requireAdmin` middleware
- Public routes return only active/published content
- Admin routes can access all content regardless of status

## Validation

All schemas are defined in `lib/cms-validation.ts` using Zod. Each content type has:
- Required fields validation
- Type validation
- Optional fields with proper defaults
- URL/email validation where applicable
