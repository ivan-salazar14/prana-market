# Prana Market 🛒

A modern, full-featured e-commerce platform built with **Strapi** (backend) and **Next.js** (frontend), specifically designed for the Colombian market with comprehensive payment integrations.

## 🌟 Features

### 🛍️ **Complete Shopping Experience**
- **Product Catalog**: Browse products by categories with detailed product pages
- **Smart Cart System**: Global cart state with real-time updates and item count display
- **Delivery Options**: Choose between store pickup, local delivery, or regional shipping
- **Cost Calculation**: Automatic total calculation including delivery fees
- **Order Summary**: Complete order details on confirmation page

### 💳 **Colombian Payment Integration**
- **Wompi**: Primary payment processor supporting credit cards, PSE, Efecty, Baloto, and bank transfers
- **Stripe**: International payment option with COP support
- **Mock Testing**: Development mode with simulated payments for testing
- **COP Currency**: All prices and transactions in Colombian Peso

### 🚚 **Delivery & Shipping**
- **Store Pickup**: Free collection at physical store location
- **Local Delivery**: COP 5,000 - Urban area delivery (1-2 business days)
- **Regional Delivery**: COP 10,000 - Extended area delivery (2-3 business days)

### 🛠️ **Technical Features**
- **Next.js 14**: Modern React framework with App Router
- **Strapi CMS**: Headless CMS for content management
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Responsive, modern UI design
- **Context API**: Global state management for cart and user data

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+
- npm or yarn
- Strapi CLI (for backend development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/prana-market.git
   cd prana-market
   ```

2. **Backend Setup (Strapi)**
   ```bash
   cd backend/prana-market-backend
   npm install
   npm run develop
   ```

3. **Frontend Setup (Next.js)**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Environment Configuration**
   ```bash
   # Copy and configure environment variables
   cp .env.example .env.local

   # Add your API keys
   WOMPI_PUBLIC_KEY=your_wompi_public_key
   WOMPI_PRIVATE_KEY=your_wompi_private_key
   ```

## 🛒 **Shopping Flow**

### Customer Journey
1. **Browse Products** → View catalog and product details
2. **Add to Cart** → Items added to global cart with quantity management
3. **Review Cart** → Cart icon shows item count, modal displays full cart
4. **Select Delivery** → Choose pickup, local, or regional delivery
5. **Review Costs** → See subtotal + delivery = total price
6. **Choose Payment** → Select Wompi (recommended) or Stripe
7. **Complete Payment** → Secure checkout with Colombian payment methods
8. **Order Confirmation** → Success page with complete order details

### Cart Features
- **Real-time Updates**: Cart count updates instantly
- **Quantity Management**: Increase/decrease item quantities
- **Item Removal**: Remove items individually
- **Cost Breakdown**: Clear pricing with delivery fees
- **Persistent State**: Cart maintained across page refreshes

## 💰 **Payment Integration**

### Wompi (Primary - Colombia)
- **Supported Methods**: Credit cards, PSE, Efecty, Baloto, bank transfers
- **Currency**: COP (Colombian Peso)
- **Fees**: Competitive rates for Colombian merchants
- **Compliance**: Fully compliant with Colombian regulations

### Development Testing
- **Mock Payments**: Automatic mock responses when API keys not configured
- **Test Flow**: Complete payment simulation without real transactions
- **Debug Mode**: Clear indicators for test vs production payments

## 📱 **API Endpoints**

### Products
- `GET /api/products` - List all products
- `GET /api/products/[id]` - Get product details
- `GET /api/product-categories` - List categories

### Payments
- `POST /api/wompi/create-transaction` - Create Wompi payment
- `POST /api/create-payment-intent` - Create Stripe payment

## 🏗️ **Project Structure**

```
prana-market/
├── backend/                    # Strapi CMS backend
│   └── prana-market-backend/
│       ├── src/api/           # API endpoints
│       ├── config/            # Strapi configuration
│       └── data/              # Seed data
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/               # Next.js app router
│   │   ├── components/        # React components
│   │   └── context/           # Global state management
└── docs/                      # Documentation
```

## 🔧 **Development**

### Available Scripts

**Frontend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

**Backend:**
```bash
npm run develop      # Start Strapi development server
npm run build        # Build Strapi admin
npm run start        # Start production server
```

### Testing the Shopping Flow

1. **Start both servers** (backend and frontend)
2. **Visit** `http://localhost:3000`
3. **Add products** to cart
4. **Click cart icon** in navbar
5. **Select delivery method**
6. **Choose payment method** (Wompi for mock testing)
7. **Complete payment** flow
8. **View success page** with order details

## 🚀 **Deployment**

### Frontend (Vercel)
```bash
npm run build
# Deploy to Vercel with environment variables
```

### Backend (Railway/Heroku)
```bash
npm run build
# Deploy Strapi backend with database
```

## 📋 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 **Support**

For questions or issues:
- Create an issue on GitHub
- Check the documentation in `WOMPI_INTEGRATION.md`
- Review the API endpoints and component structure

---

**Built with ❤️ for the Colombian e-commerce market**
