import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting cleanup of exact duplicates...');

    // Get all properties
    const { data: allProperties, error: fetchError } = await supabase
      .from('properties')
      .select('*');

    if (fetchError) {
      console.error('Error fetching properties:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${allProperties?.length || 0} total properties`);

    if (!allProperties || allProperties.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No properties found', 
          deletedCount: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const seen = new Map();
    const toDelete = [];

    // Find exact duplicates based on title, street_name, and city
    for (const prop of allProperties) {
      const key = `${prop.title}|${prop.street_name}|${prop.city}`;
      
      if (seen.has(key)) {
        // This is a duplicate - add to deletion list
        toDelete.push(prop.id);
        console.log(`Found duplicate: ${prop.title} at ${prop.street_name}, ${prop.city}`);
      } else {
        // First occurrence - keep it
        seen.set(key, true);
      }
    }

    let deletedCount = 0;

    if (toDelete.length > 0) {
      console.log(`Deleting ${toDelete.length} duplicate properties...`);

      // Delete property media first (foreign key constraint)
      const { error: mediaDeleteError } = await supabase
        .from('property_media')
        .delete()
        .in('property_id', toDelete);

      if (mediaDeleteError) {
        console.error('Error deleting property media:', mediaDeleteError);
        // Continue with property deletion even if media deletion fails
      }

      // Delete property fees
      const { error: feesDeleteError } = await supabase
        .from('property_fees')
        .delete()
        .in('property_id', toDelete);

      if (feesDeleteError) {
        console.error('Error deleting property fees:', feesDeleteError);
        // Continue with property deletion even if fees deletion fails
      }

      // Delete the duplicate properties
      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .in('id', toDelete);

      if (deleteError) {
        console.error('Error deleting properties:', deleteError);
        throw deleteError;
      }

      deletedCount = toDelete.length;
      console.log(`🧹 Successfully deleted ${deletedCount} duplicate properties`);
    } else {
      console.log('✅ No exact duplicates found');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: deletedCount > 0 
          ? `Successfully deleted ${deletedCount} duplicate properties` 
          : 'No exact duplicates found',
        deletedCount,
        duplicateKeys: toDelete.length > 0 ? Array.from(seen.keys()).slice(0, 5) : []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cleanup function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred',
        deletedCount: 0
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
