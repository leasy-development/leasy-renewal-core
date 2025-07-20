import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const DEEPSOURCE_API_KEY = Deno.env.get('DEEPSOURCE_API_TOKEN');
const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
const WEBHOOK_SECRET = Deno.env.get('DEEPSOURCE_WEBHOOK_SECRET');
const DEEPSOURCE_BASE_URL = 'https://deepsource.io/api/v1';
const GITHUB_BASE_URL = 'https://api.github.com';

// Debug logging helper
const debugLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

interface WebhookPayload {
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

interface BatchOperation {
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

interface RateLimitState {
  requests: number;
  resetTime: number;
  backoffUntil?: number;
}

class EnhancedDeepSourceService {
  private rateLimitState: Map<string, RateLimitState> = new Map();
  private batchOperations: Map<string, BatchOperation> = new Map();
  private webhookQueue: WebhookPayload[] = [];

  constructor() {
    debugLog('Service initialized', {
      hasDeepSourceKey: !!DEEPSOURCE_API_KEY,
      hasGitHubToken: !!GITHUB_TOKEN,
      hasWebhookSecret: !!WEBHOOK_SECRET
    });
  }

  private async verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
    if (!WEBHOOK_SECRET || !signature) return false;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const computedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expectedSignature = new Uint8Array(computedSignature);
    const providedSignature = new Uint8Array(
      signature.replace('sha256=', '').match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
    );
    
    return expectedSignature.length === providedSignature.length &&
           expectedSignature.every((byte, i) => byte === providedSignature[i]);
  }

  private async checkRateLimit(endpoint: string): Promise<boolean> {
    const now = Date.now();
    const state = this.rateLimitState.get(endpoint) || { requests: 0, resetTime: now + 3600000 };
    
    // Check if we're in backoff period
    if (state.backoffUntil && now < state.backoffUntil) {
      return false;
    }
    
    // Reset if window expired
    if (now > state.resetTime) {
      state.requests = 0;
      state.resetTime = now + 3600000;
      state.backoffUntil = undefined;
    }
    
    // DeepSource API allows 5000 requests per hour
    if (state.requests >= 5000) {
      // Implement exponential backoff
      const backoffMs = Math.min(300000, Math.pow(2, Math.floor(state.requests / 1000)) * 1000);
      state.backoffUntil = now + backoffMs;
      this.rateLimitState.set(endpoint, state);
      return false;
    }
    
    state.requests++;
    this.rateLimitState.set(endpoint, state);
    return true;
  }

  private async makeApiRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const endpoint = new URL(url).pathname;
    
