
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const DEEPSOURCE_API_KEY = Deno.env.get('DEEPSOURCE_API_TOKEN');
const DEEPSOURCE_BASE_URL = 'https://deepsource.io/api/v1';

interface DeepSourceRequest {
  action: 'get_repositories' | 'get_issues' | 'test_connection';
  repository_id?: string;
  page?: number;
  per_page?: number;
  severity?: string[];
  category?: string[];
}

interface DeepSourceRepository {
  id: string;
  name: string;
  full_name: string;
  issues_count: number;
  last_analysis: string;
}

interface DeepSourceIssue {
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

// Enhanced mock data with more realistic numbers
const generateEnhancedMockData = () => {
  const repositories = [
    {
      id: 'demo-repo-1',
      name: 'Property Management System',
      full_name: 'leasy/property-management',
      issues_count: 1247,
      last_analysis: new Date().toISOString()
    },
    {
      id: 'demo-repo-2', 
      name: 'Frontend Dashboard',
      full_name: 'leasy/frontend-dashboard',
      issues_count: 387,
      last_analysis: new Date().toISOString()
    }
  ];

  // Generate a large number of realistic issues
  const issues = [];
  const severities = ['critical', 'major', 'minor'];
  const categories = ['security', 'bug-risk', 'performance', 'style', 'typecheck', 'documentation'];
  const analyzers = ['javascript', 'typescript', 'security', 'performance'];
  const issueCodes = [
    'JS-0002', 'JS-0125', 'JS-0128', 'JS-0240', 'JS-0241', 
    'TS-0024', 'SEC-001', 'SEC-002', 'PERF-001', 'STY-001'
  ];
  const filePaths = [
    'src/components/Dashboard.tsx',
    'src/utils/helpers.ts',
    'src/services/api.ts',
    'src/components/List.tsx',
    'src/auth/login.ts',
    'src/components/PropertyCard.tsx',
    'src/hooks/useData.ts',
    'src/pages/Properties.tsx',
    'src/lib/validation.ts',
    'src/components/Modal.tsx'
  ];

  for (let i = 0; i < 1600; i++) {
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const analyzer = analyzers[Math.floor(Math.random() * analyzers.length)];
    const issueCode = issueCodes[Math.floor(Math.random() * issueCodes.length)];
    const filePath = filePaths[Math.floor(Math.random() * filePaths.length)];

    issues.push({
      occurrence_hash: `mock-issue-${i + 1}`,
      issue_text: generateIssueText(issueCode),
      issue_code: issueCode,
      severity: severity,
      location: {
        path: filePath,
        position: {
          begin: {
            line: Math.floor(Math.random() * 100) + 1,
            column: Math.floor(Math.random() * 50) + 1
          }
        }
      },
      analyzer: analyzer
    });
  }

  return { repositories, issues };
};

const generateIssueText = (code: string): string => {
  const issueTexts: Record<string, string> = {
    'JS-0002': 'Unused import statement',
    'JS-0125': 'Missing semicolon',
    'JS-0128': 'Variable should be const instead of let',
    'JS-0240': 'Missing React key prop',
    'JS-0241': 'Unnecessary React fragment',
    'TS-0024': 'Unused variable',
    'SEC-001': 'Potential security vulnerability',
    'SEC-002': 'Hardcoded sensitive data',
    'PERF-001': 'Performance issue detected',
    'STY-001': 'Code style violation'
  };
  return issueTexts[code] || 'Code quality issue';
};

const fetchAllIssues = async (repositoryId: string, filters: any = {}) => {
  const allIssues = [];
  let page = 1;
  const perPage = 100; // DeepSource API typical page size
  
  console.log(`Fetching all issues for repository: ${repositoryId}`);
  
  while (true) {
    try {
      const url = new URL(`${DEEPSOURCE_BASE_URL}/repos/${repositoryId}/issues/`);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('per_page', perPage.toString());
      
      // Add filters if provided
      if (filters.severity?.length) {
        filters.severity.forEach((s: string) => url.searchParams.append('severity', s));
      }
      if (filters.category?.length) {
        filters.category.forEach((c: string) => url.searchParams.append('category', c));
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Token ${DEEPSOURCE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`API error on page ${page}: ${response.status}`);
        break;
      }

      const data = await response.json();
      const issues = data.results || data.issues || [];
      
      if (issues.length === 0) {
        break; // No more issues
      }
      
      allIssues.push(...issues);
      console.log(`Fetched page ${page}: ${issues.length} issues (total: ${allIssues.length})`);
      
      // Check if there are more pages
      if (!data.next || issues.length < perPage) {
        break;
      }
      
      page++;
      
      // Safety limit to prevent infinite loops
      if (page > 100) {
        console.warn('Reached page limit of 100, stopping pagination');
        break;
      }
      
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      break;
    }
  }
  
  console.log(`Total issues fetched: ${allIssues.length}`);
  return allIssues;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, repository_id, page = 1, per_page = 50, severity, category }: DeepSourceRequest = await req.json();
    console.log(`DeepSource API request: ${action}`, { repository_id, page, per_page });

