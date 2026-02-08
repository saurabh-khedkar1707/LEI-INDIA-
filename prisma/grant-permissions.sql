-- Grant permissions to database user
-- This script should be run as a PostgreSQL superuser (e.g., postgres user)
-- 
-- Usage:
--   1. Find your database name and username from DATABASE_URL
--   2. Replace <DB_USER> below with your actual database user from DATABASE_URL
--   3. Run: psql -U postgres -d <database_name> -f prisma/grant-permissions.sql
--   4. Or connect and run these commands manually
--
-- To find your database user, check your DATABASE_URL or run:
--   psql -U postgres -d <database_name> -c "SELECT current_user;"
--
-- IMPORTANT: Replace <DB_USER> with your actual database username before running!

-- Grant schema usage first (required for table access)
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT USAGE ON SCHEMA public TO current_user;

-- Grant permissions to the current user (the user from your DATABASE_URL)
-- This grants permissions to whoever runs this script
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO current_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO current_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO current_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO current_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO current_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO current_user;

-- Also grant to PUBLIC as a fallback (ensures all users can access)
-- This is less secure but ensures the application works
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;

-- Grant specific permissions on each table (explicit approach)
-- This ensures permissions even if PUBLIC grants fail
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "User" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Admin" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Category" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Product" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Order" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "OrderItem" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Inquiry" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "ContactInfo" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Blog" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Career" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "Resource" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "PasswordResetToken" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "HeroSlide" TO PUBLIC;
-- CMS Content Management tables (added in migrate-add-cms-content.sql)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "AuthorisedDistributor" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "PrincipalPartner" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "TechnicalDetails" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "AboutUsContent" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "TechnicalSupportContent" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "CompanyPolicy" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "ReturnsContent" TO PUBLIC;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO PUBLIC;
