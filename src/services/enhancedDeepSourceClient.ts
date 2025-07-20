
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

export interface GitHubIntegration {
  createBranch: (owner: string, repo: string, branchName: string, baseBranch?: string) => Promise<void>;
  commitFix: (owner: string, repo: string, branch: string, filePath: string, content: string, message: string) => Promise<void>;
  createPullRequest: (owner: string, repo: string, head: string, base: string, title: string, body: string) => Promise<string>;
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
   * GitHub integration methods
   */
  get github(): GitHubIntegration {
    return {
      createBranch: async (owner: string, repo: string, branchName: string, baseBranch = 'main') => {
        console.log('Creating GitHub branch:', { owner, repo, branchName, baseBranch });
        
        const { data, error } = await supabase.functions.invoke('enhanced-deepsource', {
          body: { 
            action: 'create-branch',
            owner, 
            repo, 
            branch_name: branchName, 
            base_branch: baseBranch 
          },
        });

        if (error) {
          console.error('Failed to create branch:', error);
          throw error;
        }
        
        console.log('Branch created successfully:', data);
        return data;
      },

      commitFix: async (owner: string, repo: string, branch: string, filePath: string, content: string, message: string) => {
        console.log('Committing fix:', { owner, repo, branch, filePath, message });
        
        const { data, error } = await supabase.functions.invoke('enhanced-deepsource', {
          body: { 
            action: 'commit-fix',
            owner, 
            repo, 
            branch, 
            file_path: filePath, 
            content, 
            message 
          },
        });

        if (error) {
          console.error('Failed to commit fix:', error);
          throw error;
        }
        
        console.log('Fix committed successfully:', data);
        return data;
      },

      createPullRequest: async (owner: string, repo: string, head: string, base: string, title: string, body: string) => {
        console.log('Creating pull request:', { owner, repo, head, base, title });
        
        const { data, error } = await supabase.functions.invoke('enhanced-deepsource', {
          body: { 
            action: 'create-pr',
            owner, 
            repo, 
            head, 
            base, 
            title, 
            body 
          },
        });

        if (error) {
          console.error('Failed to create pull request:', error);
          throw error;
        }
        
        console.log('Pull request created:', data);
        return data.pull_request_url;
      },
    };
  }

  /**
   * Get analytics data for a repository
   */
  async getAnalytics(repositoryId: string, days = 30): Promise<AnalyticsData> {
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
}

export const enhancedDeepSourceClient = EnhancedDeepSourceClient.getInstance();
