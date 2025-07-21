
import { useState, useCallback, useEffect } from 'react';
import { AppError, NetworkError, ValidationError } from '@/types/errors';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

interface ErrorState {
  errors: AppError[];
  hasError: boolean;
  lastError?: AppError;
}

export const useErrorHandling = () => {
  const [errorState, setErrorState] = useState<ErrorState>({
    errors: [],
    hasError: false,
  });
  const { toast } = useToast();

  const addError = useCallback((error: AppError) => {
    setErrorState(prev => ({
      errors: [...prev.errors, error],
      hasError: true,
      lastError: error,
    }));

    // Log the error
    logger.error('Error occurred', error);

    // Show toast for user-facing errors
    if (error.severity === 'high' || error.severity === 'critical') {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const clearErrors = useCallback(() => {
    setErrorState({
      errors: [],
      hasError: false,
    });
  }, []);

  const removeError = useCallback((errorCode: string) => {
    setErrorState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => error.code !== errorCode),
      hasError: prev.errors.filter(error => error.code !== errorCode).length > 0,
    }));
  }, []);

  const handleNetworkError = useCallback((error: any, context?: Record<string, any>): NetworkError => {
    const networkError: NetworkError = {
      code: 'NETWORK_ERROR',
      message: error.message || 'Network request failed',
      severity: 'medium',
      context,
      timestamp: new Date(),
      status: error.status,
      url: error.url,
      method: error.method,
    };

    addError(networkError);
    return networkError;
  }, [addError]);

  const handleValidationError = useCallback((field: string, message: string): ValidationError => {
    const validationError: ValidationError = {
      field,
      code: `VALIDATION_${field.toUpperCase()}`,
      message,
    };

    const appError: AppError = {
      code: validationError.code,
      message: validationError.message,
      severity: 'low',
      context: { field },
      timestamp: new Date(),
    };

    addError(appError);
    return validationError;
  }, [addError]);

  const retryOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          handleNetworkError(error, { attempt, maxRetries });
          throw error;
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }

    throw lastError;
  }, [handleNetworkError]);

  return {
    ...errorState,
    addError,
    clearErrors,
    removeError,
    handleNetworkError,
    handleValidationError,
    retryOperation,
  };
};

export const useAsyncError = () => {
  const [error, setError] = useState<Error | null>(null);

  const throwError = useCallback((error: Error) => {
    setError(error);
    throw error;
  }, []);

  useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return throwError;
};

export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorHandler?: (error: Error, errorInfo: React.ErrorInfo) => void
) => {
  return class extends React.Component<P, { hasError: boolean }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      logger.error('Component error boundary caught error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });

      if (errorHandler) {
        errorHandler(error, errorInfo);
      }
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="p-4 border border-destructive rounded-md bg-destructive/10">
            <h2 className="text-lg font-semibold text-destructive">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mt-2">
              An error occurred while rendering this component. Please try refreshing the page.
            </p>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
};
