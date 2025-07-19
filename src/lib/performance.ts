// Performance optimization utilities for Leasy
import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// Memoization utility for expensive duplicate detection operations
export function useMemoizedDuplicateDetection<T>(
  dependencies: any[],
  computeFunction: () => T
): T {
  return useMemo(computeFunction, dependencies);
}

// Debounced callback hook for search and filtering
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

// Throttled function for scroll events and rapid user interactions
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      }
    }) as T,
    [delay]
  );
}

// Concurrent media processing with rate limiting
export class ConcurrencyLimiter {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.process();
    });
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const task = this.queue.shift()!;

    try {
      await task();
    } finally {
      this.running--;
      this.process(); // Process next task
    }
  }

  getStats() {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Memory-efficient batch processing for large datasets
export async function* processBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): AsyncGenerator<R[], void, unknown> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    yield await processor(batch);
  }
}

// Performance monitoring hook
export function usePerformanceMonitor(name: string) {
  const startTimeRef = useRef<number>();

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const end = useCallback(() => {
    if (startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      
      // Send to analytics in production
      if (process.env.NODE_ENV === 'production') {
        // Analytics integration would go here
      }
      
      return duration;
    }
    return 0;
  }, [name]);

  return { start, end };
}

// Optimized image loading with preloading
export function useImagePreloader(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const preloadImage = useCallback((url: string) => {
    if (loadedImages.has(url) || loadingImages.has(url)) {
      return Promise.resolve();
    }

    setLoadingImages(prev => new Set(prev).add(url));

    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(url));
        setLoadingImages(prev => {
          const next = new Set(prev);
          next.delete(url);
          return next;
        });
        resolve();
      };
      img.onerror = () => {
        setLoadingImages(prev => {
          const next = new Set(prev);
          next.delete(url);
          return next;
        });
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });
  }, [loadedImages, loadingImages]);

  const preloadImages = useCallback(async (imagesToLoad: string[] = urls) => {
    const promises = imagesToLoad.map(url => preloadImage(url));
    return Promise.allSettled(promises);
  }, [urls, preloadImage]);

  useEffect(() => {
    if (urls.length > 0) {
      preloadImages();
    }
  }, [urls, preloadImages]);

  return {
    loadedImages: Array.from(loadedImages),
    loadingImages: Array.from(loadingImages),
    preloadImage,
    preloadImages,
    isLoaded: (url: string) => loadedImages.has(url),
    isLoading: (url: string) => loadingImages.has(url)
  };
}

// Efficient virtual scrolling for large lists
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  const offsetY = visibleStart * itemHeight;
  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    offsetY,
    totalHeight,
    visibleStart,
    visibleEnd,
    setScrollTop
  };
}

export default {
  ConcurrencyLimiter,
  processBatches,
  useMemoizedDuplicateDetection,
  useDebouncedCallback,
  useThrottledCallback,
  usePerformanceMonitor,
  useImagePreloader,
  useVirtualScrolling
};