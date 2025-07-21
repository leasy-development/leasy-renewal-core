
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePerformanceTracking, useDebounce, useOptimizedLoader } from '@/hooks/useEnhancedPerformance';

// Mock performance API
const mockPerformanceNow = vi.fn();
Object.defineProperty(global.performance, 'now', {
  value: mockPerformanceNow,
});

describe('usePerformanceTracking', () => {
  beforeEach(() => {
    mockPerformanceNow.mockReturnValue(100);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should track component performance', () => {
    const { result } = renderHook(() => usePerformanceTracking('TestComponent'));
    
    expect(result.current.trackAction).toBeDefined();
    expect(typeof result.current.trackAction).toBe('function');
  });

  it('should return a function from trackAction', () => {
    const { result } = renderHook(() => usePerformanceTracking('TestComponent'));
    
    const endMeasurement = result.current.trackAction('testAction');
    expect(typeof endMeasurement).toBe('function');
  });
});

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('updated');
  });

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    rerender({ value: 'first', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    rerender({ value: 'second', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('second');
  });
});

describe('useOptimizedLoader', () => {
  it('should handle successful loading', async () => {
    const mockLoadFunction = vi.fn().mockResolvedValue('test data');
    
    const { result } = renderHook(() => 
      useOptimizedLoader(mockLoadFunction, [], 'test-key')
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBe('test data');
    expect(mockLoadFunction).toHaveBeenCalledTimes(1);
  });

  it('should handle loading errors', async () => {
    const mockError = new Error('Load failed');
    const mockLoadFunction = vi.fn().mockRejectedValue(mockError);
    
    const { result } = renderHook(() => 
      useOptimizedLoader(mockLoadFunction, [], 'test-key')
    );

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Load failed');
  });

  it('should provide reload functionality', async () => {
    const mockLoadFunction = vi.fn().mockResolvedValue('test data');
    
    const { result } = renderHook(() => 
      useOptimizedLoader(mockLoadFunction, [], 'test-key')
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockLoadFunction).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.reload();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockLoadFunction).toHaveBeenCalledTimes(2);
  });
});
