# Leasy Renewal Core 🏠

> **Production-Ready Property Listing Management Platform**  
> Streamlined property listing management with AI-powered duplicate detection, bulk upload capabilities, and multi-platform synchronization.

[![Deploy Status](https://img.shields.io/badge/deploy-production-green)](https://leasy-renewal-core.lovable.app)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com)

## 🚀 Live Demo

**Production URL**: [https://leasy-renewal-core.lovable.app](https://leasy-renewal-core.lovable.app)

## ✨ Features

### 🏠 Property Management
- **Bulk CSV Upload** - Import hundreds of properties instantly
- **AI-Powered Duplicate Detection** - Automatically identify and merge duplicates
- **Multi-Language Support** - German/English with AI translation
- **Smart Categorization** - Auto-categorize property images and content

### 🤖 AI & Automation
- **Smart Title Generation** - AI-powered property titles
- **Content Optimization** - Auto-generate descriptions and meta content
- **Image Recognition** - Categorize property photos automatically
- **Translation Engine** - Intelligent multi-language content management

### 📊 Analytics & Insights
- **Real-time Dashboard** - Upload progress and property analytics
- **Quality Scoring** - Content quality assessment and recommendations
- **Error Monitoring** - Comprehensive error tracking and debugging

### 🔒 Enterprise Security
- **Row-Level Security (RLS)** - Database-level access control
- **Rate Limiting** - API protection against abuse
- **Audit Trails** - Complete action logging and compliance
- **GDPR Compliant** - Privacy-first architecture

## 🛠️ Tech Stack

```
Frontend:
├── React 19.1.0         # Latest React with concurrent features
├── TypeScript 5.0       # Type-safe development
├── Vite                 # Ultra-fast build tool
├── Tailwind CSS         # Utility-first styling
├── shadcn/ui           # Beautiful, accessible components
├── React Query v5       # Powerful data fetching
├── React Router v6      # Client-side routing
└── PWA Ready           # Offline-first application

Backend:
├── Supabase            # Postgres database + auth + storage
├── Edge Functions      # Serverless API endpoints
├── Real-time Updates   # WebSocket connections
├── Vector Search       # AI-powered similarity matching
└── Storage Buckets     # File upload and management

Development:
├── ESLint + Prettier   # Code quality and formatting
├── Vitest + MSW        # Testing framework + API mocking
├── GitHub Actions      # CI/CD pipeline
└── TypeScript strict   # Maximum type safety
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- **pnpm/npm** package manager
- **Supabase CLI** (optional, for local development)

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/leasy-development/leasy-renewal-core.git
cd leasy-renewal-core

# Install dependencies
pnpm install  # or npm install

# Setup environment
cp .env.local.example .env.local
# Edit .env.local with your API keys
```

## 🚀 Quick Start

### Automated Setup (Recommended)
```bash
# Clone and setup everything automatically
git clone https://github.com/leasy-development/leasy-renewal-core.git
cd leasy-renewal-core
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Manual Setup
1. Clone the repository:
```bash
git clone https://github.com/leasy-development/leasy-renewal-core.git
cd leasy-renewal-core
```

2. Install dependencies:
```bash
npm install
```

3. Copy and configure environment:
```bash
cp .env.local.example .env.local
# Edit .env.local with your actual Supabase credentials
```

4. Run health checks:
```bash
chmod +x scripts/ai-healthcheck.sh
./scripts/ai-healthcheck.sh
```

5. Start development server:
```bash
npm run dev
```

### 🔧 Production Build
```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Run deployment checks
node scripts/ai-deployment-check.js
```

### 🛠️ System Repair
```bash
# Run automated system repair if issues occur
node scripts/system-repair.js
```

## 📁 Project Structure

```
leasy-renewal-core/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui base components
│   │   ├── forms/          # Form components
│   │   ├── dashboard/      # Dashboard-specific components
│   │   └── property-form/  # Property management components
│   ├── pages/              # Route components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and configurations
│   ├── services/           # API service layers
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Helper functions
├── supabase/
│   ├── functions/          # Edge Functions
│   ├── migrations/         # Database migrations
│   └── config.toml         # Supabase configuration
├── public/                 # Static assets
├── scripts/                # Build and deployment scripts
└── docs/                   # Documentation
```

## 🔧 Environment Variables

### Required Variables
```env
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# External APIs (Optional)
VITE_GOOGLE_MAPS_API_KEY=your-maps-key

# Production Settings
VITE_DEPLOYMENT_URL=https://leasy-renewal-core.lovable.app
VITE_ENABLE_SECURITY_HEADERS=true
```

### Edge Function Secrets (Supabase Dashboard)
```env
OPENAI_API_KEY=sk-...          # AI content generation
RESEND_API_KEY=re_...          # Email notifications
DEEPSOURCE_API_TOKEN=...       # Code quality analysis
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test src/components/PropertyCard.test.tsx
```

## 📦 Build & Deploy

### Automated Deployment (Recommended)
```bash
# Deploy to production via Lovable
# Visit: https://lovable.dev/projects/your-project-id
# Click: Share > Publish
```

### Manual Deployment
```bash
# Build production bundle
pnpm run build

# Verify build quality
pnpm run build:check

# Deploy to your hosting platform
# (Vercel, Netlify, etc.)
```

## 🔐 Security Features

### Database Security
- **Row-Level Security (RLS)** enabled on all tables
- **Service role restrictions** for admin operations
- **API rate limiting** (100 requests/minute per user)
- **SQL injection protection** via parameterized queries

### Application Security
- **CSRF protection** via SameSite cookies
- **XSS prevention** via Content Security Policy
- **Secure headers** (HSTS, X-Frame-Options, etc.)
- **Input validation** with Zod schemas

### Data Privacy
- **GDPR compliance** with data export/deletion
- **Audit logging** for all sensitive operations
- **Encrypted storage** for sensitive user data
- **Anonymous usage analytics** (no PII collected)

## 📊 Performance Optimizations

### Frontend
- **React 19 Concurrent Features** - Automatic batching and transitions
- **Code Splitting** - Route-based lazy loading
- **Bundle Optimization** - Tree shaking and chunk splitting
- **Service Worker** - Offline functionality and caching
- **Image Optimization** - WebP format with lazy loading

### Backend
- **Database Indexing** - Optimized queries for large datasets
- **Connection Pooling** - Efficient database connections
- **Edge Functions** - Global serverless deployment
- **CDN Integration** - Static asset delivery
- **Query Optimization** - React Query with background updates

## 🐛 Debugging & Monitoring

### Development Tools
```bash
# Enable debug mode
VITE_DEBUG_MODE=true pnpm dev

# View React Query DevTools
# Automatically enabled in development

# Database inspection
npx supabase db dump --data-only > backup.sql

# Performance monitoring
pnpm run analyze
```

### Production Monitoring
- **Error Tracking** - Automatic error collection and reporting
- **Performance Metrics** - Core Web Vitals monitoring
- **Usage Analytics** - Anonymous user behavior tracking
- **Uptime Monitoring** - 24/7 availability tracking

## 🤝 Contributing

### Development Workflow
1. **Fork & Clone** the repository
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Run tests** (`pnpm test`)
4. **Commit changes** (`git commit -m 'Add amazing feature'`)
5. **Push to branch** (`git push origin feature/amazing-feature`)
6. **Open Pull Request**

### Code Standards
- **TypeScript strict mode** - All code must be fully typed
- **ESLint configuration** - Follow established patterns
- **Test coverage** - Minimum 80% coverage for new features
- **Component documentation** - JSDoc comments for complex logic

## 📞 Support & Documentation

### Getting Help
- **GitHub Issues** - Bug reports and feature requests
- **Documentation** - [Full documentation site](https://docs.leasy-renewal-core.com)
- **Discord Community** - [Join our Discord](https://discord.gg/leasy)
- **Email Support** - support@leasy.dev

### Documentation
- [API Reference](./docs/api.md) - Complete API documentation
- [Component Guide](./docs/components.md) - Component usage examples
- [Deployment Guide](./docs/deployment.md) - Production deployment steps
- [Security Guide](./docs/security.md) - Security best practices

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🏆 Credits

Built with ❤️ by the Leasy Development Team

- **Architecture** - Modern React 19 + TypeScript + Supabase
- **Design System** - Tailwind CSS + shadcn/ui components
- **Performance** - Optimized for Core Web Vitals
- **Security** - Enterprise-grade security practices

---

**🌟 Star this repo if you find it helpful!**

[![GitHub stars](https://img.shields.io/github/stars/leasy-development/leasy-renewal-core?style=social)](https://github.com/leasy-development/leasy-renewal-core/stargazers)