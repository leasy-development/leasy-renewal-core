
export interface WebhookPayload {
  repository: {
    id: string;
    name: string;
    full_name: string;
  };
  analysis: {
    id: string;
    commit_sha: string;
    issues_count: number;
    status: string;
  };
  event_type: 'analysis.completed' | 'analysis.started';
  signature?: string;
}

export interface BatchOperation {
  id: string;
  repository_id: string;
  issues: DeepSourceIssue[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  results?: {
    fixed: number;
    failed: number;
    skipped: number;
  };
}

export interface DeepSourceIssue {
  occurrence_hash: string;
  issue_text: string;
  issue_code: string;
  severity: string;
  location: {
    path: string;
    position: {
      begin: {
        line: number;
        column: number;
      };
    };
  };
  analyzer: string;
}

export interface GitHubCommitRequest {
  owner: string;
  repo: string;
  branch: string;
  file_path: string;
  content: string;
  message: string;
}

export interface PullRequestRequest {
  owner: string;
  repo: string;
  head: string;
  base: string;
  title: string;
  body: string;
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
