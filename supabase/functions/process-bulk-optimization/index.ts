import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkOptimizationRequest {
  user_id: string;
  property_ids?: string[];
  types: string[];
  only_missing?: boolean;
  target_language?: 'en' | 'de';
  batch_size?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      user_id,
      property_ids,
      types = ['title', 'description'],
      only_missing = true,
      target_language,
      batch_size = 5
    }: BulkOptimizationRequest = await req.json();

    console.log('🚀 Starting bulk optimization for user:', user_id);
    console.log('📊 Parameters:', { property_ids, types, only_missing, target_language, batch_size });

    if (!user_id) {
      return new Response(JSON.stringify({ 
        error: 'User ID is required' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get properties to process
    let propertiesQuery = supabase
      .from('properties')
      .select('*')
      .eq('user_id', user_id);

    if (property_ids && property_ids.length > 0) {
      propertiesQuery = propertiesQuery.in('id', property_ids);
    }

    const { data: properties, error: propertiesError } = await propertiesQuery;

    if (propertiesError) {
      console.error('❌ Error fetching properties:', propertiesError);
      throw propertiesError;
    }

    if (!properties || properties.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No properties found to process',
        processed: 0,
        skipped: 0,
        failed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📋 Found ${properties.length} properties to process`);

    let processed = 0;
    let skipped = 0;
    let failed = 0;
    const results = [];

    // Process properties in batches
    for (let i = 0; i < properties.length; i += batch_size) {
      const batch = properties.slice(i, i + batch_size);
      console.log(`🔄 Processing batch ${Math.floor(i / batch_size) + 1}/${Math.ceil(properties.length / batch_size)}`);

      // Process batch in parallel
      const batchPromises = batch.map(async (property) => {
        try {
          return await processProperty(property, types, only_missing, target_language, openAIApiKey, supabase);
        } catch (error) {
          console.error(`❌ Failed to process property ${property.id}:`, error);
          failed++;
          return {
            property_id: property.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          if (result.value.status === 'processed') {
            processed++;
          } else if (result.value.status === 'skipped') {
            skipped++;
          } else if (result.value.status === 'failed') {
            failed++;
          }
          results.push(result.value);
        } else {
          failed++;
          results.push({
            status: 'failed',
            error: result.reason
          });
        }
      }
    }

    console.log(`✅ Bulk optimization completed. Processed: ${processed}, Skipped: ${skipped}, Failed: ${failed}`);

    return new Response(JSON.stringify({
      success: true,
      processed,
      skipped,
      failed,
      total: properties.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Bulk optimization error:', error);
    return new Response(JSON.stringify({
      error: 'Bulk optimization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function processProperty(
  property: any,
  types: string[],
  onlyMissing: boolean,
  targetLanguage: string | undefined,
  openAIApiKey: string,
  supabase: any
) {
  console.log(`🏠 Processing property: ${property.title} (${property.id})`);

  // Determine what needs to be generated
  const neededTypes = [];
  
  for (const type of types) {
    if (onlyMissing) {
      let needsGeneration = false;
      
      switch (type) {
        case 'title':
          needsGeneration = !property.title_de || !property.title_en;
          break;
        case 'description':
          needsGeneration = !property.description_de || !property.description_en;
          break;
        case 'meta_description':
          needsGeneration = !property.meta_description_de || !property.meta_description_en;
          break;
        default:
          needsGeneration = true;
      }
      
      if (needsGeneration) {
        neededTypes.push(type);
      }
    } else {
      neededTypes.push(type);
    }
  }

  if (neededTypes.length === 0) {
    console.log(`⏭️ Skipping property ${property.id} - no content needed`);
    return {
      property_id: property.id,
      status: 'skipped',
      reason: 'No content generation needed'
    };
  }

  console.log(`🎯 Generating content for ${property.id}: ${neededTypes.join(', ')}`);

  const updates: any = {};
  const generatedItems = [];

  // Generate content for each needed type
  for (const type of neededTypes) {
    try {
      // Generate for both German and English if target language not specified
      const languages = targetLanguage ? [targetLanguage] : ['de', 'en'];
      
      for (const lang of languages) {
        const content = await generateContentForProperty(property, type, lang, openAIApiKey);
        
        if (content) {
          const fieldName = `${type}_${lang}`;
          updates[fieldName] = content;
          
          generatedItems.push({
            field: fieldName,
            content,
            type,
            language: lang
          });
          
          console.log(`✅ Generated ${type} (${lang}) for ${property.id}: ${content.substring(0, 50)}...`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Failed to generate ${type} for property ${property.id}:`, error);
      // Continue with other types
    }
  }

  // Update property if we have generated content
  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString();
    
    const { error: updateError } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', property.id);

    if (updateError) {
      console.error(`❌ Failed to update property ${property.id}:`, updateError);
      throw updateError;
    }

    // Create version history entries
    for (const item of generatedItems) {
      await supabase
        .from('ai_versions')
        .insert({
          property_id: property.id,
          field_name: item.field,
          content: item.content,
          ai_generated: true,
          created_by: property.user_id
        });
    }

    console.log(`💾 Updated property ${property.id} with ${generatedItems.length} generated items`);

    return {
      property_id: property.id,
      status: 'processed',
      generated_items: generatedItems.length,
      fields_updated: Object.keys(updates)
    };
  } else {
    return {
      property_id: property.id,
      status: 'skipped',
      reason: 'No content was generated successfully'
    };
  }
}

