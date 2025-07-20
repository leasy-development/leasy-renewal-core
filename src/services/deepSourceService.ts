
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

class DeepSourceService {
  private baseUrl = 'https://deepsource.io/api/v1';

  /**
   * Fetch all repositories from DeepSource
   */
  async getRepositories(): Promise<DeepSourceRepository[]> {
    try {
      const { data } = await supabase.functions.invoke('deepsource-api', {
        body: { action: 'get_repositories' }
      });
      
      return data?.repositories || [];
    } catch (error) {
      console.error('Failed to fetch DeepSource repositories:', error);
      throw error;
    }
  }

  /**
   * Fetch issues for a specific repository
   */
  async getRepositoryIssues(repositoryId: string): Promise<DeepSourceIssue[]> {
    try {
      const { data } = await supabase.functions.invoke('deepsource-api', {
        body: { 
          action: 'get_issues',
          repository_id: repositoryId
        }
      });
      
      return this.transformIssues(data?.issues || []);
    } catch (error) {
      console.error('Failed to fetch DeepSource issues:', error);
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

  /**
   * Map DeepSource categories to our categories
   */
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

  /**
   * Map DeepSource severity to our severity levels
   */
  private mapSeverity(severity: string): DeepSourceIssue['severity'] {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'critical';
      case 'major': return 'major';
      case 'minor': return 'minor';
      default: return 'minor';
    }
  }

  /**
   * Check if an issue can be automatically fixed
   */
  private isAutoFixable(issueCode: string): boolean {
    const autoFixableCodes = [
      'JS-0002', // Unused imports
      'JS-0125', // Missing semicolons
      'JS-0128', // Prefer const over let
      'JS-0240', // Missing React keys
      'JS-0241', // Unnecessary React fragments
      'TS-0024', // Unused variables
      'STY-001', // Code formatting
      'STY-002', // Spacing issues
    ];
    
    return autoFixableCodes.includes(issueCode);
  }

  /**
   * Apply automatic fix for supported issue types
   */
  async applyAutoFix(issue: DeepSourceIssue): Promise<boolean> {
    try {
      const { data } = await supabase.functions.invoke('deepsource-autofix', {
        body: { 
          issue: issue,
          file_path: issue.file_path,
          line_number: issue.line_number
        }
      });
      
      return data?.success || false;
    } catch (error) {
      console.error('Failed to apply auto-fix:', error);
      return false;
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
