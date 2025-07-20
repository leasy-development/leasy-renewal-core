
// Production monitoring utilities
export class ProductionMonitoring {
  private static instance: ProductionMonitoring;
  private metricsBuffer: Array<{ name: string; value: number; timestamp: number }> = [];

  static getInstance(): ProductionMonitoring {
    if (!ProductionMonitoring.instance) {
      ProductionMonitoring.instance = new ProductionMonitoring();
    }
    return ProductionMonitoring.instance;
  }

  // Performance monitoring
  trackPerformance(name: string, startTime: number) {
    const duration = performance.now() - startTime;
    this.addMetric(`performance.${name}`, duration);
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration}ms`);
    }
  }

  // User interaction tracking
  trackUserAction(action: string, category: string = 'user') {
    this.addMetric(`${category}.${action}`, 1);
  }

  // Error tracking
  trackError(error: Error, context?: string) {
    this.addMetric('errors.count', 1);
    
    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorToService(error, context);
    }
  }

  // Resource usage monitoring
  trackResourceUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.addMetric('memory.used', memory.usedJSHeapSize);
      this.addMetric('memory.total', memory.totalJSHeapSize);
    }

    // Network status
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.addMetric('network.downlink', connection.downlink);
      this.addMetric('network.rtt', connection.rtt);
    }
  }

  private addMetric(name: string, value: number) {
    this.metricsBuffer.push({
      name,
      value,
      timestamp: Date.now(),
    });

    // Flush buffer when it gets too large
    if (this.metricsBuffer.length > 100) {
      this.flushMetrics();
    }
  }

  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      // Send metrics to analytics service
      if (process.env.NODE_ENV === 'production') {
        await this.sendMetricsToService(metrics);
      }
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }

  private async sendMetricsToService(metrics: Array<{ name: string; value: number; timestamp: number }>) {
    // Implementation for sending metrics to external service
    // This could be Google Analytics, Mixpanel, or custom analytics
    console.log('Sending metrics:', metrics);
  }

  private async sendErrorToService(error: Error, context?: string) {
    // Implementation for sending errors to external service
    // This could be Sentry, LogRocket, or custom error tracking
    console.error('Sending error:', error, context);
  }

  // Health check
  async performHealthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; checks: Record<string, boolean> }> {
    const checks = {
      localStorage: this.checkLocalStorage(),
      supabase: await this.checkSupabaseConnection(),
      performance: this.checkPerformance(),
    };

    const allHealthy = Object.values(checks).every(Boolean);
    const someHealthy = Object.values(checks).some(Boolean);

    return {
      status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
      checks,
    };
  }

  private checkLocalStorage(): boolean {
    try {
      localStorage.setItem('health-check', 'test');
      localStorage.removeItem('health-check');
      return true;
    } catch {
      return false;
    }
  }

  private async checkSupabaseConnection(): Promise<boolean> {
    try {
      // Simple connection test
      const response = await fetch('/api/health');
      return response.ok;
    } catch {
      return false;
    }
  }

  private checkPerformance(): boolean {
    // Check if performance metrics are available
    return 'performance' in window && 'mark' in performance;
  }
}

export const monitoring = ProductionMonitoring.getInstance();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    monitoring.trackResourceUsage();
  }, 30000); // Every 30 seconds
}
