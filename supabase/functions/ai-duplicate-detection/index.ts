import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface Property {
  id: string;
  title: string;
  description?: string;
  street_name?: string;
  street_number?: string;
  city?: string;
  zip_code?: string;
  monthly_rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_meters?: number;
  user_id: string;
}

interface AIAnalysisResult {
  similarity_score: number;
  confidence: number;
  reasons: string[];
  explanation: string;
  recommendation: 'merge' | 'review' | 'dismiss';
}

async function analyzePropertiesWithAI(prop1: Property, prop2: Property): Promise<AIAnalysisResult> {
  const prompt = `
Du bist ein KI-Experte für Immobilien-Duplikatserkennung. Analysiere diese zwei Immobilien-Einträge und bestimme, ob sie Duplikate sind.

IMMOBILIE A:
- Titel: ${prop1.title}
- Beschreibung: ${prop1.description || 'Keine Beschreibung'}
- Adresse: ${prop1.street_number || ''} ${prop1.street_name || ''}, ${prop1.zip_code || ''} ${prop1.city || ''}
- Miete: €${prop1.monthly_rent || 'Nicht angegeben'}/Monat
- Zimmer: ${prop1.bedrooms || 'Nicht angegeben'} Schlafzimmer, ${prop1.bathrooms || 'Nicht angegeben'} Badezimmer
- Fläche: ${prop1.square_meters || 'Nicht angegeben'}m²
- Eigentümer-ID: ${prop1.user_id}

IMMOBILIE B:
- Titel: ${prop2.title}
- Beschreibung: ${prop2.description || 'Keine Beschreibung'}
- Adresse: ${prop2.street_number || ''} ${prop2.street_name || ''}, ${prop2.zip_code || ''} ${prop2.city || ''}
- Miete: €${prop2.monthly_rent || 'Nicht angegeben'}/Monat
- Zimmer: ${prop2.bedrooms || 'Nicht angegeben'} Schlafzimmer, ${prop2.bathrooms || 'Nicht angegeben'} Badezimmer
- Fläche: ${prop2.square_meters || 'Nicht angegeben'}m²
- Eigentümer-ID: ${prop2.user_id}

Analysiere basierend auf:
1. Adress-Übereinstimmung (exakt vs. ähnlich vs. verschieden)
2. Semantische Ähnlichkeit der Titel und Beschreibungen
3. Übereinstimmung der Immobilien-Eigenschaften (Größe, Zimmer, Miete)
4. Wahrscheinlichkeit dass verschiedene Nutzer dieselbe Immobilie eingegeben haben

Antworte im JSON-Format:
{
  "similarity_score": <0-100>,
  "confidence": <0-100>,
  "reasons": ["reason1", "reason2", ...],
  "explanation": "Detaillierte Erklärung der Analyse",
  "recommendation": "merge|review|dismiss"
}

Kriterien:
- merge: >95% sicher dass es Duplikate sind
- review: 85-95% - wahrscheinlich Duplikate, manuelle Überprüfung nötig
- dismiss: <85% - wahrscheinlich keine Duplikate
`;

  try {
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
            content: 'Du bist ein Experte für Immobilien-Duplikatserkennung. Antworte immer in validem JSON-Format.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      similarity_score: Math.min(100, Math.max(0, result.similarity_score)),
      confidence: Math.min(100, Math.max(0, result.confidence)),
      reasons: Array.isArray(result.reasons) ? result.reasons : [],
      explanation: result.explanation || 'Keine Erklärung verfügbar',
      recommendation: ['merge', 'review', 'dismiss'].includes(result.recommendation) 
        ? result.recommendation 
        : 'review'
    };
  } catch (error) {
    console.error('AI Analysis error:', error);
    // Fallback to basic analysis
    return {
      similarity_score: 50,
      confidence: 30,
      reasons: ['AI-Analyse fehlgeschlagen - Fallback zu Basis-Analyse'],
      explanation: 'Die KI-Analyse konnte nicht durchgeführt werden. Verwende manuelle Überprüfung.',
      recommendation: 'review'
    };
  }
}