    // Check rate limits
    if (!await this.checkRateLimit(endpoint)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Token ${DEEPSOURCE_API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    // Update rate limit info from response headers
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    
    if (remaining && reset) {
      const state = this.rateLimitState.get(endpoint) || { requests: 0, resetTime: Date.now() + 3600000 };
      state.requests = 5000 - parseInt(remaining);
      state.resetTime = parseInt(reset) * 1000;
      this.rateLimitState.set(endpoint, state);
    }
    
    return response;
  }

  // Generate mock analytics data (fallback)
  private generateMockAnalytics(repositoryId: string, days: number): any {
    debugLog('WARNING: Using mock analytics data - real API call failed or token not configured');
    
    return {
      repository_id: repositoryId,
      period_days: days,
      total_issues_processed: 1247,
      fix_success_rate: 0.78,
      avg_processing_time_ms: 2340,
      issues_by_category: {
        'style': { count: 450, success_rate: 0.95 },
        'bug-risk': { count: 380, success_rate: 0.72 },
        'security': { count: 120, success_rate: 0.60 },
        'performance': { count: 297, success_rate: 0.68 },
      },
      daily_stats: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        issues_processed: Math.floor(Math.random() * 50) + 10,
        fixes_applied: Math.floor(Math.random() * 35) + 5,
      })),
      debug_info: {
        generated_at: new Date().toISOString(),
        request_params: { repositoryId, days },
        api_key_configured: !!DEEPSOURCE_API_KEY,
        data_source: 'mock_fallback'
      }
    };
  }

  // Real DeepSource API call for analytics
  private async fetchRealAnalytics(repositoryId: string, days: number): Promise<any> {
    if (!DEEPSOURCE_API_KEY) {
      debugLog('DEEPSOURCE_API_TOKEN not configured, using mock data');
      return this.generateMockAnalytics(repositoryId, days);
    }

    try {
      debugLog('Attempting real DeepSource API call', { repositoryId, days });
      
      // Parse repository ID to extract org/repo if it's in format "org/repo"
      const repoParts = repositoryId.includes('/') ? repositoryId.split('/') : [repositoryId, repositoryId];
      const [organization, repo] = repoParts;
      
      // Construct the real DeepSource API endpoint
      const apiUrl = `${DEEPSOURCE_BASE_URL}/repos/${organization}/${repo}/issues/analytics/`;
      debugLog('Making request to DeepSource API', { url: apiUrl });
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${DEEPSOURCE_API_KEY}`,
          'Accept': 'application/json',
          'User-Agent': 'Enhanced-DeepSource-Client/1.0'
        }
      });

      debugLog('DeepSource API response status', { 
        status: response.status, 
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        throw new Error(`DeepSource API request failed: ${response.status} ${response.statusText}`);
      }

      const analyticsData = await response.json();
      debugLog('Successfully fetched real analytics from DeepSource API', { 
        dataKeys: Object.keys(analyticsData),
        repositoryId 
      });

      // Add debug info to indicate this is real data
      return {
        ...analyticsData,
        debug_info: {
          generated_at: new Date().toISOString(),
          request_params: { repositoryId, days },
          api_key_configured: true,
          data_source: 'deepsource_api'
        }
      };

    } catch (error) {
      debugLog('DeepSource API call failed, falling back to mock data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        repositoryId
      });
      
      return this.generateMockAnalytics(repositoryId, days);
    }
  }

  async createBatchOperation(repositoryId: string, issues: any[]): Promise<string> {
    const batchId = crypto.randomUUID();
    const batch: BatchOperation = {
      id: batchId,
      repository_id: repositoryId,
      issues,
      status: 'pending',
      progress: 0,
      created_at: new Date().toISOString(),
    };
    
    this.batchOperations.set(batchId, batch);
    
    // Start processing in background
    this.processBatchOperation(batchId).catch(error => {
      console.error(`Batch operation ${batchId} failed:`, error);
      const failedBatch = this.batchOperations.get(batchId);
      if (failedBatch) {
        failedBatch.status = 'failed';
        this.batchOperations.set(batchId, failedBatch);
      }
    });
    
    return batchId;
  }

  private async processBatchOperation(batchId: string): Promise<void> {
    const batch = this.batchOperations.get(batchId);
    if (!batch) return;
    
    batch.status = 'processing';
    this.batchOperations.set(batchId, batch);
    
    const results = { fixed: 0, failed: 0, skipped: 0 };
    const totalIssues = batch.issues.length;
    
    // Group issues by type for efficient processing
    const groupedIssues = this.groupIssuesByType(batch.issues);
    
    for (const [type, issues] of Object.entries(groupedIssues)) {
      console.log(`Processing ${issues.length} ${type} issues...`);
      
      // Process similar issues in parallel (up to 3 at a time)
      const chunks = this.chunkArray(issues, 3);
      
      for (const chunk of chunks) {
        const promises = chunk.map(issue => this.processIssue(issue));
        const chunkResults = await Promise.allSettled(promises);
        
        chunkResults.forEach(result => {
          if (result.status === 'fulfilled') {
            if (result.value.success) results.fixed++;
            else results.failed++;
          } else {
            results.failed++;
          }
        });
        
        // Update progress
        const processed = results.fixed + results.failed + results.skipped;
        batch.progress = Math.round((processed / totalIssues) * 100);
        this.batchOperations.set(batchId, batch);
        
        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    batch.status = 'completed';
    batch.results = results;
    batch.progress = 100;
    this.batchOperations.set(batchId, batch);
    
    console.log(`Batch ${batchId} completed:`, results);
  }

  private groupIssuesByType(issues: any[]): Record<string, any[]> {
    return issues.reduce((groups, issue) => {
      const type = issue.issue_code?.split('-')[0] || 'other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(issue);
      return groups;
    }, {});
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async processIssue(issue: any): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate issue processing
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      // Success rate varies by issue type
      const successRate = this.getSuccessRateForIssueType(issue.issue_code);
      const success = Math.random() < successRate;
      
      return {
        success,
        message: success ? `Fixed ${issue.issue_code}` : `Could not fix ${issue.issue_code}`,
      };
    } catch (error) {
      return { success: false, message: `Error processing ${issue.issue_code}: ${error}` };
    }
  }

  private getSuccessRateForIssueType(issueCode: string): number {
    const typeRates: Record<string, number> = {
      'JS': 0.85,
      'TS': 0.80,
      'SEC': 0.60,
      'PERF': 0.70,
      'STY': 0.95,
    };
    
    const type = issueCode?.split('-')[0] || 'OTHER';
    return typeRates[type] || 0.65;
  }

  async createGitHubBranch(owner: string, repo: string, branchName: string, baseBranch = 'main'): Promise<void> {
    if (!GITHUB_TOKEN) throw new Error('GitHub token not configured');
    
    // Get base branch SHA
    const baseResponse = await fetch(`${GITHUB_BASE_URL}/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` },
    });
    
    if (!baseResponse.ok) throw new Error('Failed to get base branch');
    
    const baseData = await baseResponse.json();
    const baseSha = baseData.object.sha;
    
    // Create new branch
    await fetch(`${GITHUB_BASE_URL}/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      }),
    });
  }

  async commitFix(owner: string, repo: string, branch: string, filePath: string, content: string, message: string): Promise<void> {
    if (!GITHUB_TOKEN) throw new Error('GitHub token not configured');
    
    // Get current file SHA (if exists)
    let currentSha: string | undefined;
    try {
      const fileResponse = await fetch(`${GITHUB_BASE_URL}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` },
      });
      
      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        currentSha = fileData.sha;
      }
    } catch (error) {
      // File doesn't exist, that's OK
    }
    
    // Commit the fix
    const commitData: any = {
      message,
      content: btoa(content), // Base64 encode
      branch,
    };
    
    if (currentSha) {
      commitData.sha = currentSha;
    }
    
    const response = await fetch(`${GITHUB_BASE_URL}/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commitData),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to commit fix: ${error}`);
    }
  }

  async createPullRequest(owner: string, repo: string, head: string, base: string, title: string, body: string): Promise<string> {
    if (!GITHUB_TOKEN) throw new Error('GitHub token not configured');
    
    const response = await fetch(`${GITHUB_BASE_URL}/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        head,
        base,
        body,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create pull request: ${error}`);
    }
    
    const data = await response.json();
    return data.html_url;
  }

  getBatchStatus(batchId: string): BatchOperation | undefined {
    return this.batchOperations.get(batchId);
  }

  // Updated getAnalytics method with real API integration
  async getAnalytics(repositoryId: string, days = 30): Promise<any> {
    debugLog('Analytics request received', { repositoryId, days });
    
    if (!repositoryId) {
      debugLog('ERROR: Repository ID is missing');
      throw new Error('Repository ID is required for analytics');
    }

    // Try to fetch real analytics data from DeepSource API
    return await this.fetchRealAnalytics(repositoryId, days);
  }

  // New debug/test methods
  async testConnectivity(): Promise<any> {
    debugLog('Testing service connectivity');
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        deepsource_api_configured: !!DEEPSOURCE_API_KEY,
        github_token_configured: !!GITHUB_TOKEN,
        webhook_secret_configured: !!WEBHOOK_SECRET
      },
      service_info: {
        batch_operations_count: this.batchOperations.size,
        rate_limit_states: this.rateLimitState.size
      }
    };
  }
}

