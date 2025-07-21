
// Security headers configuration for production
export const securityHeaders = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' https://js.stripe.com https://maps.googleapis.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https: *.supabase.co *.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' *.supabase.co wss://*.supabase.co https://api.openai.com;
    frame-src 'self' https://js.stripe.com;
    media-src 'self' *.supabase.co;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim(),
  
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Rate limiting configuration
export const rateLimitConfig = {
  // API endpoints rate limits (requests per minute)
  '/api/ai-generation': 30,
  '/api/media-processing': 20,
  '/api/duplicate-detection': 10,
  '/api/analytics': 60,
  '/api/properties': 100,
  
  // Authentication endpoints
  '/auth/login': 5,
  '/auth/register': 3,
  '/auth/reset-password': 3,
};

// CORS configuration
export const corsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://www.yourdomain.com']
    : ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Input validation patterns
export const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  phoneNumber: /^\+?[\d\s\-\(\)]{10,}$/,
  postalCode: /^[\d\w\s\-]{3,10}$/,
  url: /^https?:\/\/.+$/,
};