async function calculateBasicSimilarity(prop1: Property, prop2: Property): Promise<number> {
  let score = 0;
  let maxScore = 0;

  // Address similarity (40% weight)
  maxScore += 40;
  if (prop1.street_name?.toLowerCase() === prop2.street_name?.toLowerCase()) {
    score += 30;
    if (prop1.street_number === prop2.street_number) {
      score += 10;
    }
  }
  if (prop1.city?.toLowerCase() === prop2.city?.toLowerCase()) {
    score += 20;
    maxScore += 20;
  }
  if (prop1.zip_code === prop2.zip_code) {
    score += 20;
    maxScore += 20;
  }

  // Price similarity (20% weight)
  maxScore += 20;
  if (prop1.monthly_rent && prop2.monthly_rent) {
    const priceDiff = Math.abs(prop1.monthly_rent - prop2.monthly_rent);
    const avgPrice = (prop1.monthly_rent + prop2.monthly_rent) / 2;
    if (priceDiff / avgPrice < 0.1) { // Within 10%
      score += 20;
    }
  }

  // Specs similarity (20% weight)
  maxScore += 20;
  if (prop1.bedrooms === prop2.bedrooms) score += 7;
  if (prop1.bathrooms === prop2.bathrooms) score += 6;
  if (prop1.square_meters && prop2.square_meters) {
    const sizeDiff = Math.abs(prop1.square_meters - prop2.square_meters);
    const avgSize = (prop1.square_meters + prop2.square_meters) / 2;
    if (sizeDiff / avgSize < 0.05) score += 7; // Within 5%
  }

  return maxScore > 0 ? (score / maxScore) * 100 : 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();

    if (action === 'detect_duplicates') {
      const { user_id } = params;
      
      if (!user_id) {
        throw new Error('user_id is required for duplicate detection');
      }
      
      console.log(`Starting AI-powered duplicate detection for user: ${user_id}`);
      
      // Get properties for specific user only
      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          id, title, description, street_name, street_number, 
          city, zip_code, monthly_rent, bedrooms, bathrooms, 
          square_meters, user_id
        `)
        .eq('user_id', user_id)
        .neq('status', 'inactive');

      if (error) throw error;
      if (!properties || properties.length < 2) {
        return new Response(JSON.stringify({ 
          matches: [], 
          message: 'Nicht genügend Immobilien für Duplikatserkennung' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const matches = [];
      const processedPairs = new Set();

      console.log(`Analyzing ${properties.length} properties...`);

      // Compare properties in batches to avoid timeouts
      for (let i = 0; i < properties.length; i++) {
        for (let j = i + 1; j < properties.length; j++) {
          const prop1 = properties[i];
          const prop2 = properties[j];
          
          // Compare properties within the same user's portfolio

          const pairKey = `${prop1.id}-${prop2.id}`;
          if (processedPairs.has(pairKey)) continue;
          processedPairs.add(pairKey);

          // Quick basic similarity check first
          const basicScore = await calculateBasicSimilarity(prop1, prop2);
          
          // Only use AI for promising candidates (>70% basic similarity)
          if (basicScore >= 70) {
            console.log(`AI analyzing pair: ${prop1.title} vs ${prop2.title}`);
            
            const aiResult = await analyzePropertiesWithAI(prop1, prop2);
            
            // Only keep high-confidence matches
            if (aiResult.similarity_score >= 85 && aiResult.confidence >= 80) {
              matches.push({
                property1: prop1,
                property2: prop2,
                similarity_score: aiResult.similarity_score,
                confidence: aiResult.confidence,
                reasons: aiResult.reasons,
                explanation: aiResult.explanation,
                recommendation: aiResult.recommendation,
                ai_enhanced: true
              });
            }
          }
        }
      }

      // Sort by confidence and similarity
      matches.sort((a, b) => 
        (b.confidence + b.similarity_score) - (a.confidence + a.similarity_score)
      );

      console.log(`Found ${matches.length} AI-detected duplicate matches`);

      return new Response(JSON.stringify({ 
        matches,
        total_analyzed: properties.length,
        ai_enhanced: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'analyze_pair') {
      const { property1, property2 } = params;
      
      if (!property1 || !property2) {
        throw new Error('Both properties are required for analysis');
      }

      const result = await analyzePropertiesWithAI(property1, property2);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid action specified');

  } catch (error) {
    console.error('Error in AI duplicate detection:', error);
    return new Response(JSON.stringify({ 
      error: 'Duplicate detection failed', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
