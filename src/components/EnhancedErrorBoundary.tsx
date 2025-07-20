import React, { Component, ReactNode } from 'react';
import { cacheManager } from '@/lib/cacheManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Trash2, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  isRecovering: boolean;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private recoveryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 React Error Boundary caught error:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    // Temporarily disable automatic recovery to prevent infinite reloads
    // this.attemptAutomaticRecovery(error);
    
    // Log error details for debugging
    this.logErrorDetails(error, errorInfo);
  }

  private async attemptAutomaticRecovery(error: Error): Promise<void> {
    if (this.state.retryCount >= this.maxRetries) {
      console.log('🛑 Max retry attempts reached, stopping automatic recovery');
      return;
    }

    // Check if this looks like a cache-related error
    const cacheErrorIndicators = [
      'Cannot read properties of null',
      'QueryClientProvider',
      'useEffect',
      'Invalid hook call',
      'React is not defined',
      'TypeError: Cannot read',
      'ReferenceError'
    ];

    const isCacheError = cacheErrorIndicators.some(indicator => 
      error.message.includes(indicator) || error.stack?.includes(indicator)
    );

    if (isCacheError) {
      console.log('🔄 Attempting automatic cache recovery...');
      
      this.setState({ isRecovering: true });
      
      try {
        // Try to handle the error with cache manager
        const recovered = await cacheManager.handleReactError(error);
        
        if (!recovered) {
          // If cache manager didn't handle it, try manual recovery
          await this.manualCacheRecovery();
        }
      } catch (recoveryError) {
        console.error('❌ Automatic recovery failed:', recoveryError);
        this.setState({ isRecovering: false });
      }
    }
  }

  private async manualCacheRecovery(): Promise<void> {
    this.setState(prevState => ({ 
      retryCount: prevState.retryCount + 1,
      isRecovering: true 
    }));

    // Wait a bit before attempting recovery
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      await cacheManager.clearAllCaches();
      
      // Reset component state and retry
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false
      });
      
      console.log('✅ Manual cache recovery completed');
    } catch (error) {
      console.error('❌ Manual cache recovery failed:', error);
      this.setState({ isRecovering: false });
    }
  }

  private logErrorDetails(error: Error, errorInfo: React.ErrorInfo): void {
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    };

    // Log to console for development
    console.group('🐛 Error Report');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Full Report:', errorReport);
    console.groupEnd();

    // Store in localStorage for debugging
    try {
      const existingReports = JSON.parse(localStorage.getItem('error-reports') || '[]');
      existingReports.push(errorReport);
      
      // Keep only last 10 reports
      if (existingReports.length > 10) {
        existingReports.splice(0, existingReports.length - 10);
      }
      
      localStorage.setItem('error-reports', JSON.stringify(existingReports));
    } catch (storageError) {
      console.warn('Failed to store error report:', storageError);
    }
  }

  private handleManualRetry = async (): Promise<void> => {
    console.log('🔄 Manual retry initiated');
    
    this.setState({ isRecovering: true });
    
    try {
      await cacheManager.clearAllCaches();
      
      // Reset state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: 0,
        isRecovering: false
      });
    } catch (error) {
      console.error('❌ Manual retry failed:', error);
      this.setState({ isRecovering: false });
    }
  };

  private handleHardRefresh = (): void => {
    console.log('🔄 Hard refresh initiated');
    
    // Clear caches and force reload
    cacheManager.clearAllCaches().finally(() => {
      window.location.href = window.location.href;
    });
  };

  private copyErrorReport = (): void => {
    const errorReport = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => console.log('✅ Error report copied to clipboard'))
      .catch(() => console.warn('❌ Failed to copy error report'));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Application Error</CardTitle>
              </div>
              <CardDescription>
                Something went wrong. This might be due to cached data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.isRecovering && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Attempting recovery...
                </div>
              )}
              
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">Error Details:</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {this.state.error?.message || 'Unknown error occurred'}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={this.handleManualRetry}
                  disabled={this.state.isRecovering}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Cache & Retry
                </Button>
                
                <Button 
                  onClick={this.handleHardRefresh}
                  variant="outline"
                  disabled={this.state.isRecovering}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hard Refresh
                </Button>
                
                <Button 
                  onClick={this.copyErrorReport}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Copy Error Report
                </Button>
              </div>

              {this.state.retryCount > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Recovery attempts: {this.state.retryCount}/{this.maxRetries}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Development helper to view error reports
if (typeof window !== 'undefined') {
  (window as any).getErrorReports = () => {
    try {
      return JSON.parse(localStorage.getItem('error-reports') || '[]');
    } catch {
      return [];
    }
  };
  
  (window as any).clearErrorReports = () => {
    localStorage.removeItem('error-reports');
    console.log('✅ Error reports cleared');
  };
}
