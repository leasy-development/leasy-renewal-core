import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropertyData {
  title?: string;
  location?: string;
  street_name?: string;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_meters?: number;
  monthly_rent?: number;
  weekly_rate?: number;
  daily_rate?: number;
  apartment_type?: string;
  category?: string;
  description?: string;
  features?: string[];
  amenities?: string[];
}

interface GenerationRequest {
  type: 'description' | 'title' | 'alt_text' | 'translation' | 'summary' | 'tags' | 'validation';
  property?: PropertyData;
  content?: string;
  imageUrl?: string;
  tone?: string;
  format?: 'markdown' | 'html';
  language?: string;
  targetLanguage?: string;
  sourceLanguage?: string;
  maxLength?: number;
  length?: 'short' | 'medium' | 'long';
  includeFeatures?: boolean;
  customPrompt?: string;
  requests?: Array<{ type: string; content: string }>;
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
        error: 'OpenAI API key not configured',
        details: 'Please set the OPENAI_API_KEY secret in Supabase' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let request: GenerationRequest;
    
    try {
      request = await req.json();
    } catch (parseError) {
      console.error('❌ Invalid JSON in request body:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: 'Request body must be valid JSON' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    // Handle both direct properties and nested structures
    const { 
      type, 
      property, 
      content, 
      imageUrl, 
      customPrompt,
      tone = 'professional and premium',
      language = 'en',
      length = 'medium'
    } = request;

    console.log(`🤖 AI ${type || 'unknown'} generation requested`, { 
      type, 
      hasProperty: !!property,
      propertyTitle: property?.title 
    });

    // Validate required type parameter
    if (!type) {
      console.error('❌ Generation type is required');
      return new Response(JSON.stringify({ 
        error: 'Generation type is required',
        details: 'The "type" parameter must be specified (e.g., "description", "title", etc.)' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Enhanced validation for description type
    if (type === 'description') {
      if (!property) {
        console.error('❌ Property data is required for description generation');
        return new Response(JSON.stringify({ 
          error: 'Property data is required',
          details: 'The "property" object must be provided for description generation' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      if (!property.title || !property.apartment_type) {
        const missingFields = [];
        if (!property.title) missingFields.push('title');
        if (!property.apartment_type) missingFields.push('apartment_type');
        
        console.error('❌ Missing required property fields:', missingFields);
        return new Response(JSON.stringify({ 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          details: 'Property title and apartment_type are required for description generation' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
    }

    // Enhanced system prompt based on Next.js pattern
    const SYSTEM_PROMPT = `
You are a real estate content expert specialized in high-quality, multilingual, SEO-optimized listings.
Analyze the structured property data, uploaded image descriptions, and any user-entered suggestions.
Generate clear, engaging, persuasive content in both German and English when requested.
Always mention key amenities, floor plan, style, location highlights, and adjust tone based on the selected persona.
Return localized fields cleanly for database input.
`;

    let systemPrompt = SYSTEM_PROMPT;
    let userPrompt = '';
    let maxTokens = 1000;
    let temperature = 0.7;

    // Get dynamic prompt from database if available
    const { data: promptData } = await supabase
      .from('ai_prompts')
      .select('prompt')
      .eq('type', type)
      .eq('is_active', true)
      .maybeSingle();

    if (promptData?.prompt) {
      systemPrompt = promptData.prompt;
    }

    switch (type) {
      case 'description':
        return await generateDescription(openAIApiKey, request, supabase);
      
      case 'title':
        systemPrompt = "You are an expert real estate copywriter. Create compelling, SEO-optimized property titles that are concise yet descriptive. Focus on location, property type, and key selling points.";
        userPrompt = customPrompt || `Generate a compelling property title for:
Property Type: ${property?.apartment_type || 'Property'}
Location: ${property?.city || property?.street_name || 'Premium location'}
Bedrooms: ${property?.bedrooms || 'N/A'}
Size: ${property?.square_meters ? `${property.square_meters}m²` : 'N/A'}
Current title: ${property?.title || 'None'}

Create 1 optimized title that's under 60 characters and includes key selling points.`;
        maxTokens = 100;
        break;

      case 'alt_text':
        systemPrompt = "You are an accessibility expert specializing in image alt text for real estate. Create concise, descriptive alt text that helps visually impaired users understand property images while being SEO-friendly.";
        userPrompt = `Generate alt text for a property image at: ${imageUrl}
Property context: ${property?.title || 'Property listing'}
Location: ${property?.city || 'Premium location'}
Type: ${property?.apartment_type || 'Residential'}

Create descriptive alt text (max 120 characters) that describes what's visible in the image for accessibility purposes.`;
        maxTokens = 50;
        break;

      case 'translation':
        // Handle batch translation requests
        if (request.requests && Array.isArray(request.requests)) {
          const translations = [];
          
          for (const translationRequest of request.requests) {
            systemPrompt = `You are a professional translator specializing in real estate content. Maintain the tone, style, and marketing appeal while translating accurately to ${request.targetLanguage}.`;
            userPrompt = `Translate this ${translationRequest.type} from ${request.sourceLanguage} to ${request.targetLanguage}:

${translationRequest.content}

Maintain marketing appeal and professional tone.`;
            
            const translationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openAIApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: Math.ceil((translationRequest.content?.length || 0) * 1.5),
              }),
            });

            const translationData = await translationResponse.json();
            
            if (!translationResponse.ok) {
              throw new Error(`Translation API error: ${translationData.error?.message || 'Unknown error'}`);
            }

            const translatedContent = translationData.choices[0].message.content.trim();
            
            translations.push({
              type: translationRequest.type,
              content: translatedContent
            });
          }
          
          return new Response(JSON.stringify({ translations }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Fallback for single translation
        systemPrompt = `You are a professional translator specializing in real estate content. Maintain the tone, style, and marketing appeal while translating accurately to ${request.targetLanguage}.`;
        userPrompt = `Translate the following real estate content to ${request.targetLanguage}:

"${content}"

Property context: ${property?.title || 'Real estate listing'}
Maintain marketing appeal and professional tone.`;
        maxTokens = Math.ceil((content?.length || 0) * 1.5);
        break;

      case 'summary':
        const lengthGuide = {
          short: '1-2 sentences, 100 characters max',
          medium: '2-3 sentences, 200 characters max', 
          long: '3-4 sentences, 300 characters max'
        };
        systemPrompt = "You are a real estate marketing expert. Create compelling property summaries that capture the essence and appeal of listings for use in previews, social media, and quick overviews.";
        userPrompt = `Create a ${request.length || 'short'} summary (${lengthGuide[request.length || 'short']}) for:
Title: ${property?.title}
Description: ${property?.description || 'Modern property'}
Location: ${property?.city || property?.street_name}
Type: ${property?.apartment_type}
Bedrooms: ${property?.bedrooms}
Size: ${property?.square_meters}m²
Price: €${property?.monthly_rent || property?.weekly_rate || property?.daily_rate}

Focus on the most appealing aspects and unique selling points.`;
        maxTokens = 150;
        break;

      case 'tags':
        systemPrompt = "You are a real estate categorization expert. Generate relevant, searchable tags that help users find properties based on their needs and preferences.";
        userPrompt = `Generate 5-8 relevant tags for this property (return as JSON array):
Title: ${property?.title}
Type: ${property?.apartment_type}
Location: ${property?.city}
Bedrooms: ${property?.bedrooms}
Bathrooms: ${property?.bathrooms}
Size: ${property?.square_meters}m²
Description: ${property?.description?.substring(0, 300)}

Consider: luxury level, pet-friendliness, furnishing, location benefits, property features, target audience.
Return format: {"tags": ["tag1", "tag2", "tag3"]}`;
        maxTokens = 100;
        break;

      case 'validation':
        systemPrompt = "You are a real estate listing quality auditor. Analyze property listings for completeness, appeal, and potential improvements. Provide actionable feedback and a quality score.";
        userPrompt = `Analyze this property listing quality and return structured JSON:

Title: ${property?.title || 'MISSING'}
Description: ${property?.description || 'MISSING'} 
Type: ${property?.apartment_type || 'MISSING'}
Location: ${property?.city || 'MISSING'}
Bedrooms: ${property?.bedrooms || 'MISSING'}
Bathrooms: ${property?.bathrooms || 'MISSING'}
Size: ${property?.square_meters || 'MISSING'}m²
Price: €${property?.monthly_rent || property?.weekly_rate || property?.daily_rate || 'MISSING'}

Return JSON format:
{
  "quality_score": 85,
  "issues": [
    {"type": "error", "field": "description", "message": "Description too short", "suggestion": "Add more details about amenities"}
  ],
  "suggestions": ["Add professional photos", "Include neighborhood highlights"]
}

Score 0-100 based on completeness, appeal, and marketing effectiveness.`;
        maxTokens = 300;
        break;

    default:
        throw new Error(`Unsupported generation type: ${type}`);
    }

    // Call OpenAI API with enhanced error handling
    let response;
    let data;
    
    try {
      console.log(`🔄 Calling OpenAI API for ${type} generation...`);
      
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature,
          max_tokens: maxTokens,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ OpenAI API HTTP error:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        // Parse OpenAI error for better error messages
        let parsedError;
        try {
          parsedError = JSON.parse(errorText);
        } catch {
          parsedError = { error: { message: errorText } };
        }
        
        const errorMsg = parsedError?.error?.message || `API returned ${response.status}`;
        throw new Error(`OpenAI API error (${response.status}): ${errorMsg}`);
      }

      data = await response.json();
      
    } catch (fetchError) {
      console.error("❌ Network error calling OpenAI API:", fetchError);
      throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Connection failed'}`);
    }

    const generatedContent = data.choices?.[0]?.message?.content;

    if (!generatedContent) {
      console.error(`❌ No content generated by OpenAI for ${type}:`, data);
      throw new Error(`OpenAI did not generate any ${type} content. Please try again.`);
    }

    console.log(`✅ AI ${type} generated successfully for: ${property?.title || 'unknown property'}`);
    console.log(`📊 Generated content length: ${generatedContent.length} characters`);

    // Log usage for analytics
    try {
      await supabase
        .from('ai_generation_logs')
        .insert({
          property_title: property?.title || `${type} generation`,
          tone: request.tone || type,
          format: request.format || 'text',
          language: request.language || request.targetLanguage || 'en',
          character_count: generatedContent.length,
        });
    } catch (logError) {
      console.warn('Failed to log AI usage:', logError);
    }

    return new Response(
      JSON.stringify({ 
        content: generatedContent,
        metadata: {
          type,
          format: request.format || 'text',
          language: request.language || request.targetLanguage || 'en',
          characterCount: generatedContent.length,
          generatedAt: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in AI generation:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate AI content',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Separate function for description generation (backwards compatibility)
async function generateDescription(openAIApiKey: string, request: GenerationRequest, supabase: any) {
  const { 
    property, 
    tone = 'professional and premium',
    format = 'html',
    language = 'en',
    maxLength = 500,
    includeFeatures = true
  } = request;

  if (!property?.title) {
    throw new Error('Property title is required for description generation');
  }

  // Build location string
  const location = property.location || 
    [property.street_name, property.city].filter(Boolean).join(', ') ||
    'Premium location';

  // Build features list
  const features = [
    ...(property.features || []),
    ...(property.amenities || []),
    property.bedrooms ? `${property.bedrooms} bedroom${property.bedrooms > 1 ? 's' : ''}` : null,
    property.bathrooms ? `${property.bathrooms} bathroom${property.bathrooms > 1 ? 's' : ''}` : null,
    property.square_meters ? `${property.square_meters}m² living space` : null
  ].filter(Boolean);

  // Determine pricing context
  const pricing = property.monthly_rent 
    ? `€${property.monthly_rent}/month`
    : property.weekly_rate 
      ? `€${property.weekly_rate}/week`
      : property.daily_rate
        ? `€${property.daily_rate}/night`
        : 'Competitive pricing';

  const systemPrompt = `You are a professional real estate copywriter specializing in premium property listings. Write compelling, accurate descriptions that highlight unique selling points while maintaining authenticity. ${tone ? `Tone: ${tone}` : 'Use a professional and premium tone.'}

Key requirements:
- Highlight unique selling points and premium features
- Create emotional connection while staying factual
- ${format === 'markdown' ? 'Format in clean Markdown' : 'Format as clean HTML'}
- Keep it concise, around ${maxLength} characters maximum
- Focus on lifestyle benefits and location advantages
- Use persuasive but honest language
${includeFeatures ? '- Incorporate the provided features naturally into the description' : '- Focus on general appeal without listing specific features'}`;

  const userPrompt = `Create a compelling property description for:

🏠 **Property Details:**
- Title: ${property.title}
- Type: ${property.apartment_type || 'Residential property'}
- Category: ${property.category || 'Rental'}
- Location: ${location}
- Size: ${property.square_meters ? `${property.square_meters}m²` : 'Well-proportioned'}
- Pricing: ${pricing}

${includeFeatures && features.length > 0 ? `🎯 **Key Features:**
${features.map(f => `- ${f}`).join('\n')}` : ''}

${property.description ? `📝 **Existing Description (for reference):**
${property.description.substring(0, 200)}...` : ''}

Please create a ${format === 'markdown' ? 'Markdown-formatted' : 'HTML-formatted'} description that will attract quality tenants/buyers.`;

  // Call OpenAI API with enhanced error handling
  console.log(`🔄 Generating description for property: ${property.title}`);
  
  let response;
  let data;
  
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: Math.min(1000, Math.ceil(maxLength * 2.5)),
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI API error for ${property.title}:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      // Parse OpenAI error for better error messages
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = { error: { message: errorText } };
      }
      
      const errorMsg = parsedError?.error?.message || `API returned ${response.status}`;
      throw new Error(`OpenAI API error (${response.status}): ${errorMsg}`);
    }

    data = await response.json();
    
  } catch (fetchError) {
    console.error(`❌ Network error generating description for ${property.title}:`, fetchError);
    throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Connection failed'}`);
  }

  const generatedDescription = data.choices?.[0]?.message?.content;

  if (!generatedDescription) {
    console.error(`❌ No description generated for ${property.title}:`, data);
    throw new Error('OpenAI did not generate any description content. Please try again.');
  }

  console.log(`✅ Description generated successfully for: ${property.title} (${generatedDescription.length} chars)`);
  
  // Log the generation for analytics
  try {
    await supabase
      .from('ai_generation_logs')
      .insert({
        property_title: property.title,
        tone: tone,
        format: format,
        language: language,
        character_count: generatedDescription.length,
      });
    console.log(`📊 Logged description generation for: ${property.title}`);
  } catch (logError) {
    console.warn(`⚠️  Failed to log AI usage for ${property.title}:`, logError);
  }

  return new Response(
    JSON.stringify({ 
      description: generatedDescription,
      content: generatedDescription, // For compatibility
      metadata: {
        format,
        language,
        characterCount: generatedDescription.length,
        tone,
        generatedAt: new Date().toISOString()
      }
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}