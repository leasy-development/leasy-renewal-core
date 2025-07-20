
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const DEEPSOURCE_API_KEY = Deno.env.get('DEEPSOURCE_API_KEY');
const DEEPSOURCE_BASE_URL = 'https://deepsource.io/api/v1';

interface DeepSourceRequest {
  action: 'get_repositories' | 'get_issues';
  repository_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!DEEPSOURCE_API_KEY) {
    return new Response(
      JSON.stringify({ error: "DeepSource API key not configured" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }

  try {
    const { action, repository_id }: DeepSourceRequest = await req.json();

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
      throw new Error(`DeepSource API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('DeepSource API error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch from DeepSource API' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);
