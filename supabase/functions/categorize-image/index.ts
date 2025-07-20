import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ROOM_CATEGORIES = [
  'bedroom', 'bathroom', 'kitchen', 'living_room', 'dining_room',
  'office', 'balcony', 'exterior', 'common_area', 'other'
];

const CONFIDENCE_THRESHOLD = 0.8;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { image_url, property_id } = await req.json();

    if (!image_url) {
      return new Response(JSON.stringify({ 
        error: 'Missing image_url parameter' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Categorizing image:', image_url);

    // Get active model version
    const { data: activeModel } = await supabase
      .from('ai_model_versions')
      .select('*')
      .eq('model_type', 'image_classification')
      .eq('is_active', true)
      .single();

    if (!activeModel) {
      return new Response(JSON.stringify({ 
        error: 'No active model available' 
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // In a real implementation, this would:
    // 1. Download image from URL
    // 2. Preprocess image (resize, normalize)
    // 3. Load trained EfficientNet model from storage
    // 4. Run inference
    // 5. Return prediction with confidence

    // Simulate inference with retry logic
    let prediction;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        
        // Mock prediction based on image URL patterns
        let category = 'other';
        let confidence = 0.5 + Math.random() * 0.4;

        // Simple heuristics for demo purposes
        const urlLower = image_url.toLowerCase();
        if (urlLower.includes('bedroom') || urlLower.includes('bed')) {
          category = 'bedroom';
          confidence = 0.85 + Math.random() * 0.1;
        } else if (urlLower.includes('bathroom') || urlLower.includes('bath')) {
          category = 'bathroom';
          confidence = 0.82 + Math.random() * 0.1;
        } else if (urlLower.includes('kitchen')) {
          category = 'kitchen';
          confidence = 0.88 + Math.random() * 0.1;
        } else if (urlLower.includes('living')) {
          category = 'living_room';
          confidence = 0.81 + Math.random() * 0.1;
        }

        prediction = {
          category,
          confidence: Math.min(confidence, 0.95),
          model_version: activeModel.version_name,
          auto_apply: confidence >= CONFIDENCE_THRESHOLD
        };

        break;
      } catch (error) {
        console.log(`Inference attempt ${attempts} failed:`, error);
        if (attempts >= maxAttempts) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    // Store categorization result
    if (property_id && prediction) {
      const { error: insertError } = await supabase
        .from('image_categorization')
        .insert({
          property_id,
          image_url,
          predicted_category: prediction.category,
          confidence_score: prediction.confidence,
          is_auto_assigned: prediction.auto_apply,
          model_version: prediction.model_version,
          final_category: prediction.auto_apply ? prediction.category : null
        });

      if (insertError) {
        console.error('Failed to store categorization:', insertError);
      }
    }

    console.log('Categorization result:', prediction);

    return new Response(JSON.stringify({
      ...prediction,
      reasoning: `Predicted as ${prediction.category} with ${(prediction.confidence * 100).toFixed(1)}% confidence using ${activeModel.version_name}`,
      property_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Categorization error:', error);
    return new Response(JSON.stringify({ 
      error: 'Categorization failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});