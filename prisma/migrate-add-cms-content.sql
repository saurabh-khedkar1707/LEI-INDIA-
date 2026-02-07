-- Migration: Add CMS Content Management Tables
-- This migration adds tables for managing content from the admin panel
-- 
-- Run this migration as a PostgreSQL superuser:
--   psql -U postgres -d <database_name> -f prisma/migrate-add-cms-content.sql

-- Authorised Distributor (replaces Kitting Facility)
CREATE TABLE IF NOT EXISTS "AuthorisedDistributor" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyName" TEXT NOT NULL,
  logo TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Principal Partner (replaces Global Partner)
CREATE TABLE IF NOT EXISTS "PrincipalPartner" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyName" TEXT NOT NULL,
  logo TEXT,
  "companyDetails" TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Technical Details (with Sales and Technical tabs)
CREATE TABLE IF NOT EXISTS "TechnicalDetails" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "productId" UUID REFERENCES "Product"(id) ON DELETE CASCADE,
  tab TEXT NOT NULL CHECK (tab IN ('sales', 'technical')),
  title TEXT,
  content TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- About Us Content (editable from admin)
CREATE TABLE IF NOT EXISTS "AboutUsContent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE,
  title TEXT,
  content TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Technical Support Content (editable from admin)
CREATE TABLE IF NOT EXISTS "TechnicalSupportContent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE,
  title TEXT,
  content TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Company Policies (add/modify/remove from admin)
CREATE TABLE IF NOT EXISTS "CompanyPolicy" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  "policyType" TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Returns Content (editable from admin)
CREATE TABLE IF NOT EXISTS "ReturnsContent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE,
  title TEXT,
  content TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_authorised_distributor_active ON "AuthorisedDistributor"(active);
CREATE INDEX IF NOT EXISTS idx_authorised_distributor_display_order ON "AuthorisedDistributor"("displayOrder");
CREATE INDEX IF NOT EXISTS idx_principal_partner_active ON "PrincipalPartner"(active);
CREATE INDEX IF NOT EXISTS idx_principal_partner_display_order ON "PrincipalPartner"("displayOrder");
CREATE INDEX IF NOT EXISTS idx_technical_details_product ON "TechnicalDetails"("productId");
CREATE INDEX IF NOT EXISTS idx_technical_details_tab ON "TechnicalDetails"(tab);
CREATE INDEX IF NOT EXISTS idx_about_us_section ON "AboutUsContent"(section);
CREATE INDEX IF NOT EXISTS idx_technical_support_section ON "TechnicalSupportContent"(section);
CREATE INDEX IF NOT EXISTS idx_company_policy_slug ON "CompanyPolicy"(slug);
CREATE INDEX IF NOT EXISTS idx_company_policy_active ON "CompanyPolicy"(active);
CREATE INDEX IF NOT EXISTS idx_returns_content_section ON "ReturnsContent"(section);

-- Comments for documentation
COMMENT ON TABLE "AuthorisedDistributor" IS 'Authorised distributors managed from admin panel (replaces Kitting Facility)';
COMMENT ON TABLE "PrincipalPartner" IS 'Principal partners managed from admin panel (replaces Global Partner)';
COMMENT ON TABLE "TechnicalDetails" IS 'Technical details with Sales and Technical tabs for products';
COMMENT ON TABLE "AboutUsContent" IS 'Editable About Us page content sections';
COMMENT ON TABLE "TechnicalSupportContent" IS 'Editable Technical Support page content sections';
COMMENT ON TABLE "CompanyPolicy" IS 'Company policies that can be added/modified/removed from admin';
COMMENT ON TABLE "ReturnsContent" IS 'Editable Returns page content sections';
