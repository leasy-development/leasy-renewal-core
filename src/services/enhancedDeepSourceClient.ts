
import { supabase } from "@/integrations/supabase/client";

export interface BatchFixResponse {
  batch_id: string;
  status: string;
  message: string;
}

export interface BatchStatusResponse {
  id: string;
  repository_id: string;
  issues: any[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  results?: {
    fixed: number;
    failed: number;
    skipped: number;
  };
}

export interface AnalyticsData {
  repository_id: string;
  period_days: number;
  total_issues_processed: number;
  fix_success_rate: number;
  avg_processing_time_ms: number;
  issues_by_category: Record<string, {
    count: number;
    success_rate: number;
  }>;
  daily_stats: Array<{
    date: string;
    issues_processed: number;
    fixes_applied: number;
  }>;
  debug_info?: {
    generated_at: string;
    request_params: any;
    api_key_configured: boolean;
    data_source: string;
    github_integration?: string;
  };
}

export interface ConnectivityTestResult {
  status: string;
  timestamp: string;
  environment: {
    deepsource_api_configured: boolean;
    github_token_configured: boolean;
    webhook_secret_configured: boolean;
  };
  service_info: {
    batch_operations_count: number;
    rate_limit_states: number;
  };
  github_integration?: string;
}

class EnhancedDeepSourceClient {
  private static instance: EnhancedDeepSourceClient;

  static getInstance(): EnhancedDeepSourceClient {
    if (!EnhancedDeepSourceClient.instance) {
      EnhancedDeepSourceClient.instance = new EnhancedDeepSourceClient();
    }
    return EnhancedDeepSourceClient.instance;
  }

  /**
   * Test connectivity and service status
   */
  async testConnectivity(): Promise<ConnectivityTestResult> {
    console.log('Testing enhanced DeepSource connectivity...');
    
    const { data, error } = await supabase.functions.invoke('enhanced-deepsource', {
      body: {
        action: 'test-connectivity'
      },
    });

    if (error) {
      console.error('Connectivity test failed:', error);
      throw error;
    }
    
    console.log('Connectivity test successful:', data);
    return data;
  }

  /**
   * Start a batch fix operation for multiple issues
   */
  async startBatchFix(repositoryId: string, issues: any[]): Promise<BatchFixResponse> {
    console.log('Starting batch fix operation:', { repositoryId, issueCount: issues.length });
    
    const { data, error } = await supabase.functions.invoke('enhanced-deepsource', {
      body: {
        action: 'batch-fix',
        repository_id: repositoryId,
        issues: issues,
      },
    });

    if (error) {
      console.error('Batch fix failed:', error);
      throw error;
    }
    
    console.log('Batch fix started:', data);
    return data;
  }

  /**
   * Get the status of a batch operation
   */
  async getBatchStatus(batchId: string): Promise<BatchStatusResponse> {
    console.log('Getting batch status:', batchId);
    
    const { data, error } = await supabase.functions.invoke('enhanced-deepsource', {
      body: { 
        action: 'batch-status',
        batch_id: batchId 
      },
    });

    if (error) {
      console.error('Failed to get batch status:', error);
      throw error;
    }
    
    console.log('Batch status retrieved:', data);
    return data;
  }

  /**
   * Poll batch status until completion
   */
  async waitForBatchCompletion(batchId: string, onProgress?: (status: BatchStatusResponse) => void): Promise<BatchStatusResponse> {
    console.log('Waiting for batch completion:', batchId);
    
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const status = await this.getBatchStatus(batchId);
          
          if (onProgress) {
            onProgress(status);
          }
          
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            console.log('Batch operation completed:', status);
            resolve(status);
          }
        } catch (error) {
          clearInterval(pollInterval);
          console.error('Batch polling failed:', error);
          reject(error);
        }
      }, 2000); // Poll every 2 seconds
      
      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        reject(new Error('Batch operation timed out'));
      }, 600000);
    });
  }

  /**
   * Get analytics data for a repository
   * @param repositoryId - Repository identifier (e.g., "owner/repo" or "demo-repo-1")
   * @param days - Number of days to include in analytics (default: 30)
   */
  async getAnalytics(repositoryId: string = 'demo-repo-1', days = 30): Promise<AnalyticsData> {
    console.log('Getting analytics data:', { repositoryId, days });
    
    const { data, error } = await supabase.functions.invoke('enhanced-deepsource', {
      body: { 
        action: 'analytics',
        repository_id: repositoryId, 
        days 
      },
    });

    if (error) {
      console.error('Failed to get analytics:', error);
      throw error;
    }
    
    console.log('Analytics data retrieved:', data);
    return data;
  }

  /**
   * Register webhook endpoint (for documentation purposes)
   */
  getWebhookUrl(): string {
    return `https://xmaafgjtzupdndcavjiq.supabase.co/functions/v1/enhanced-deepsource/webhook`;
  }

  /**
   * Check if GitHub integration is available
   */
  isGitHubIntegrationAvailable(): boolean {
    return false; // GitHub integration has been disabled
  }

  /**
   * Get GitHub integration status message
   */
  getGitHubIntegrationStatus(): string {
    return 'GitHub integration is disabled. The GitHub token has been removed from the configuration.';
  }
}

export const enhancedDeepSourceClient = EnhancedDeepSourceClient.getInstance();
