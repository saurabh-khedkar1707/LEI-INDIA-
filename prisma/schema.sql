-- PostgreSQL schema for Lei Indias app
-- This matches the table and column names used in app/api/* routes.
-- Consolidated migration - includes all tables, indexes, and constraints

CREATE TABLE IF NOT EXISTS "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "emailVerificationToken" TEXT,
  "emailVerificationTokenExpires" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Admin" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Category" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  "parentId" UUID REFERENCES "Category"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Product" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  "categoryId" UUID REFERENCES "Category"(id) ON DELETE SET NULL,
  description TEXT,
  "technicalDescription" TEXT,
  coding TEXT,
  pins INTEGER,
  "ipRating" TEXT,
  gender TEXT,
  "connectorType" TEXT,
  material TEXT,
  voltage TEXT,
  current TEXT,
  "temperatureRange" TEXT,
  "wireGauge" TEXT,
  "cableLength" TEXT,
  price NUMERIC,
  "priceType" TEXT NOT NULL DEFAULT 'per_unit',
  "inStock" BOOLEAN NOT NULL DEFAULT FALSE,
  "stockQuantity" INTEGER,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  "datasheetUrl" TEXT,
  "drawingUrl" TEXT,
  -- Extended product specifications
  mpn TEXT,
  "productType" TEXT,
  coupling TEXT,
  "wireCrossSection" TEXT,
  "cableDiameter" TEXT,
  "cableMantleColor" TEXT,
  "cableMantleMaterial" TEXT,
  "glandMaterial" TEXT,
  "housingMaterial" TEXT,
  "pinContact" TEXT,
  "socketContact" TEXT,
  "cableDragChainSuitable" BOOLEAN,
  "tighteningTorqueMax" TEXT,
  "bendingRadiusFixed" TEXT,
  "bendingRadiusRepeated" TEXT,
  "contactPlating" TEXT,
  "halogenFree" BOOLEAN,
  "strippingForce" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Order" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyName" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  "companyAddress" TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "OrderItem" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" UUID NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "productId" UUID,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS "Inquiry" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  responded BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ContactInfo" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  "registeredAddress" TEXT,
  "factoryLocation2" TEXT,
  "regionalBangalore" TEXT,
  "regionalKolkata" TEXT,
  "regionalGurgaon" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Blog" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  image TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Career" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  department TEXT,
  location TEXT,
  type TEXT,
  description TEXT,
  requirements TEXT,
  responsibilities TEXT,
  benefits TEXT,
  salary TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Resource" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  url TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "HeroSlide" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image TEXT NOT NULL,
  "ctaText" TEXT,
  "ctaLink" TEXT,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CMS Content Management Tables
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

CREATE TABLE IF NOT EXISTS "AboutUsContent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE,
  title TEXT,
  content TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "TechnicalSupportContent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE,
  title TEXT,
  content TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS "ReturnsContent" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE,
  title TEXT,
  content TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes to support common queries
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_is_active ON "User"("isActive");
CREATE INDEX IF NOT EXISTS idx_product_sku ON "Product"(sku);
CREATE INDEX IF NOT EXISTS idx_product_category ON "Product"(category);
CREATE INDEX IF NOT EXISTS idx_product_categoryid ON "Product"("categoryId");
CREATE INDEX IF NOT EXISTS idx_product_categoryid_id ON "Product"("categoryId", id);
CREATE INDEX IF NOT EXISTS idx_product_in_stock ON "Product"("inStock");
CREATE INDEX IF NOT EXISTS idx_product_connector_type ON "Product"("connectorType");
CREATE INDEX IF NOT EXISTS idx_product_coding ON "Product"(coding);
CREATE INDEX IF NOT EXISTS idx_product_pins ON "Product"(pins);
CREATE INDEX IF NOT EXISTS idx_product_mpn ON "Product"("mpn") WHERE "mpn" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_halogen_free ON "Product"("halogenFree") WHERE "halogenFree" = true;
CREATE INDEX IF NOT EXISTS idx_product_drag_chain ON "Product"("cableDragChainSuitable") WHERE "cableDragChainSuitable" = true;
CREATE INDEX IF NOT EXISTS idx_order_created_at ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS idx_order_status ON "Order"(status);
CREATE INDEX IF NOT EXISTS idx_order_email ON "Order"(email);
CREATE INDEX IF NOT EXISTS idx_orderitem_order ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS idx_orderitem_product ON "OrderItem"("productId");
CREATE INDEX IF NOT EXISTS idx_category_slug ON "Category"(slug);
CREATE INDEX IF NOT EXISTS idx_category_parent ON "Category"("parentId");
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON "PasswordResetToken"(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_user ON "PasswordResetToken"("userId");
CREATE INDEX IF NOT EXISTS idx_user_email_verification_token ON "User"("emailVerificationToken");
CREATE INDEX IF NOT EXISTS idx_hero_slide_active ON "HeroSlide"(active);
CREATE INDEX IF NOT EXISTS idx_hero_slide_display_order ON "HeroSlide"("displayOrder");
CREATE INDEX IF NOT EXISTS idx_blog_slug ON "Blog"(slug);
CREATE INDEX IF NOT EXISTS idx_blog_published ON "Blog"(published);
CREATE INDEX IF NOT EXISTS idx_blog_created_at ON "Blog"("createdAt");
CREATE INDEX IF NOT EXISTS idx_career_slug ON "Career"(slug);
CREATE INDEX IF NOT EXISTS idx_career_active ON "Career"(active);
CREATE INDEX IF NOT EXISTS idx_inquiry_created_at ON "Inquiry"("createdAt");
CREATE INDEX IF NOT EXISTS idx_inquiry_read ON "Inquiry"(read);
CREATE INDEX IF NOT EXISTS idx_inquiry_email ON "Inquiry"(email);
CREATE INDEX IF NOT EXISTS idx_inquiry_responded ON "Inquiry"(responded);

-- CMS table indexes
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