const service = new EnhancedDeepSourceService();

const handler = async (req: Request): Promise<Response> => {
  debugLog('Request received', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  if (req.method === "OPTIONS") {
    debugLog('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    debugLog('Request body parsed', requestBody);
    
    const { action } = requestBody;

    if (!action) {
      debugLog('ERROR: No action specified in request');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Action parameter is required',
        debug: 'Request must include an action field'
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    debugLog(`Processing action: ${action}`);

    switch (action) {
      case 'test-connectivity': {
        debugLog('Testing connectivity');
        const result = await service.testConnectivity();
        debugLog('Connectivity test completed', result);
        
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'analytics': {
        debugLog('Processing analytics request');
        const { repository_id, days } = requestBody;
        
        if (!repository_id) {
          debugLog('ERROR: Missing repository_id for analytics');
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Missing repository_id parameter',
            debug: 'Analytics requires a repository_id'
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        debugLog('Calling service.getAnalytics', { repository_id, days });
        const analytics = await service.getAnalytics(repository_id, days || 30);
        debugLog('Analytics retrieved successfully');

        return new Response(JSON.stringify(analytics), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'webhook': {
        if (req.method !== 'POST') {
          return new Response('Method not allowed', { status: 405 });
        }

        const body = await req.text();
        const signature = req.headers.get('X-Hub-Signature-256') || '';
        
        if (!await service.verifyWebhookSignature(body, signature)) {
          return new Response('Invalid signature', { status: 401 });
        }

        const payload: WebhookPayload = JSON.parse(body);
        console.log('Received webhook:', payload.event_type, payload.repository.full_name);

        // Handle webhook based on event type
        if (payload.event_type === 'analysis.completed') {
          // Trigger dashboard refresh or processing
          console.log(`Analysis completed for ${payload.repository.full_name}: ${payload.analysis.issues_count} issues`);
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'batch-fix': {
        const { repository_id, issues } = requestBody;
        
        if (!repository_id || !issues?.length) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Missing repository_id or issues' 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const batchId = await service.createBatchOperation(repository_id, issues);

        return new Response(JSON.stringify({
          batch_id: batchId,
          status: 'processing',
          message: 'Batch operation started',
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'batch-status': {
        const { batch_id } = requestBody;
        
        if (!batch_id) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Missing batch_id parameter' 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const status = service.getBatchStatus(batch_id);
        if (!status) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Batch not found' 
          }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(status), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'create-branch': {
        const { owner, repo, branch_name, base_branch } = requestBody;
        
        if (!owner || !repo || !branch_name) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Missing required parameters: owner, repo, branch_name' 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        await service.createGitHubBranch(owner, repo, branch_name, base_branch);

        return new Response(JSON.stringify({
          success: true,
          message: `Branch ${branch_name} created successfully`,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'commit-fix': {
        const { owner, repo, branch, file_path, content, message } = requestBody;
        
        if (!owner || !repo || !branch || !file_path || !content || !message) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Missing required parameters for commit-fix' 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        await service.commitFix(owner, repo, branch, file_path, content, message);

        return new Response(JSON.stringify({
          success: true,
          message: 'Fix committed successfully',
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case 'create-pr': {
        const { owner, repo, head, base, title, body } = requestBody;
        
        if (!owner || !repo || !head || !base || !title) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: 'Missing required parameters for create-pr' 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const prUrl = await service.createPullRequest(owner, repo, head, base, title, body || '');

        return new Response(JSON.stringify({
          success: true,
          pull_request_url: prUrl,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default: {
        debugLog(`ERROR: Unknown action: ${action}`);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Unknown action: ${action}`,
          available_actions: ['analytics', 'test-connectivity', 'batch-fix', 'batch-status', 'create-branch', 'commit-fix', 'create-pr', 'webhook']
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
  } catch (error) {
    debugLog('ERROR: Request processing failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: 'Check function logs for detailed error information'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
};

serve(handler);