async function generateContentForProperty(
  property: any,
  type: string,
  language: string,
  openAIApiKey: string
): Promise<string | null> {
  try {
    const systemPrompts = {
      title: `You are an expert real estate copywriter. Create compelling, SEO-optimized property titles in ${language === 'de' ? 'German' : 'English'} that are concise yet descriptive.`,
      description: `You are a professional real estate copywriter. Create engaging property descriptions in ${language === 'de' ? 'German' : 'English'} that highlight key features and selling points.`,
      meta_description: `You are an SEO expert. Create optimized meta descriptions in ${language === 'de' ? 'German' : 'English'} for property listings (max 160 characters).`
    };

    const userPrompts = {
      title: `Create a compelling property title in ${language === 'de' ? 'German' : 'English'} for:
Property Type: ${property.apartment_type || 'Property'}
Location: ${property.city || 'Premium location'}
Bedrooms: ${property.bedrooms || 'N/A'}
Size: ${property.square_meters ? `${property.square_meters}m²` : 'N/A'}
Price: ${property.monthly_rent ? `€${property.monthly_rent}/month` : 'Available'}

Create 1 optimized title under 60 characters.`,

      description: `Create an engaging property description in ${language === 'de' ? 'German' : 'English'} for:
Title: ${property.title || 'Premium Property'}
Type: ${property.apartment_type || 'Apartment'}
Location: ${property.city || 'Premium location'}
Bedrooms: ${property.bedrooms || 'Multiple'} bedroom${property.bedrooms > 1 ? 's' : ''}
Bathrooms: ${property.bathrooms || 'Modern'} bathroom${property.bathrooms > 1 ? 's' : ''}
Size: ${property.square_meters || 'Spacious'}m²
Price: €${property.monthly_rent || property.weekly_rate || property.daily_rate || 'Available'}

Create an engaging 200-300 word description highlighting key features and location benefits.`,

      meta_description: `Create an SEO meta description in ${language === 'de' ? 'German' : 'English'} (max 160 characters) for:
${property.title || 'Premium Property'} in ${property.city || 'Premium location'}
${property.bedrooms || 'Multiple'} bedrooms, ${property.square_meters || 'spacious'}m²
€${property.monthly_rent || property.weekly_rate || property.daily_rate || 'Available'}/month

Focus on location, size, and key selling points.`
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompts[type as keyof typeof systemPrompts] },
          { role: 'user', content: userPrompts[type as keyof typeof userPrompts] }
        ],
        temperature: 0.7,
        max_tokens: type === 'title' ? 100 : type === 'meta_description' ? 200 : 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || null;

  } catch (error) {
    console.error(`❌ Error generating ${type} in ${language}:`, error);
    throw error;
  }
}