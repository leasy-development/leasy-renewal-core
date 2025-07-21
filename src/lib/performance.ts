// Performance monitoring and optimization utilities
import { PerformanceMetrics, CacheEntry } from '@/types/performance';
import config from './config';
import * as React from 'react';

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private cache = new Map<string, CacheEntry>();

  startMeasurement(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (config.performance.enableMetrics) {
        console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
        this.recordMetric({
          loadTime: duration,
          renderTime: duration,
          interactiveTime: duration,
        });
      }
    };
  }

  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  // Cache management
  setCache<T>(key: string, data: T, ttl: number = config.performance.cacheTimeout): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key,
    });
  }

  getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Performance-aware component wrapper
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => {
    const endMeasurement = performanceMonitor.startMeasurement(`Render: ${componentName}`);
    
    React.useEffect(() => {
      endMeasurement();
    });

    return <Component {...props} />;
  });
};

// Lazy loading utilities
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  componentName: string
) => {
  return React.lazy(async () => {
    const endMeasurement = performanceMonitor.startMeasurement(`Lazy Load: ${componentName}`);
    
    try {
      const module = await importFunc();
      endMeasurement();
      return module;
    } catch (error) {
      endMeasurement();
      throw error;
    }
  });
};

// Image optimization utilities
export const createOptimizedImageLoader = () => {
  const loadedImages = new Set<string>();
  
  return {
    preloadImage: (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (loadedImages.has(src)) {
          resolve();
          return;
        }
        
        const img = new Image();
        img.onload = () => {
          loadedImages.add(src);
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    },
    
    isImageLoaded: (src: string): boolean => {
      return loadedImages.has(src);
    },
  };
};

export const imageLoader = createOptimizedImageLoader();