    // Test connection endpoint
    if (action === 'test_connection') {
      if (!DEEPSOURCE_API_KEY) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'API token not configured',
          demo_mode: true 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      try {
        const response = await fetch(`${DEEPSOURCE_BASE_URL}/user/`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${DEEPSOURCE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        return new Response(JSON.stringify({ 
          success: response.ok,
          status: response.status,
          demo_mode: false
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Connection failed',
          demo_mode: true 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // If no API key is configured, return enhanced mock data
    if (!DEEPSOURCE_API_KEY) {
      console.log('🎭 DeepSource API key not configured, returning enhanced mock data');
      
      const { repositories, issues } = generateEnhancedMockData();
      
      let mockData;
      if (action === 'get_repositories') {
        mockData = { repositories };
      } else if (action === 'get_issues') {
        // Simulate pagination for mock data
        const startIndex = (page - 1) * per_page;
        const endIndex = startIndex + per_page;
        const paginatedIssues = issues.slice(startIndex, endIndex);
        
        mockData = { 
          issues: paginatedIssues,
          total_count: issues.length,
          page: page,
          per_page: per_page,
          total_pages: Math.ceil(issues.length / per_page)
        };
      } else {
        throw new Error(`Unknown action: ${action}`);
      }

      return new Response(JSON.stringify({
        ...mockData,
        demo_mode: true,
        message: 'Using demo data - configure DeepSource API token for real analysis'
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Real API calls
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
        
        // For real API, fetch all issues if page 1 is requested, otherwise use pagination
        if (page === 1 && per_page >= 100) {
          // Fetch all issues
          const allIssues = await fetchAllIssues(repository_id, { severity, category });
          return new Response(JSON.stringify({
            issues: allIssues,
            total_count: allIssues.length,
            page: 1,
            per_page: allIssues.length,
            total_pages: 1,
            demo_mode: false
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          // Regular paginated request
          const url = new URL(`${DEEPSOURCE_BASE_URL}/repos/${repository_id}/issues/`);
          url.searchParams.set('page', page.toString());
          url.searchParams.set('per_page', per_page.toString());
          
          response = await fetch(url.toString(), {
            method: 'GET',
            headers,
          });
        }
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    if (!response.ok) {
      console.warn(`DeepSource API error: ${response.status}, falling back to enhanced mock data`);
      
      const { repositories, issues } = generateEnhancedMockData();
      
      let mockData;
      if (action === 'get_repositories') {
        mockData = { repositories };
      } else if (action === 'get_issues') {
        const startIndex = (page - 1) * per_page;
        const endIndex = startIndex + per_page;
        const paginatedIssues = issues.slice(startIndex, endIndex);
        
        mockData = { 
          issues: paginatedIssues,
          total_count: issues.length,
          page: page,
          per_page: per_page,
          total_pages: Math.ceil(issues.length / per_page)
        };
      }

      return new Response(JSON.stringify({
        ...mockData,
        demo_mode: true,
        message: 'API error - using demo data'
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      ...data,
      demo_mode: false
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('DeepSource API error:', error);
    
    // Final fallback to enhanced mock data
    try {
      const { repositories, issues } = generateEnhancedMockData();
      
      return new Response(JSON.stringify({
        error: 'Service temporarily unavailable',
        repositories,
        issues: issues.slice(0, 50), // First 50 issues as fallback
        total_count: issues.length,
        demo_mode: true,
        message: 'Service error - using demo data'
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (fallbackError) {
      console.error('Even enhanced mock data fallback failed:', fallbackError);
      
      return new Response(JSON.stringify({ 
        error: 'Service completely unavailable',
        demo_mode: true
      }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }
  }
};

serve(handler);
