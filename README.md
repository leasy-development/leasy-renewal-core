
# Leasy - Property Management Platform

A modern, scalable property management platform built with React 19, TypeScript, and Supabase.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **UI**: Tailwind CSS + Radix UI + shadcn/ui + Lucide Icons
- **Routing**: React Router DOM v6
- **State Management**: TanStack React Query v5 + Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Testing**: Vitest + React Testing Library + MSW
- **Build**: Vite + ESLint + TypeScript
- **PWA**: Service Worker + Manifest + Offline Support

### Key Features
- 🏠 Property management with AI-powered descriptions
- 📸 Smart media categorization and optimization
- 🔄 Bulk operations and CSV import/export
- 🌐 Multi-language support with automatic translation
- 📊 Advanced analytics and reporting
- 🔍 Duplicate detection and management
- 🛠️ Developer tools and performance monitoring
- 📱 Progressive Web App with offline support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Supabase CLI (optional, for local development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd leasy-renewal-core

# Install dependencies
pnpm install
# or
bun install

# Copy environment variables
cp .env.local.example .env.local

# Start development server
pnpm dev
# or
bun dev
```

### Environment Setup

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xmaafgjtzupdndcavjiq.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# External API Keys
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
VITE_OPENAI_API_KEY=your-openai-key

# Application Configuration
VITE_APP_NAME=Leasy
VITE_APP_VERSION=1.0.0
VITE_DEPLOYMENT_URL=your-deployment-url

# Feature Flags
VITE_ENABLE_DEBUG_TOOLS=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_EXPERIMENTAL_FEATURES=false
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn)
│   ├── property-form/  # Property form components
│   ├── navigation/     # Navigation components
│   └── ...
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
│   ├── supabase/      # Supabase client and utilities
│   ├── performance.ts # Performance monitoring
│   ├── devtools.ts    # Development tools
│   └── config.ts      # Application configuration
├── types/              # TypeScript type definitions
├── services/           # Business logic and API services
├── utils/              # Helper functions
├── test/               # Test utilities and setup
└── assets/             # Static assets
```

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

## 🏗️ Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview

# Type check
pnpm type-check

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix
```

## 🔧 Development Tools

### Dev Tools Panel
Press `Ctrl+Shift+D` to toggle the development tools panel featuring:
- Performance metrics monitoring
- Cache management
- Console logs viewer
- Configuration inspector

### Performance Monitoring
- Automatic performance tracking for components and functions
- Memory usage monitoring
- Cache hit/miss statistics
- Bundle size analysis

### Error Handling
- Comprehensive error boundary system
- Automatic error reporting
- User-friendly error messages
- Development error details

## 📊 Code Quality

### DeepSource Integration
- Automated code quality analysis
- TypeScript, React, and security checks
- Performance and maintainability insights
- Continuous monitoring

### ESLint Configuration
- Modern React 19 rules
- TypeScript strict mode
- Accessibility guidelines
- Performance best practices

## 🚀 Deployment

### Environment Setup
1. Set up Supabase project
2. Configure environment variables
3. Set up external API keys
4. Configure deployment platform

### Production Build
```bash
# Build optimized bundle
pnpm build

# Verify build
pnpm preview
```

### Supabase Deployment
```bash
# Deploy edge functions
supabase functions deploy

# Push database migrations
supabase db push
```

## 📖 API Documentation

### Supabase Integration
- **Authentication**: Email/password, social logins
- **Database**: PostgreSQL with Row Level Security
- **Storage**: File uploads with intelligent categorization
- **Edge Functions**: AI processing, bulk operations

### External APIs
- **OpenAI**: Property descriptions, image analysis
- **Google Maps**: Location services and geocoding
- **DeepSource**: Code quality monitoring

## 🔐 Security

### Authentication & Authorization
- Supabase Auth with RLS policies
- JWT token management
- Role-based access control
- Secure API key handling

### Data Protection
- End-to-end encryption for sensitive data
- Secure file upload validation
- SQL injection prevention
- XSS protection

## 🌟 Advanced Features

### AI Integration
- Automatic property description generation
- Smart image categorization
- Duplicate detection algorithms
- Multi-language translation

### Performance Optimization
- Code splitting and lazy loading
- Image optimization and caching
- Service worker for offline support
- Bundle size optimization

### Developer Experience
- Hot module replacement
- TypeScript strict mode
- Comprehensive testing setup
- Development tools integration

## 📚 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines
- Follow TypeScript strict mode
- Write tests for new features
- Use semantic commit messages
- Follow the established code style
- Update documentation as needed

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Check the [troubleshooting guide](docs/troubleshooting.md)
- Review the [API documentation](docs/api.md)
- Contact the development team

---

Built with ❤️ by the Leasy team
