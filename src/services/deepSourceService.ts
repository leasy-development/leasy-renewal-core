import { supabase } from "@/integrations/supabase/client";

export interface DeepSourceIssue {
  id: string;
  title: string;
  description: string;
  category: 'antipattern' | 'bug-risk' | 'coverage' | 'documentation' | 'performance' | 'security' | 'style' | 'typecheck';
  severity: 'critical' | 'major' | 'minor';
  file_path: string;
  line_number: number;
  column_number: number;
  analyzer: string;
  code: string;
  autoFixable: boolean;
  suggestion?: string;
}

export interface DeepSourceRepository {
  id: string;
  name: string;
  full_name: string;
  issues_count: number;
  last_analysis: string;
}

export interface RefreshStatus {
  isRefreshing: boolean;
  progress: number;
  message: string;
  lastUpdated?: Date;
}

export interface AutoFixResult {
  success: boolean;
  message: string;
  changes_applied: string[];
  files_modified: number;
  demo_mode: boolean;
}

class DeepSourceService {
  private baseUrl = 'https://deepsource.io/api/v1';
  private refreshCallbacks: ((status: RefreshStatus) => void)[] = [];

  /**
   * Subscribe to refresh status updates
   */
  onRefreshStatusChange(callback: (status: RefreshStatus) => void) {
    this.refreshCallbacks.push(callback);
    return () => {
      this.refreshCallbacks = this.refreshCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyRefreshStatus(status: RefreshStatus) {
    this.refreshCallbacks.forEach(callback => callback(status));
  }

  /**
   * Test connection to DeepSource API
   */
  async testConnection(): Promise<{ success: boolean; demo_mode: boolean; error?: string }> {
    try {
      const { data } = await supabase.functions.invoke('deepsource-api', {
        body: { action: 'test_connection' }
      });
      
      return data;
    } catch (error) {
      console.error('Failed to test DeepSource connection:', error);
      return { success: false, demo_mode: true, error: 'Connection test failed' };
    }
  }

  /**
   * Fetch all repositories from DeepSource
   */
  async getRepositories(): Promise<DeepSourceRepository[]> {
    try {
      this.notifyRefreshStatus({
        isRefreshing: true,
        progress: 10,
        message: 'Fetching repositories...'
      });

      const { data } = await supabase.functions.invoke('deepsource-api', {
        body: { action: 'get_repositories' }
      });
      
      this.notifyRefreshStatus({
        isRefreshing: false,
        progress: 100,
        message: 'Repositories loaded',
        lastUpdated: new Date()
      });

      return data?.repositories || [];
    } catch (error) {
      console.error('Failed to fetch DeepSource repositories:', error);
      this.notifyRefreshStatus({
        isRefreshing: false,
        progress: 0,
        message: 'Failed to load repositories'
      });
      throw error;
    }
  }

  /**
   * Fetch all issues for a specific repository
   */
  async getRepositoryIssues(repositoryId: string, forceRefresh: boolean = false): Promise<DeepSourceIssue[]> {
    try {
      this.notifyRefreshStatus({
        isRefreshing: true,
        progress: 20,
        message: 'Fetching issues...'
      });

      // Fetch all issues at once (API handles pagination internally)
      const { data } = await supabase.functions.invoke('deepsource-api', {
        body: { 
          action: 'get_issues',
          repository_id: repositoryId,
          page: 1,
          per_page: 10000 // Large number to get all issues
        }
      });

      this.notifyRefreshStatus({
        isRefreshing: true,
        progress: 60,
        message: `Processing ${data?.total_count || data?.issues?.length || 0} issues...`
      });
      
      const transformedIssues = this.transformIssues(data?.issues || []);

      this.notifyRefreshStatus({
        isRefreshing: false,
        progress: 100,
        message: `Loaded ${transformedIssues.length} issues`,
        lastUpdated: new Date()
      });

      return transformedIssues;
    } catch (error) {
      console.error('Failed to fetch DeepSource issues:', error);
      this.notifyRefreshStatus({
        isRefreshing: false,
        progress: 0,
        message: 'Failed to load issues'
      });
      throw error;
    }
  }

  /**
   * Refresh all data for a repository
   */
  async refreshRepository(repositoryId: string): Promise<{
    repositories: DeepSourceRepository[];
    issues: DeepSourceIssue[];
  }> {
    try {
      this.notifyRefreshStatus({
        isRefreshing: true,
        progress: 0,
        message: 'Starting refresh...'
      });

      // Test connection first
      const connectionTest = await this.testConnection();
      
      this.notifyRefreshStatus({
        isRefreshing: true,
        progress: 10,
        message: connectionTest.demo_mode ? 'Using demo data' : 'Connected to DeepSource'
      });

      // Fetch repositories
      const repositories = await this.getRepositories();
      
      this.notifyRefreshStatus({
        isRefreshing: true,
        progress: 40,
        message: 'Fetching latest issues...'
      });

      // Fetch issues
      const issues = await this.getRepositoryIssues(repositoryId, true);

      this.notifyRefreshStatus({
        isRefreshing: false,
        progress: 100,
        message: `Refresh complete - ${issues.length} issues loaded`,
        lastUpdated: new Date()
      });

      return { repositories, issues };
    } catch (error) {
      this.notifyRefreshStatus({
        isRefreshing: false,
        progress: 0,
        message: 'Refresh failed'
      });
      throw error;
    }
  }

  /**
   * Transform DeepSource API response to our issue format
   */
  private transformIssues(apiIssues: any[]): DeepSourceIssue[] {
    return apiIssues.map(issue => ({
      id: issue.occurrence_hash || crypto.randomUUID(),
      title: issue.issue_text || 'Code Quality Issue',
      description: issue.issue_text || '',
      category: this.mapCategory(issue.issue_code),
      severity: this.mapSeverity(issue.severity),
      file_path: issue.location?.path || '',
      line_number: issue.location?.position?.begin?.line || 0,
      column_number: issue.location?.position?.begin?.column || 0,
      analyzer: issue.analyzer || 'unknown',
      code: issue.issue_code || '',
      autoFixable: this.isAutoFixable(issue.issue_code),
      suggestion: issue.suggestion
    }));
  }

  private mapCategory(issueCode: string): DeepSourceIssue['category'] {
    const categoryMap: Record<string, DeepSourceIssue['category']> = {
      'JS-': 'bug-risk',
      'TS-': 'typecheck',
      'SEC-': 'security',
      'PER-': 'performance',
      'STY-': 'style',
      'DOC-': 'documentation',
      'COV-': 'coverage'
    };

    const prefix = Object.keys(categoryMap).find(prefix => issueCode.startsWith(prefix));
    return prefix ? categoryMap[prefix] : 'antipattern';
  }

  private mapSeverity(severity: string): DeepSourceIssue['severity'] {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'critical';
      case 'major': return 'major';
      case 'minor': return 'minor';
      default: return 'minor';
    }
  }

  private isAutoFixable(issueCode: string): boolean {
    const autoFixableCodes = [
      'JS-0002', 'JS-0125', 'JS-0128', 'JS-0240', 'JS-0241',
      'TS-0024', 'STY-001', 'STY-002',
    ];
    
    return autoFixableCodes.includes(issueCode);
  }

  /**
   * Apply automatic fix for supported issue types
   */
  async applyAutoFix(issue: DeepSourceIssue): Promise<AutoFixResult> {
    try {
      const { data } = await supabase.functions.invoke('deepsource-autofix', {
        body: { 
          issue: issue,
          file_path: issue.file_path,
          line_number: issue.line_number
        }
      });
      
      return data || { 
        success: false, 
        message: 'No response received', 
        changes_applied: [], 
        files_modified: 0,
        demo_mode: true
      };
    } catch (error) {
      console.error('Failed to apply auto-fix:', error);
      return { 
        success: false, 
        message: 'Auto-fix failed', 
        changes_applied: [], 
        files_modified: 0,
        demo_mode: true
      };
    }
  }

  /**
   * Get issue statistics
   */
  getIssueStats(issues: DeepSourceIssue[]) {
    return {
      total: issues.length,
      critical: issues.filter(i => i.severity === 'critical').length,
      major: issues.filter(i => i.severity === 'major').length,
      minor: issues.filter(i => i.severity === 'minor').length,
      autoFixable: issues.filter(i => i.autoFixable).length,
      byCategory: issues.reduce((acc, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export const deepSourceService = new DeepSourceService();
