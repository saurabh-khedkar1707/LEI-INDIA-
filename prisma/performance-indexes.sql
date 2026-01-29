-- Performance optimization indexes for high-traffic queries
-- Run this after the main schema.sql to add performance indexes

-- Product table: Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_product_category_in_stock_created ON "Product"(category, "inStock", "createdAt" DESC) WHERE "inStock" = true;
CREATE INDEX IF NOT EXISTS idx_product_connector_type_in_stock ON "Product"("connectorType", "inStock") WHERE "inStock" = true;
CREATE INDEX IF NOT EXISTS idx_product_coding_pins ON "Product"(coding, pins) WHERE coding IS NOT NULL AND pins IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_created_at_desc ON "Product"("createdAt" DESC);

-- Product table: Text search indexes (GIN for full-text search)
-- Note: Requires pg_trgm extension
CREATE INDEX IF NOT EXISTS idx_product_name_trgm ON "Product" USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_product_sku_trgm ON "Product" USING gin(sku gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_product_description_trgm ON "Product" USING gin(description gin_trgm_ops);

-- Order table: Composite indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_order_status_created_at ON "Order"(status, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_order_created_at_desc ON "Order"("createdAt" DESC);

-- OrderItem: Composite index for order lookups
CREATE INDEX IF NOT EXISTS idx_orderitem_order_product ON "OrderItem"("orderId", "productId");

-- Category: Text search and composite indexes
CREATE INDEX IF NOT EXISTS idx_category_name_trgm ON "Category" USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_category_slug_name ON "Category"(slug, name);
CREATE INDEX IF NOT EXISTS idx_category_parent_created ON "Category"("parentId", "createdAt") WHERE "parentId" IS NOT NULL;

-- Blog: Composite index for published blogs
CREATE INDEX IF NOT EXISTS idx_blog_published_created_at ON "Blog"(published, "createdAt" DESC) WHERE published = true;

-- Inquiry: Composite index for unread inquiries
CREATE INDEX IF NOT EXISTS idx_inquiry_read_created_at ON "Inquiry"(read, "createdAt" DESC) WHERE read = false;

-- Enable pg_trgm extension for trigram text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
