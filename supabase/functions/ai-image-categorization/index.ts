import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, property_id } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Analyzing image:', imageUrl);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at categorizing room images for real estate listings. 

Your task is to analyze the image and classify it into ONE of these categories:
- main_bedroom: Primary bedroom, master bedroom
- second_bedroom: Secondary bedroom, guest bedroom
- third_bedroom: Third bedroom, children's room
- main_bathroom: Primary bathroom, master bathroom
- second_bathroom: Secondary bathroom, guest bathroom
- kitchen: Kitchen, kitchenette
- living_room: Living room, lounge, family room
- dining_room: Dining room, dining area
- balcony: Balcony, small outdoor terrace
- terrace: Terrace, patio, large outdoor area
- entrance: Entrance, foyer, entryway, front door
- hallway: Hallway, corridor, passage
- outside: Exterior view, building facade, garden
- storage: Storage room, closet, pantry, utility room
- other: Anything that doesn't fit the above categories

Return your response as a JSON object with:
{
  "category": "category_name",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why you chose this category"
}

Confidence should be between 0.0 and 1.0. Only assign high confidence (>0.8) if you're very certain.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please categorize this room image:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'low'
                }
              }
            ]
          }
        ],
        max_tokens: 200,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze image' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No analysis result received' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('OpenAI response:', content);

    // Parse the JSON response from OpenAI
    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      // Fallback parsing - extract category if JSON parsing fails
      const categoryMatch = content.match(/"category":\s*"([^"]+)"/);
      const confidenceMatch = content.match(/"confidence":\s*([0-9.]+)/);
      
      analysisResult = {
        category: categoryMatch ? categoryMatch[1] : 'other',
        confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5,
        reasoning: 'Fallback parsing used'
      };
    }

    // Validate the category
    const validCategories = [
      'main_bedroom', 'second_bedroom', 'third_bedroom',
      'main_bathroom', 'second_bathroom', 'kitchen',
      'living_room', 'dining_room', 'balcony', 'terrace',
      'entrance', 'hallway', 'outside', 'storage', 'other'
    ];

    if (!validCategories.includes(analysisResult.category)) {
      console.warn('Invalid category received:', analysisResult.category);
      analysisResult.category = 'other';
      analysisResult.confidence = Math.max(0, analysisResult.confidence - 0.3);
    }

    // Ensure confidence is within valid range
    if (typeof analysisResult.confidence !== 'number' || 
        analysisResult.confidence < 0 || 
        analysisResult.confidence > 1) {
      analysisResult.confidence = 0.5;
    }

    console.log('Final analysis result:', analysisResult);

    return new Response(
      JSON.stringify({
        category: analysisResult.category,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning || 'AI-generated categorization',
        property_id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in AI categorization function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});