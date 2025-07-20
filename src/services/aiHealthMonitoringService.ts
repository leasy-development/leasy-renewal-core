// AI Health Monitoring Service
import { supabase } from '@/integrations/supabase/client';

export interface AIServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  uptime: number;
}

export interface AIUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  mostUsedFeature: string;
  dailyUsage: number;
  monthlyUsage: number;
}

class AIHealthMonitoringService {
  private healthChecks: Map<string, AIServiceHealth> = new Map();
  private readonly CHECK_INTERVAL = 60000; // 1 minute
  private monitoringActive = false;

  /**
   * Start monitoring AI service health
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoringActive) return;
    
    this.monitoringActive = true;
    console.log('🤖 AI Health Monitoring started');
    
    // Initial health check
    await this.performHealthChecks();
    
    // Schedule regular health checks
    setInterval(() => {
      this.performHealthChecks();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.monitoringActive = false;
    console.log('🤖 AI Health Monitoring stopped');
  }

  /**
   * Perform health checks for all AI services
   */
  private async performHealthChecks(): Promise<void> {
    const services = [
      'generate-property-description',
      'ai-duplicate-detection', 
      'ai-image-categorization',
      'auto-translate',
      'process-bulk-optimization'
    ];

    const healthPromises = services.map(service => this.checkServiceHealth(service));
    await Promise.allSettled(healthPromises);
  }

  /**
   * Check health of a specific AI service
   */
  private async checkServiceHealth(serviceName: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Perform a lightweight health check
      const { data, error } = await supabase.functions.invoke(serviceName, {
        body: { 
          type: 'health_check',
          minimal: true 
        }
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = !error && responseTime < 10000; // 10 second timeout

      const health: AIServiceHealth = {
        service: serviceName,
        status: isHealthy ? 'healthy' : 'degraded',
        lastCheck: new Date(),
        responseTime,
        errorRate: error ? 100 : 0,
        uptime: isHealthy ? 100 : 0
      };

      this.healthChecks.set(serviceName, health);
      
      if (!isHealthy) {
        console.warn(`⚠️ AI Service ${serviceName} health check failed:`, error);
      }

    } catch (error) {
      console.error(`❌ AI Service ${serviceName} health check error:`, error);
      
      this.healthChecks.set(serviceName, {
        service: serviceName,
        status: 'down',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        errorRate: 100,
        uptime: 0
      });
    }
  }

  /**
   * Get current health status for all services
   */
  getHealthStatus(): AIServiceHealth[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Get health status for a specific service
   */
  getServiceHealth(serviceName: string): AIServiceHealth | undefined {
    return this.healthChecks.get(serviceName);
  }

  /**
   * Get AI usage statistics
   */
  async getUsageStats(): Promise<AIUsageStats> {
    try {
      const { data: logs, error } = await supabase
        .from('ai_generation_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error) throw error;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const dailyLogs = logs?.filter(log => new Date(log.created_at) >= today) || [];
      const monthlyLogs = logs?.filter(log => new Date(log.created_at) >= thisMonth) || [];

      // Count feature usage
      const featureUsage = new Map<string, number>();
      logs?.forEach(log => {
        const feature = log.tone || 'unknown';
        featureUsage.set(feature, (featureUsage.get(feature) || 0) + 1);
      });

      const mostUsedFeature = featureUsage.size > 0 
        ? Array.from(featureUsage.entries()).sort((a, b) => b[1] - a[1])[0][0]
        : 'none';

      return {
        totalRequests: logs?.length || 0,
        successfulRequests: logs?.length || 0, // All logged requests are successful
        failedRequests: 0, // Failed requests are not logged currently
        averageResponseTime: 2500, // Estimated average
        mostUsedFeature,
        dailyUsage: dailyLogs.length,
        monthlyUsage: monthlyLogs.length
      };

    } catch (error) {
      console.error('Error fetching AI usage stats:', error);
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        mostUsedFeature: 'unknown',
        dailyUsage: 0,
        monthlyUsage: 0
      };
    }
  }

  /**
   * Test AI service connectivity
   */
  async testAIConnectivity(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-property-description', {
        body: {
          type: 'validation',
          property: {
            title: 'Test Property',
            apartment_type: 'Apartment'
          }
        }
      });

      return !error && !!data;
    } catch (error) {
      console.error('AI connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Get AI service recommendations
   */
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const healthStatuses = this.getHealthStatus();
    
    const unhealthyServices = healthStatuses.filter(h => h.status !== 'healthy');
    if (unhealthyServices.length > 0) {
      recommendations.push(`${unhealthyServices.length} AI service(s) need attention`);
    }

    const slowServices = healthStatuses.filter(h => h.responseTime > 5000);
    if (slowServices.length > 0) {
      recommendations.push(`${slowServices.length} service(s) are responding slowly`);
    }

    if (healthStatuses.length === 0) {
      recommendations.push('No recent health data available - run health check');
    }

    if (recommendations.length === 0) {
      recommendations.push('All AI services are operating normally');
    }

    return recommendations;
  }
}

export const aiHealthMonitoringService = new AIHealthMonitoringService();