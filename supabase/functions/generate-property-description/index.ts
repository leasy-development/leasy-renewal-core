import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropertyData {
  title: string;
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
  property: PropertyData;
  tone?: string;
  format?: 'markdown' | 'html';
  language?: 'en' | 'de' | 'fr' | 'es';
  maxLength?: number;
  includeFeatures?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      property, 
      tone = 'professional and premium',
      format = 'html',
      language = 'en',
      maxLength = 500,
      includeFeatures = true
    }: GenerationRequest = await req.json();

    console.log('🤖 Generating AI description for property:', property.title);

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

    // Language-specific prompts
    const languagePrompts = {
      en: {
        system: `You are a professional real estate copywriter specializing in premium property listings. Write compelling, accurate descriptions that highlight unique selling points while maintaining authenticity. ${tone ? `Tone: ${tone}` : 'Use a professional and premium tone.'}`,
        format: format === 'markdown' ? 'Format the response in clean Markdown with appropriate headers and bullet points.' : 'Format the response as clean HTML suitable for web display.',
        maxLength: `Keep it concise, around ${maxLength} characters maximum.`
      },
      de: {
        system: `Sie sind ein professioneller Immobilien-Texter, der sich auf Premium-Immobilienanzeigen spezialisiert hat. ${tone ? `Ton: ${tone}` : 'Verwenden Sie einen professionellen und hochwertigen Ton.'}`,
        format: format === 'markdown' ? 'Formatieren Sie die Antwort in sauberem Markdown.' : 'Formatieren Sie die Antwort als sauberes HTML.',
        maxLength: `Halten Sie es prägnant, maximal ${maxLength} Zeichen.`
      },
      fr: {
        system: `Vous êtes un rédacteur immobilier professionnel spécialisé dans les annonces haut de gamme. ${tone ? `Ton: ${tone}` : 'Utilisez un ton professionnel et premium.'}`,
        format: format === 'markdown' ? 'Formatez la réponse en Markdown propre.' : 'Formatez la réponse en HTML propre.',
        maxLength: `Restez concis, maximum ${maxLength} caractères.`
      },
      es: {
        system: `Eres un redactor inmobiliario profesional especializado en propiedades premium. ${tone ? `Tono: ${tone}` : 'Usa un tono profesional y premium.'}`,
        format: format === 'markdown' ? 'Formatea la respuesta en Markdown limpio.' : 'Formatea la respuesta como HTML limpio.',
        maxLength: `Mantén la concisión, máximo ${maxLength} caracteres.`
      }
    };

    const prompts = languagePrompts[language] || languagePrompts.en;

    const systemPrompt = `${prompts.system}

Key requirements:
- Highlight unique selling points and premium features
- Create emotional connection while staying factual
- ${prompts.format}
- ${prompts.maxLength}
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

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast and cost-effective
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: Math.min(1000, Math.ceil(maxLength * 2.5)), // Account for formatting
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const generatedDescription = data.choices[0]?.message?.content;

    if (!generatedDescription) {
      throw new Error('No description generated by AI');
    }

    console.log('✅ AI description generated successfully');

    // Log usage for analytics (optional)
    try {
      await supabase
        .from('ai_generation_logs')
        .insert({
          property_title: property.title,
          tone,
          format,
          language,
          character_count: generatedDescription.length,
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.warn('Failed to log AI usage:', logError);
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({ 
        description: generatedDescription,
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

  } catch (error) {
    console.error('Error generating property description:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate description',
        details: error instanceof Error ? error.message : 'Unknown error',
        fallback: "Beautiful property in an excellent location with modern amenities and great potential. Contact us for more details and to schedule a viewing."
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});