# LEI Indias - B2B Industrial E-commerce Platform

A professional, production-ready B2B Industrial E-commerce website built with Next.js 14+, TypeScript, Tailwind CSS, and Express.js.

## Features

- **Dynamic Product System**: M8/M12 connector catalog with Coding (A, B, D, X), Pins (3, 4, 5, 8, 12), and IP Rating (IP67/68)
- **B2B RFQ System**: Request for Quote flow instead of traditional cart
- **Advanced Filtering**: Real-time filtering with URL search params for shareable filtered views
- **Technical Specifications**: Professional data-driven tables with datasheet downloads
- **SEO Optimized**: Next.js Metadata API with OpenGraph tags
- **Image Optimization**: Next.js Image component with shimmer placeholders
- **Responsive Design**: Mobile-first design for all devices
- **Glassmorphism Effects**: Modern 2026 aesthetic with frosted glass filters
- **Kinetic Typography**: Animated hero headlines with Framer Motion
- **Bento Grid Resources**: Technical knowledge center with card-based layout

## Tech Stack

### Frontend
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Zustand (State Management)
- React Hook Form + Zod (Form Validation)
- Lucide React (Icons)

### Backend
- Express.js
- TypeScript
- JSON File Storage
- CORS enabled

## Project Structure

```
leiindias/
├── frontend/          # Next.js application
│   ├── app/          # App Router pages
│   ├── components/   # React components
│   │   ├── ui/       # shadcn/ui primitives
│   │   ├── shared/    # Header, Footer
│   │   ├── features/  # ProductCard, FilterSidebar
│   │   └── widgets/  # HeroSlider, BentoResources
│   ├── hooks/        # Custom hooks
│   ├── lib/          # Utilities, data, schemas
│   ├── store/        # Zustand stores
│   └── types/        # TypeScript types
├── backend/          # Express.js API
│   ├── src/
│   │   ├── routes/   # API routes
│   │   └── utils/    # Storage utilities
│   └── data/         # JSON file storage
└── shared/           # Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Install root dependencies:**
```bash
npm install
```

2. **Install frontend dependencies:**
```bash
cd frontend
npm install
```

3. **Install backend dependencies:**
```bash
cd ../backend
npm install
```

### Development

1. **Start the backend server:**
```bash
cd backend
npm run dev
```
Backend runs on http://localhost:3001

2. **Start the frontend development server:**
```bash
cd frontend
npm run dev
```
Frontend runs on http://localhost:3000

### Building for Production

1. **Build frontend:**
```bash
cd frontend
npm run build
npm start
```

2. **Build backend:**
```bash
cd backend
npm run build
npm start
```

## Key Pages

- `/` - Homepage with hero slider, categories, featured products, and resource center
- `/products` - Product listing with advanced filters
- `/products/[id]` - Product detail page with technical specs
- `/rfq` - Request for Quote page
- `/contact` - Contact form with meeting request option

## API Endpoints

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `POST /api/orders` - Create order
- `POST /api/orders/bulk` - Create bulk order
- `GET /api/orders` - List orders (admin)
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order status

### Inquiries
- `POST /api/inquiries` - Submit inquiry
- `GET /api/inquiries` - List inquiries (admin)

### Resources
- `GET /api/resources` - List technical resources

## Data Storage

The backend uses MongoDB for data storage:
- Products - Stored in MongoDB (migrated from JSON)
- Orders - Stored in MongoDB
- Inquiries - Stored in MongoDB
- Resources - Stored in MongoDB
- Admins - Stored in MongoDB

Legacy JSON files in `backend/data/` can be migrated using the migration script.

## Environment Variables

Create `.env.local` in the frontend directory:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Create `.env` in the backend directory:
```
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## Features in Detail

### Product Filtering
- Real-time filtering using URL search params
- Filter by: Connector Type, Coding, Pins, IP Rating, Gender, Stock Status
- Shareable filtered product views
- Glassmorphism filter sidebar

### RFQ System
- Add products to RFQ list
- Submit company profile for pricing
- Quantity management
- Bulk order support

### Technical Specifications
- Professional data tables
- Download datasheet functionality
- Accordion/Tabs for organized information
- Material, Voltage, Current, Temperature Range specs

## License

Private - LEI Indias
