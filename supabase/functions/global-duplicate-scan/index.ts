import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PropertyData {
  id: string;
  title: string;
  street_name: string;
  street_number?: string;
  city: string;
  zip_code?: string;
  monthly_rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_meters?: number;
  user_id: string;
  created_at: string;
}

interface DuplicateMatch {
  property1: PropertyData;
  property2: PropertyData;
  confidence: number;
  reasons: string[];
}

// Utility function to calculate string similarity
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Normalize text for comparison
function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate if two properties are potential duplicates
function calculateDuplicateScore(prop1: PropertyData, prop2: PropertyData): DuplicateMatch | null {
  const reasons: string[] = [];
  let totalScore = 0;
  let maxPossibleScore = 0;

  // Don't compare properties from the same user (unless specifically requested)
  if (prop1.user_id === prop2.user_id) {
    return null;
  }

  // Title similarity (weight: 30%)
  const titleSimilarity = calculateSimilarity(
    normalizeText(prop1.title), 
    normalizeText(prop2.title)
  );
  if (titleSimilarity >= 0.9) {
    reasons.push('exact_title');
    totalScore += 30;
  } else if (titleSimilarity >= 0.7) {
    reasons.push('similar_title');
    totalScore += titleSimilarity * 30;
  }
  maxPossibleScore += 30;

  // Address similarity (weight: 40%)
  const address1 = `${prop1.street_number || ''} ${prop1.street_name} ${prop1.city}`.trim();
  const address2 = `${prop2.street_number || ''} ${prop2.street_name} ${prop2.city}`.trim();
  const addressSimilarity = calculateSimilarity(
    normalizeText(address1),
    normalizeText(address2)
  );
  
  if (addressSimilarity >= 0.95) {
    reasons.push('exact_address');
    totalScore += 40;
  } else if (addressSimilarity >= 0.8) {
    reasons.push('similar_address');
    totalScore += addressSimilarity * 40;
  }
  maxPossibleScore += 40;

  // Rent similarity (weight: 15%)
  if (prop1.monthly_rent && prop2.monthly_rent) {
    const rentDiff = Math.abs(prop1.monthly_rent - prop2.monthly_rent);
    const avgRent = (prop1.monthly_rent + prop2.monthly_rent) / 2;
    const rentSimilarity = 1 - (rentDiff / avgRent);
    
    if (rentDiff === 0) {
      reasons.push('same_rent');
      totalScore += 15;
    } else if (rentSimilarity >= 0.9) {
      reasons.push('similar_rent');
      totalScore += rentSimilarity * 15;
    }
  }
  maxPossibleScore += 15;

  // Size similarity (weight: 10%)
  if (prop1.square_meters && prop2.square_meters) {
    const sizeDiff = Math.abs(prop1.square_meters - prop2.square_meters);
    const avgSize = (prop1.square_meters + prop2.square_meters) / 2;
    const sizeSimilarity = 1 - (sizeDiff / avgSize);
    
    if (sizeDiff === 0) {
      reasons.push('same_size');
      totalScore += 10;
    } else if (sizeSimilarity >= 0.9) {
      totalScore += sizeSimilarity * 10;
    }
  }
  maxPossibleScore += 10;

  // Bedrooms similarity (weight: 5%)
  if (prop1.bedrooms && prop2.bedrooms) {
    if (prop1.bedrooms === prop2.bedrooms) {
      reasons.push('same_bedrooms');
      totalScore += 5;
    }
  }
  maxPossibleScore += 5;

  const confidence = totalScore / maxPossibleScore;

  // Only return matches with confidence >= 60%
  if (confidence >= 0.6 && reasons.length >= 2) {
    return {
      property1: prop1,
      property2: prop2,
      confidence,
      reasons
    };
  }

  return null;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { trigger, admin_user_id, limit = 1000 } = await req.json()

    console.log(`Starting global duplicate scan (trigger: ${trigger})`)

    // Get all properties for comparison
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .limit(limit)

    if (propertiesError) {
      throw propertiesError
    }

    console.log(`Loaded ${properties.length} properties for comparison`)

    const duplicateMatches: DuplicateMatch[] = []

    // Compare each property with every other property
    for (let i = 0; i < properties.length; i++) {
      for (let j = i + 1; j < properties.length; j++) {
        const match = calculateDuplicateScore(properties[i], properties[j])
        if (match) {
          duplicateMatches.push(match)
        }
      }
    }

    console.log(`Found ${duplicateMatches.length} potential duplicate pairs`)

    // Group duplicates and save to database
    let groupsCreated = 0
    for (const match of duplicateMatches) {
      // Check if a group already exists for these properties
      const { data: existingGroup } = await supabase
        .from('global_duplicate_groups')
        .select('id')
        .eq('status', 'pending')
        .or(`merge_target_property_id.eq.${match.property1.id},merge_target_property_id.eq.${match.property2.id}`)
        .single()

      if (existingGroup) {
        console.log(`Skipping duplicate group - already exists for properties ${match.property1.id}, ${match.property2.id}`)
        continue
      }

      // Create a new duplicate group
      const { data: newGroup, error: groupError } = await supabase
        .from('global_duplicate_groups')
        .insert({
          confidence_score: match.confidence,
          status: 'pending'
        })
        .select()
        .single()

      if (groupError) {
        console.error('Error creating duplicate group:', groupError)
        continue
      }

      // Add properties to the group
      const groupProperties = [
        {
          duplicate_group_id: newGroup.id,
          property_id: match.property1.id,
          similarity_reasons: match.reasons
        },
        {
          duplicate_group_id: newGroup.id,
          property_id: match.property2.id,
          similarity_reasons: match.reasons
        }
      ]

      const { error: propertiesError } = await supabase
        .from('global_duplicate_properties')
        .insert(groupProperties)

      if (propertiesError) {
        console.error('Error adding properties to group:', propertiesError)
        // Clean up the group if we can't add properties
        await supabase
          .from('global_duplicate_groups')
          .delete()
          .eq('id', newGroup.id)
        continue
      }

      groupsCreated++
    }

    // Log the scan
    if (admin_user_id) {
      await supabase
        .from('duplicate_detection_log')
        .insert({
          admin_user_id,
          action_type: 'global_scan',
          affected_properties: properties.map(p => p.id),
          details: {
            trigger,
            properties_scanned: properties.length,
            duplicates_found: duplicateMatches.length,
            groups_created: groupsCreated
          }
        })
    }

    console.log(`Scan complete: ${groupsCreated} duplicate groups created`)

    return new Response(
      JSON.stringify({
        success: true,
        properties_scanned: properties.length,
        duplicates_found: duplicateMatches.length,
        groups_created: groupsCreated
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in global duplicate scan:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})