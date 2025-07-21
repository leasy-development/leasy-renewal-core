
// Performance monitoring type definitions
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactiveTime: number;
  memoryUsage?: number;
  bundleSize?: number;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export interface LoadingState {
  isLoading: boolean;
  isError: boolean;
  error?: AppError;
  progress?: number;
}
