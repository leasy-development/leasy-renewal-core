import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface DuplicateMatch {
  property1: any;
  property2: any;
  confidenceScore: number;
  reasons: string[];
}

// Calculate similarity score between two addresses
function calculateAddressSimilarity(addr1: any, addr2: any): number {
  const normalize = (str: string) => str?.toLowerCase().trim() || '';
  
  let score = 0;
  let maxScore = 0;

  // Street match (weighted heavily)
  maxScore += 40;
  if (normalize(addr1.street_name) === normalize(addr2.street_name)) {
    score += 40;
    if (normalize(addr1.street_number) === normalize(addr2.street_number)) {
      score += 20; // Bonus for exact address
      maxScore += 20;
    }
  }

  // City match
  maxScore += 20;
  if (normalize(addr1.city) === normalize(addr2.city)) {
    score += 20;
  }

  // ZIP code match
  maxScore += 20;
  if (normalize(addr1.zip_code) === normalize(addr2.zip_code)) {
    score += 20;
  }

  // Region/Country match
  maxScore += 20;
  if (normalize(addr1.region) === normalize(addr2.region)) {
    score += 10;
  }
  if (normalize(addr1.country) === normalize(addr2.country)) {
    score += 10;
  }

  return maxScore > 0 ? (score / maxScore) * 100 : 0;
}

// Calculate similarity between property specs
function calculateSpecsSimilarity(prop1: any, prop2: any): number {
  let score = 0;
  let maxScore = 0;

  // Bedrooms match
  maxScore += 25;
  if (prop1.bedrooms === prop2.bedrooms) {
    score += 25;
  }

  // Bathrooms match
  maxScore += 15;
  if (prop1.bathrooms === prop2.bathrooms) {
    score += 15;
  }

  // Square meters match (within 5% tolerance)
  maxScore += 30;
  if (prop1.square_meters && prop2.square_meters) {
    const diff = Math.abs(prop1.square_meters - prop2.square_meters);
    const tolerance = Math.max(prop1.square_meters, prop2.square_meters) * 0.05;
    if (diff <= tolerance) {
      score += 30;
    }
  }

  // Monthly rent match (within 10% tolerance)
  maxScore += 30;
  if (prop1.monthly_rent && prop2.monthly_rent) {
    const diff = Math.abs(prop1.monthly_rent - prop2.monthly_rent);
    const tolerance = Math.max(prop1.monthly_rent, prop2.monthly_rent) * 0.10;
    if (diff <= tolerance) {
      score += 30;
    }
  }

  return maxScore > 0 ? (score / maxScore) * 100 : 0;
}

// Calculate text similarity using simple token overlap
function calculateTextSimilarity(text1?: string, text2?: string): number {
  if (!text1 || !text2) return 0;
  
  const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  const tokens1 = new Set(normalize(text1));
  const tokens2 = new Set(normalize(text2));
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
}

// Main duplicate detection function
async function detectGlobalDuplicates(supabase: any): Promise<DuplicateMatch[]> {
  // Get all properties across all users
  const { data: properties, error } = await supabase
    .from('properties')
    .select(`
      *,
      property_media (
        id,
        url,
        media_type,
        title
      )
    `);

  if (error) throw error;
  if (!properties || properties.length < 2) return [];

  const matches: DuplicateMatch[] = [];

  // Compare each property with every other property
  for (let i = 0; i < properties.length; i++) {
    for (let j = i + 1; j < properties.length; j++) {
      const prop1 = properties[i];
      const prop2 = properties[j];

      // Skip if same user (handled by user-scoped detection)
      if (prop1.user_id === prop2.user_id) continue;

      const reasons: string[] = [];
      let totalScore = 0;
      let scoreComponents = 0;

      // Address similarity (40% weight)
      const addressScore = calculateAddressSimilarity(prop1, prop2);
      if (addressScore > 70) {
        totalScore += addressScore * 0.4;
        scoreComponents++;
        reasons.push(`Address similarity: ${addressScore.toFixed(1)}%`);
      }

      // Property specs similarity (35% weight)
      const specsScore = calculateSpecsSimilarity(prop1, prop2);
      if (specsScore > 60) {
        totalScore += specsScore * 0.35;
        scoreComponents++;
        reasons.push(`Property specs similarity: ${specsScore.toFixed(1)}%`);
      }

      // Title similarity (15% weight)
      const titleScore = calculateTextSimilarity(prop1.title, prop2.title);
      if (titleScore > 40) {
        totalScore += titleScore * 0.15;
        scoreComponents++;
        reasons.push(`Title similarity: ${titleScore.toFixed(1)}%`);
      }

      // Description similarity (10% weight)
      const descScore = calculateTextSimilarity(prop1.description, prop2.description);
      if (descScore > 30) {
        totalScore += descScore * 0.10;
        scoreComponents++;
        reasons.push(`Description similarity: ${descScore.toFixed(1)}%`);
      }

      // Only consider it a match if we have at least 2 scoring components
      // and confidence is above 85%
      if (scoreComponents >= 2 && totalScore >= 85) {
        matches.push({
          property1: prop1,
          property2: prop2,
          confidenceScore: Math.round(totalScore * 100) / 100,
          reasons
        });
      }
    }
  }

  return matches.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

// Save detected duplicates to database
async function saveDuplicateGroups(supabase: any, matches: DuplicateMatch[]): Promise<void> {
  for (const match of matches) {
    // Create duplicate group
    const { data: group, error: groupError } = await supabase
      .from('global_duplicate_groups')
      .insert({
        confidence_score: match.confidenceScore,
        status: 'pending'
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Add properties to group
    const { error: propertiesError } = await supabase
      .from('global_duplicate_properties')
      .insert([
        {
          duplicate_group_id: group.id,
          property_id: match.property1.id,
          similarity_reasons: match.reasons
        },
        {
          duplicate_group_id: group.id,
          property_id: match.property2.id,
          similarity_reasons: match.reasons
        }
      ]);

    if (propertiesError) throw propertiesError;
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Verify admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check if user has admin role
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .limit(1);

    if (roleError || !roles || roles.length === 0) {
      return new Response('Forbidden - Admin access required', { status: 403 });
    }

    console.log('Starting global duplicate detection scan...');

    // Run duplicate detection
    const matches = await detectGlobalDuplicates(supabase);
    
    if (matches.length === 0) {
      console.log('No duplicates found');
      return new Response(JSON.stringify({
        success: true,
        message: 'No duplicates found',
        duplicatesFound: 0
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Save duplicate groups
    await saveDuplicateGroups(supabase, matches);

    // Log the scan action
    await supabase
      .from('duplicate_detection_log')
      .insert({
        action_type: 'scan',
        admin_user_id: user.id,
        affected_properties: [],
        details: {
          duplicates_found: matches.length,
          scan_trigger: 'api'
        }
      });

    console.log(`Found and saved ${matches.length} duplicate groups`);

    return new Response(JSON.stringify({
      success: true,
      message: `Found ${matches.length} potential duplicate groups`,
      duplicatesFound: matches.length,
      groups: matches.map(match => ({
        confidence: match.confidenceScore,
        reasons: match.reasons,
        properties: [match.property1.id, match.property2.id]
      }))
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in global duplicate scan:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});