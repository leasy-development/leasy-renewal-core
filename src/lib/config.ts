
// Application configuration management
interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    debug: boolean;
  };
  api: {
    timeout: number;
    retries: number;
    baseUrl: string;
  };
  supabase: {
    url: string;
    anonKey: string;
  };
  performance: {
    enableMetrics: boolean;
    cacheTimeout: number;
    lazyLoadThreshold: number;
  };
  features: {
    enableExperimentalFeatures: boolean;
    enableDebugTools: boolean;
    enablePerformanceMonitoring: boolean;
  };
}

const config: AppConfig = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Leasy',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: (import.meta.env.MODE as AppConfig['app']['environment']) || 'development',
    debug: import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.MODE === 'development',
  },
  api: {
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
    retries: parseInt(import.meta.env.VITE_API_RETRIES || '3'),
    baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://xmaafgjtzupdndcavjiq.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtYWFmZ2p0enVwZG5kY2F2amlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MTg3MjYsImV4cCI6MjA2ODQ5NDcyNn0.YdX3lkQCrSSgNmYUOuXGkzglejchbmoB-diZToSIOAw',
  },
  performance: {
    enableMetrics: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
    cacheTimeout: parseInt(import.meta.env.VITE_CACHE_TIMEOUT || '300000'), // 5 minutes
    lazyLoadThreshold: parseInt(import.meta.env.VITE_LAZY_LOAD_THRESHOLD || '100'),
  },
  features: {
    enableExperimentalFeatures: import.meta.env.VITE_ENABLE_EXPERIMENTAL_FEATURES === 'true',
    enableDebugTools: import.meta.env.VITE_ENABLE_DEBUG_TOOLS === 'true' || import.meta.env.MODE === 'development',
    enablePerformanceMonitoring: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true',
  },
};

export default config;

// Helper functions for configuration access
export const isDevelopment = () => config.app.environment === 'development';
export const isProduction = () => config.app.environment === 'production';
export const isDebugEnabled = () => config.app.debug;
export const getApiTimeout = () => config.api.timeout;
export const shouldEnableMetrics = () => config.performance.enableMetrics;
