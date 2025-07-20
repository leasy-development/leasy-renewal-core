
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
   * Start a batch fix operation for multiple issues
   */
  async startBatchFix(repositoryId: string, issues: any[]): Promise<BatchFixResponse> {
    const { data, error } = await supabase.functions.invoke('enhanced-deepsource/batch-fix', {
      body: {
        repository_id: repositoryId,
        issues: issues,
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get the status of a batch operation
   */
  async getBatchStatus(batchId: string): Promise<BatchStatusResponse> {
    const { data, error } = await supabase.functions.invoke('enhanced-deepsource/batch-status', {
      body: { batch_id: batchId },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Poll batch status until completion
   */
  async waitForBatchCompletion(batchId: string, onProgress?: (status: BatchStatusResponse) => void): Promise<BatchStatusResponse> {
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const status = await this.getBatchStatus(batchId);
          
          if (onProgress) {
            onProgress(status);
          }
          
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            resolve(status);
          }
        } catch (error) {
          clearInterval(pollInterval);
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
        const { data, error } = await supabase.functions.invoke('enhanced-deepsource/create-branch', {
          body: { owner, repo, branch_name: branchName, base_branch: baseBranch },
        });

        if (error) throw error;
        return data;
      },

      commitFix: async (owner: string, repo: string, branch: string, filePath: string, content: string, message: string) => {
        const { data, error } = await supabase.functions.invoke('enhanced-deepsource/commit-fix', {
          body: { owner, repo, branch, file_path: filePath, content, message },
        });

        if (error) throw error;
        return data;
      },

      createPullRequest: async (owner: string, repo: string, head: string, base: string, title: string, body: string) => {
        const { data, error } = await supabase.functions.invoke('enhanced-deepsource/create-pr', {
          body: { owner, repo, head, base, title, body },
        });

        if (error) throw error;
        return data.pull_request_url;
      },
    };
  }

  /**
   * Get analytics data for a repository
   */
  async getAnalytics(repositoryId: string, days = 30): Promise<AnalyticsData> {
    const { data, error } = await supabase.functions.invoke('enhanced-deepsource/analytics', {
      body: { repository_id: repositoryId, days },
    });

    if (error) throw error;
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
