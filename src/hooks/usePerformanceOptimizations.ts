
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Performance optimization hook
export function usePerformanceOptimizations() {
  const queryClient = useQueryClient();

  // Preload critical resources
  const preloadCriticalResources = useCallback(() => {
    // Preload fonts
    const fontLinks = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    ];

    fontLinks.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      document.head.appendChild(link);
    });

    // Preload critical CSS
    const criticalCSS = document.querySelector('style[data-critical]');
    if (criticalCSS) {
      criticalCSS.setAttribute('data-preloaded', 'true');
    }
  }, []);

  // Optimize React Query cache
  const optimizeQueryCache = useCallback(() => {
    // Set up global defaults for better performance
    queryClient.setDefaultOptions({
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    });

    // Clean up old cache entries periodically
    const cleanupCache = () => {
      queryClient.clear();
    };

    // Set up cleanup interval (every 30 minutes)
    const intervalId = setInterval(cleanupCache, 30 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [queryClient]);

  // Image lazy loading optimization
  const optimizeImages = useCallback(() => {
    if ('loading' in HTMLImageElement.prototype) {
      // Native lazy loading is supported
      const images = document.querySelectorAll('img[data-lazy]');
      images.forEach(img => {
        img.setAttribute('loading', 'lazy');
      });
    } else {
      // Fallback for browsers without native lazy loading
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.getAttribute('data-src');
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      const images = document.querySelectorAll('img[data-src]');
      images.forEach(img => imageObserver.observe(img));

      return () => imageObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    preloadCriticalResources();
    const cleanupCache = optimizeQueryCache();
    const cleanupImages = optimizeImages();

    return () => {
      cleanupCache?.();
      cleanupImages?.();
    };
  }, [preloadCriticalResources, optimizeQueryCache, optimizeImages]);

  return {
    preloadCriticalResources,
    optimizeQueryCache,
    optimizeImages,
  };
}
