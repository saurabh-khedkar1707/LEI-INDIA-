# LEI Indias - Industrial Connectors & Cables Platform

A professional B2B e-commerce platform for industrial connectors, cables, and PROFINET products. Built with Next.js 14, TypeScript, PostgreSQL, and modern web technologies.

## 🚀 Features

- **Product Catalog**: Comprehensive product management with categories, filters, and search
- **RFQ System**: Request for Quotation functionality for B2B customers
- **User Management**: Customer registration, authentication, and profile management
- **Admin Dashboard**: Full admin panel for managing products, categories, blogs, careers, and inquiries
- **Blog & Resources**: Content management system for blogs and resources
- **Career Portal**: Job posting and application management
- **Responsive Design**: Modern, mobile-first UI built with Tailwind CSS and Radix UI

## 📋 Prerequisites

- **Node.js**: 20.x or higher
- **pnpm**: 9.0.0 or higher (package manager)
- **PostgreSQL**: 12.x or higher
- **Git**: For version control

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/leiindias.git
cd leiindias
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/leiindias

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000

# Optional: Logging
LOG_LEVEL=info

# Optional: Error Reporting (Sentry)
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=development
```

### 4. Set Up Database

Run the database schema:

```bash
# Connect to your PostgreSQL database and run:
psql -U your_user -d leiindias -f prisma/schema.sql

# Or if you need to grant permissions:
psql -U your_user -d leiindias -f prisma/grant-permissions.sql
```

### 5. Initialize Database (Optional)

If you need to seed initial data:

```bash
# Run the initialization script
pnpm tsx src/initDatabase.ts
```

### 6. Run Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## 📜 Available Scripts

- `pnpm dev` - Start development server with custom port handling
- `pnpm dev:fixed` - Start development server (standard Next.js)
- `pnpm build` - Build the application for production
- `pnpm start` - Start production server with custom port handling
- `pnpm start:fixed` - Start production server (standard Next.js)
- `pnpm start:prod` - Start production server with NODE_ENV=production
- `pnpm lint` - Run ESLint
- `pnpm check:console-logs` - Check for console.log statements

## 🏗️ Project Structure

```
leiindias/
├── app/                    # Next.js app directory
│   ├── (admin)/           # Admin routes
│   ├── (site)/            # Public site routes
│   └── api/               # API routes
├── components/            # React components
│   ├── features/          # Feature-specific components
│   ├── shared/            # Shared components
│   ├── ui/                # UI primitives (Radix UI)
│   └── widgets/           # Widget components
├── lib/                   # Utility libraries
├── prisma/                # Database schema
├── scripts/               # Build and utility scripts
├── store/                 # Zustand state management
└── types/                 # TypeScript type definitions
```

## 🚢 Deployment

For detailed deployment instructions, see the [Deployment Guide](./docs/DEPLOYMENT.md).

### Quick Start

- **Netlify**: See [Deployment Guide - Netlify](./docs/DEPLOYMENT.md#netlify-deployment)
- **AWS**: See [Deployment Guide - AWS](./docs/DEPLOYMENT.md#aws-deployment)
- **GitHub Setup**: See [GitHub Setup Guide](./docs/SETUP_GITHUB.md)

## 🔧 Configuration

### Database

The application uses PostgreSQL. Ensure your database is accessible and the schema is applied:

```sql
-- Run the schema
\i prisma/schema.sql

-- Grant necessary permissions
\i prisma/grant-permissions.sql
```

### Environment Variables

All environment variables are validated at startup. See `lib/env-validation.ts` for the complete schema.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)

**Optional:**
- `NEXT_PUBLIC_APP_URL` - Public application URL
- `NEXT_PUBLIC_API_URL` - Public API URL
- `LOG_LEVEL` - Logging level (fatal, error, warn, info, debug, trace)
- `SENTRY_DSN` - Sentry error tracking DSN
- `SENTRY_ENVIRONMENT` - Sentry environment name

## 🧪 Testing

```bash
# Run linter
pnpm lint

# Check for console logs
pnpm check:console-logs
```

## 🤝 Contributing

See the [Contributing Guide](.github/CONTRIBUTING.md) for detailed guidelines.

Quick start:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary and confidential. All rights reserved.

## 🆘 Support

For support, email support@leiindias.com or create an issue in the repository.

## 🔗 Links

- **Website**: https://leiindias.com
- **Documentation**: See [docs/](./docs/) folder
  - [Deployment Guide](./docs/DEPLOYMENT.md)
  - [GitHub Setup Guide](./docs/SETUP_GITHUB.md)
  - [Performance Optimizations](./docs/PERFORMANCE_OPTIMIZATIONS.md)
- **API Documentation**: [Coming Soon]

---

Built with ❤️ by LEI Indias Team
