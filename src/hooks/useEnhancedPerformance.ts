
import { useState, useEffect, useCallback, useRef } from 'react';
import { performanceMonitor } from '@/lib/performance';
import { PerformanceMetrics, LoadingState } from '@/types/performance';

export const usePerformanceTracking = (componentName: string) => {
  const renderStartTime = useRef(performance.now());
  
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    performanceMonitor.recordMetric({
      loadTime: renderTime,
      renderTime,
      interactiveTime: renderTime,
    });
  }, []);

  const trackAction = useCallback((actionName: string) => {
    return performanceMonitor.startMeasurement(`${componentName}: ${actionName}`);
  }, [componentName]);

  return { trackAction };
};

export const useOptimizedLoader = <T>(
  loadFunction: () => Promise<T>,
  dependencies: any[] = [],
  cacheKey?: string
) => {
  const [state, setState] = useState<LoadingState & { data?: T }>({
    isLoading: true,
    isError: false,
  });

  const load = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, isError: false, error: undefined }));

    try {
      // Check cache first
      if (cacheKey) {
        const cached = performanceMonitor.getCache<T>(cacheKey);
        if (cached) {
          setState({
            isLoading: false,
            isError: false,
            data: cached,
          });
          return;
        }
      }

      const data = await loadFunction();

      // Cache the result
      if (cacheKey) {
        performanceMonitor.setCache(cacheKey, data);
      }

      setState({
        isLoading: false,
        isError: false,
        data,
      });
    } catch (error) {
      setState({
        isLoading: false,
        isError: true,
        error: {
          code: 'LOAD_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          severity: 'medium',
          context: { cacheKey, dependencies },
          timestamp: new Date(),
        },
      });
    }
  }, dependencies);

  useEffect(() => {
    load();
  }, dependencies);

  return {
    ...state,
    reload: load,
  };
};

export const useImagePreloader = (imageSrcs: string[]) => {
  const [loadedCount, setLoadedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (imageSrcs.length === 0) {
      setIsComplete(true);
      return;
    }

    let mounted = true;
    let loaded = 0;

    const preloadPromises = imageSrcs.map(src => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => {
          if (mounted) {
            loaded++;
            setLoadedCount(loaded);
            if (loaded === imageSrcs.length) {
              setIsComplete(true);
            }
          }
          resolve();
        };
        img.src = src;
      });
    });

    return () => {
      mounted = false;
    };
  }, [imageSrcs]);

  return {
    loadedCount,
    totalCount: imageSrcs.length,
    isComplete,
    progress: imageSrcs.length > 0 ? (loadedCount / imageSrcs.length) * 100 : 100,
  };
};

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          setHasBeenVisible(true);
        }
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return { isVisible, hasBeenVisible };
};
