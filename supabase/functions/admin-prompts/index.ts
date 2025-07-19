import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PromptRequest {
  name: string;
  type: string;
  prompt: string;
  is_active?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify user has admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🔧 Admin prompts API: ${req.method} request from user ${user.id}`);

    if (req.method === 'GET') {
      // Get all prompts or latest system prompt
      const url = new URL(req.url);
      const latest = url.searchParams.get('latest');
      const type = url.searchParams.get('type');

      if (latest === 'true') {
        // Get the latest active prompt (for backwards compatibility)
        const { data, error } = await supabase
          .from('ai_prompts')
          .select('prompt')
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching latest prompt:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch prompt' }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        return new Response(
          JSON.stringify({ systemPrompt: data?.prompt || '' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Get all prompts or filter by type
      let query = supabase
        .from('ai_prompts')
        .select('*')
        .order('type', { ascending: true });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching prompts:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch prompts' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ prompts: data || [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'POST') {
      const body: PromptRequest = await req.json();
      const { name, type, prompt, is_active = true } = body;

      // Validate required fields
      if (!name?.trim() || !type?.trim() || !prompt?.trim()) {
        return new Response(
          JSON.stringify({ error: 'Name, type, and prompt are required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Check if prompt with same type already exists
      const { data: existingPrompt } = await supabase
        .from('ai_prompts')
        .select('id')
        .eq('type', type.trim())
        .maybeSingle();

      if (existingPrompt) {
        return new Response(
          JSON.stringify({ error: `Prompt of type '${type}' already exists. Use PUT to update.` }),
          { 
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Create new prompt
      const { data, error } = await supabase
        .from('ai_prompts')
        .insert({
          name: name.trim(),
          type: type.trim(),
          prompt: prompt.trim(),
          is_active,
          updated_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating prompt:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create prompt' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log(`✅ Created new prompt: ${name} (${type})`);

      return new Response(
        JSON.stringify({ success: true, prompt: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      const { id, name, prompt, is_active } = body;

      if (!id || !prompt?.trim()) {
        return new Response(
          JSON.stringify({ error: 'ID and prompt are required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Update existing prompt
      const { data, error } = await supabase
        .from('ai_prompts')
        .update({
          name: name?.trim(),
          prompt: prompt.trim(),
          is_active,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating prompt:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update prompt' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Create version history
      try {
        await supabase
          .from('ai_prompt_versions')
          .insert({
            prompt_id: id,
            prompt: prompt.trim(),
            version_number: Math.floor(Date.now() / 1000),
            created_by: user.id
          });
      } catch (versionError) {
        console.warn('Failed to create version history:', versionError);
      }

      console.log(`✅ Updated prompt: ${id}`);

      return new Response(
        JSON.stringify({ success: true, prompt: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Prompt ID is required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Soft delete by deactivating the prompt
      const { error } = await supabase
        .from('ai_prompts')
        .update({ 
          is_active: false,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error deleting prompt:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to delete prompt' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log(`✅ Deleted prompt: ${id}`);

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in admin-prompts function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});