
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const DEEPSOURCE_API_KEY = Deno.env.get('DEEPSOURCE_API_TOKEN');
const DEEPSOURCE_BASE_URL = 'https://deepsource.io/api/v1';

interface DeepSourceRequest {
  action: 'get_repositories' | 'get_issues';
  repository_id?: string;
}

// Mock data for demo purposes
const generateMockRepositories = () => [
  {
    id: 'demo-repo-1',
    name: 'Property Management System',
    full_name: 'leasy/property-management',
    issues_count: 42,
    last_analysis: new Date().toISOString()
  },
  {
    id: 'demo-repo-2', 
    name: 'Frontend Dashboard',
    full_name: 'leasy/frontend-dashboard',
    issues_count: 18,
    last_analysis: new Date().toISOString()
  }
];

const generateMockIssues = () => [
  {
    occurrence_hash: 'mock-issue-1',
    issue_text: 'Unused import statement',
    issue_code: 'JS-0002',
    severity: 'minor',
    location: { path: 'src/components/Dashboard.tsx', position: { begin: { line: 5, column: 1 } } },
    analyzer: 'javascript'
  },
  {
    occurrence_hash: 'mock-issue-2',
    issue_text: 'Missing semicolon',
    issue_code: 'JS-0125',
    severity: 'minor',
    location: { path: 'src/utils/helpers.ts', position: { begin: { line: 12, column: 25 } } },
    analyzer: 'javascript'
  },
  {
    occurrence_hash: 'mock-issue-3',
    issue_text: 'Variable should be const instead of let',
    issue_code: 'JS-0128',
    severity: 'minor',
    location: { path: 'src/services/api.ts', position: { begin: { line: 8, column: 3 } } },
    analyzer: 'javascript'
  },
  {
    occurrence_hash: 'mock-issue-4',
    issue_text: 'Missing React key prop',
    issue_code: 'JS-0240',
    severity: 'major',
    location: { path: 'src/components/List.tsx', position: { begin: { line: 15, column: 12 } } },
    analyzer: 'javascript'
  },
  {
    occurrence_hash: 'mock-issue-5',
    issue_text: 'Potential security vulnerability',
    issue_code: 'SEC-001',
    severity: 'critical',
    location: { path: 'src/auth/login.ts', position: { begin: { line: 23, column: 5 } } },
    analyzer: 'security'
  }
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, repository_id }: DeepSourceRequest = await req.json();

    // If no API key is configured, return mock data immediately
    if (!DEEPSOURCE_API_KEY) {
      console.log('🎭 DeepSource API key not configured, returning mock data');
      
      let mockData;
      if (action === 'get_repositories') {
        mockData = { repositories: generateMockRepositories() };
      } else if (action === 'get_issues') {
        mockData = { issues: generateMockIssues() };
      } else {
        throw new Error(`Unknown action: ${action}`);
      }

      return new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If API key exists, try to call real DeepSource API
    const headers = {
      'Authorization': `Token ${DEEPSOURCE_API_KEY}`,
      'Content-Type': 'application/json',
    };

    let response;

    switch (action) {
      case 'get_repositories':
        response = await fetch(`${DEEPSOURCE_BASE_URL}/repos/`, {
          method: 'GET',
          headers,
        });
        break;

      case 'get_issues':
        if (!repository_id) {
          throw new Error('Repository ID is required for get_issues action');
        }
        
        response = await fetch(`${DEEPSOURCE_BASE_URL}/repos/${repository_id}/issues/`, {
          method: 'GET',
          headers,
        });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    if (!response.ok) {
      console.warn(`DeepSource API error: ${response.status}, falling back to mock data`);
      
      // Fallback to mock data if API fails
      let mockData;
      if (action === 'get_repositories') {
        mockData = { repositories: generateMockRepositories() };
      } else if (action === 'get_issues') {
        mockData = { issues: generateMockIssues() };
      }

      return new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('DeepSource API error, returning mock data:', error);
    
    // Final fallback to mock data
    try {
      const { action }: DeepSourceRequest = await req.json();
      let mockData;
      
      if (action === 'get_repositories') {
        mockData = { repositories: generateMockRepositories() };
      } else if (action === 'get_issues') {
        mockData = { issues: generateMockIssues() };
      } else {
        mockData = { repositories: generateMockRepositories() };
      }

      return new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (fallbackError) {
      console.error('Even mock data fallback failed:', fallbackError);
      
      return new Response(
        JSON.stringify({ 
          error: 'Service temporarily unavailable',
          repositories: generateMockRepositories(),
          issues: generateMockIssues()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  }
};

serve(handler);
