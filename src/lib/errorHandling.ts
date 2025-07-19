// Enhanced error handling and logging for Leasy
import { logger } from './logger';
import React, { useEffect } from 'react';

// Global error types
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'validation' | 'network' | 'upload' | 'duplicate_detection' | 'media_processing' | 'authentication' | 'database' | 'unknown';

export interface EnhancedError {
  id: string;
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: Date;
  context?: Record<string, any>;
  stackTrace?: string;
  userAction?: string;
  recoverable: boolean;
}

// Error handler class with retry logic and fallback handling
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: EnhancedError[] = [];
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle and log errors with automatic categorization
  async handleError(
    error: Error | string,
    category: ErrorCategory = 'unknown',
    context?: Record<string, any>,
    userAction?: string
  ): Promise<EnhancedError> {
    const enhancedError: EnhancedError = {
      id: this.generateErrorId(),
      message: typeof error === 'string' ? error : error.message,
      severity: this.categorizeSeverity(error, category),
      category,
      timestamp: new Date(),
      context,
      stackTrace: error instanceof Error ? error.stack : undefined,
      userAction,
      recoverable: this.isRecoverable(category, error)
    };

    // Log the error
    this.logError(enhancedError);

    // Queue for batch reporting
    this.errorQueue.push(enhancedError);

    // Send to external service if in production
    if (process.env.NODE_ENV === 'production') {
      await this.reportError(enhancedError);
    }

    return enhancedError;
  }

  // Retry mechanism for failed operations
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries = this.maxRetries,
    delay = this.retryDelay,
    context?: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === retries) {
          await this.handleError(
            lastError,
            'network',
            { attempts: attempt, context },
            'retry_failed'
          );
          throw lastError;
        }

        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        logger.warn(`Attempt ${attempt} failed, retrying in ${waitTime}ms:`, lastError.message);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError!;
  }

  // Graceful fallback handling
  async withFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    errorCategory: ErrorCategory = 'unknown'
  ): Promise<T> {
    try {
      return await primaryOperation();
    } catch (primaryError) {
      await this.handleError(
        primaryError instanceof Error ? primaryError : new Error(String(primaryError)),
        errorCategory,
        { fallback_used: true },
        'fallback_triggered'
      );

      try {
        return await fallbackOperation();
      } catch (fallbackError) {
        await this.handleError(
          fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)),
          errorCategory,
          { primary_error: primaryError, fallback_failed: true },
          'fallback_failed'
        );
        throw fallbackError;
      }
    }
  }

  // Circuit breaker pattern for failing services
  private failureCount = new Map<string, number>();
  private circuitState = new Map<string, 'closed' | 'open' | 'half-open'>();
  private lastFailureTime = new Map<string, number>();

  async withCircuitBreaker<T>(
    operation: () => Promise<T>,
    serviceName: string,
    failureThreshold = 5,
    timeoutMs = 60000
  ): Promise<T> {
    const state = this.circuitState.get(serviceName) || 'closed';
    const failures = this.failureCount.get(serviceName) || 0;
    const lastFailure = this.lastFailureTime.get(serviceName) || 0;

    // Check if circuit should be closed again
    if (state === 'open' && Date.now() - lastFailure > timeoutMs) {
      this.circuitState.set(serviceName, 'half-open');
    }

    // Reject if circuit is open
    if (state === 'open') {
      throw new Error(`Service ${serviceName} is currently unavailable (circuit breaker open)`);
    }

    try {
      const result = await operation();
      
      // Reset on success
      if (state === 'half-open') {
        this.circuitState.set(serviceName, 'closed');
        this.failureCount.set(serviceName, 0);
      }

      return result;
    } catch (error) {
      const newFailures = failures + 1;
      this.failureCount.set(serviceName, newFailures);
      this.lastFailureTime.set(serviceName, Date.now());

      if (newFailures >= failureThreshold) {
        this.circuitState.set(serviceName, 'open');
        await this.handleError(
          new Error(`Circuit breaker opened for ${serviceName}`),
          'network',
          { failures: newFailures, threshold: failureThreshold },
          'circuit_breaker_open'
        );
      }

      throw error;
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private categorizeSeverity(error: Error | string, category: ErrorCategory): ErrorSeverity {
    const message = typeof error === 'string' ? error : error.message;
    
    // Critical errors
    if (category === 'authentication' || message.includes('authentication')) return 'critical';
    if (category === 'database' || message.includes('database')) return 'critical';
    if (message.includes('network') && message.includes('timeout')) return 'high';
    
    // High severity
    if (category === 'upload' && message.includes('failed')) return 'high';
    if (category === 'media_processing' && message.includes('corrupt')) return 'high';
    
    // Medium severity
    if (category === 'validation') return 'medium';
    if (category === 'duplicate_detection') return 'medium';
    
    // Default to low
    return 'low';
  }

  private isRecoverable(category: ErrorCategory, error: Error | string): boolean {
    const message = typeof error === 'string' ? error : error.message;
    
    // Non-recoverable errors
    if (category === 'authentication') return false;
    if (message.includes('permission denied')) return false;
    if (message.includes('not found')) return false;
    
    // Recoverable errors
    if (category === 'network') return true;
    if (category === 'upload') return true;
    if (message.includes('timeout')) return true;
    
    return true;
  }

  private logError(error: EnhancedError): void {
    const logMessage = `[${error.severity.toUpperCase()}] ${error.category}: ${error.message}`;
    
    switch (error.severity) {
      case 'critical':
        logger.error(logMessage, error);
        break;
      case 'high':
        logger.error(logMessage, error);
        break;
      case 'medium':
        logger.warn(logMessage, error);
        break;
      case 'low':
        logger.info(logMessage, error);
        break;
    }
  }

  private async reportError(error: EnhancedError): Promise<void> {
    try {
      // In a real implementation, this would send to an external service like Sentry
      // For now, we'll just log it
      console.error('Reporting error to external service:', error);
      
      // Example integration with Sentry or LogRocket would go here:
      // Sentry.captureException(error);
      // LogRocket.captureException(error);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  // Get error statistics for monitoring
  getErrorStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    recent: EnhancedError[];
  } {
    const bySeverity = this.errorQueue.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    const byCategory = this.errorQueue.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    const recent = this.errorQueue
      .filter(error => Date.now() - error.timestamp.getTime() < 3600000) // Last hour
      .slice(-10); // Last 10 errors

    return {
      total: this.errorQueue.length,
      bySeverity,
      byCategory,
      recent
    };
  }

  // Clear old errors to prevent memory leaks
  cleanup(): void {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    this.errorQueue = this.errorQueue.filter(
      error => error.timestamp.getTime() > oneWeekAgo
    );
  }
}

// Global error boundary hook
export function useErrorBoundary() {
  const errorHandler = ErrorHandler.getInstance();

  const reportError = async (
    error: Error | string,
    category: ErrorCategory = 'unknown',
    context?: Record<string, any>
  ) => {
    return await errorHandler.handleError(error, category, context);
  };

  const retryOperation = async <T>(
    operation: () => Promise<T>,
    retries?: number,
    context?: string
  ) => {
    return await errorHandler.retryWithBackoff(operation, retries, undefined, context);
  };

  const withFallback = async <T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    category?: ErrorCategory
  ) => {
    return await errorHandler.withFallback(primary, fallback, category);
  };

  return {
    reportError,
    retryOperation,
    withFallback,
    getStats: () => errorHandler.getErrorStats()
  };
}

// HOC for wrapping components with error handling
export function withErrorHandling<P extends Record<string, any>>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    const { reportError } = useErrorBoundary();

    useEffect(() => {
      const handleUnhandledError = (event: ErrorEvent) => {
        reportError(event.error, 'unknown', {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      };

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        reportError(event.reason, 'unknown', {
          type: 'unhandled_promise_rejection'
        });
      };

      window.addEventListener('error', handleUnhandledError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleUnhandledError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }, [reportError]);

    return React.createElement(Component, props);
  };
}

export default ErrorHandler;