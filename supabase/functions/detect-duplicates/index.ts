import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PropertyData {
  id: string;
  title: string;
  description?: string;
  street_name: string;
  street_number?: string;
  city: string;
  zip_code?: string;
  monthly_rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_meters?: number;
  apartment_type?: string;
  user_id: string;
  created_at: string;
  property_media?: Array<{
    id: string;
    url: string;
    media_type: string;
    title?: string;
  }>;
}

interface DuplicateMatch {
  property1: PropertyData;
  property2: PropertyData;
  confidence: number;
  reasons: string[];
  detailedScores: {
    title: number;
    address: number;
    specs: number;
    description: number;
    images: number;
  };
}

interface MediaHash {
  property_id: string;
  media_url: string;
  hash_value: string;
  hash_type: string;
}

// Enhanced Jaro-Winkler similarity algorithm
function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0 || len2 === 0) return 0.0;
  
  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  // Find matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, len2);
    
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0.0;
  
  // Count transpositions
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  
  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  
  // Winkler prefix bonus
  let prefix = 0;
  for (let i = 0; i < Math.min(len1, len2, 4); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  
  return jaro + (0.1 * prefix * (1 - jaro));
}

// Token-based similarity with multiple algorithms
function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const normalize = (str: string) => str.toLowerCase()
    .replace(/[^\\w\\s]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
  
  const norm1 = normalize(text1);
  const norm2 = normalize(text2);
  
  // Exact match
  if (norm1 === norm2) return 1.0;
  
  // Jaro-Winkler similarity
  const jaroScore = jaroWinklerSimilarity(norm1, norm2);
  
  // Token overlap (Jaccard similarity)
  const tokens1 = new Set(norm1.split(' '));
  const tokens2 = new Set(norm2.split(' '));
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  const jaccardScore = union.size > 0 ? intersection.size / union.size : 0;
  
  // Substring containment
  const containmentScore = Math.max(
    norm1.includes(norm2) ? norm2.length / norm1.length : 0,
    norm2.includes(norm1) ? norm1.length / norm2.length : 0
  );
  
  // Weighted combination
  return (jaroScore * 0.5) + (jaccardScore * 0.3) + (containmentScore * 0.2);
}

// Enhanced address similarity with fuzzy matching
function calculateAddressSimilarity(prop1: PropertyData, prop2: PropertyData): number {
  const buildAddress = (p: PropertyData) => {
    const parts = [
      p.street_number || '',
      p.street_name || '',
      p.city || '',
      p.zip_code || ''
    ].filter(Boolean);
    return parts.join(' ').toLowerCase().trim();
  };
  
  const addr1 = buildAddress(prop1);
  const addr2 = buildAddress(prop2);
  
  if (!addr1 || !addr2) return 0;
  
  // Exact match
  if (addr1 === addr2) return 1.0;
  
  // Component-wise matching
  let componentScore = 0;
  let componentCount = 0;
  
  // Street name similarity (most important)
  if (prop1.street_name && prop2.street_name) {
    const streetSimilarity = calculateTextSimilarity(prop1.street_name, prop2.street_name);
    componentScore += streetSimilarity * 0.4;
    componentCount += 0.4;
    
    // Street number exact match bonus
    if (prop1.street_number && prop2.street_number && 
        prop1.street_number === prop2.street_number) {
      componentScore += 0.2;
      componentCount += 0.2;
    }
  }
  
  // City similarity
  if (prop1.city && prop2.city) {
    const citySimilarity = calculateTextSimilarity(prop1.city, prop2.city);
    componentScore += citySimilarity * 0.3;
    componentCount += 0.3;
  }
  
  // ZIP code exact match
  if (prop1.zip_code && prop2.zip_code) {
    const zipMatch = prop1.zip_code === prop2.zip_code ? 1.0 : 0;
    componentScore += zipMatch * 0.1;
    componentCount += 0.1;
  }
  
  // Overall address similarity using Jaro-Winkler
  const overallSimilarity = jaroWinklerSimilarity(addr1, addr2);
  
  // Combine component score with overall similarity
  const finalScore = componentCount > 0 
    ? (componentScore / componentCount * 0.7) + (overallSimilarity * 0.3)
    : overallSimilarity;
  
  return Math.min(finalScore, 1.0);
}

// Property specifications similarity
function calculateSpecsSimilarity(prop1: PropertyData, prop2: PropertyData): number {
  let score = 0;
  let maxScore = 0;
  
  // Bedrooms (exact match preferred)
  if (prop1.bedrooms && prop2.bedrooms) {
    maxScore += 0.25;
    if (prop1.bedrooms === prop2.bedrooms) {
      score += 0.25;
    } else if (Math.abs(prop1.bedrooms - prop2.bedrooms) === 1) {
      score += 0.15; // Close match
    }
  }
  
  // Bathrooms (exact match preferred)
  if (prop1.bathrooms && prop2.bathrooms) {
    maxScore += 0.15;
    if (prop1.bathrooms === prop2.bathrooms) {
      score += 0.15;
    } else if (Math.abs(prop1.bathrooms - prop2.bathrooms) <= 1) {
      score += 0.1; // Close match
    }
  }
  
  // Square meters (within tolerance)
  if (prop1.square_meters && prop2.square_meters) {
    maxScore += 0.3;
    const diff = Math.abs(prop1.square_meters - prop2.square_meters);
    const avgSize = (prop1.square_meters + prop2.square_meters) / 2;
    const tolerance = avgSize * 0.05; // 5% tolerance
    
    if (diff === 0) {
      score += 0.3;
    } else if (diff <= tolerance) {
      score += 0.25;
    } else if (diff <= tolerance * 2) {
      score += 0.15;
    }
  }
  
  // Monthly rent (within tolerance)
  if (prop1.monthly_rent && prop2.monthly_rent) {
    maxScore += 0.3;
    const diff = Math.abs(prop1.monthly_rent - prop2.monthly_rent);
    const avgRent = (prop1.monthly_rent + prop2.monthly_rent) / 2;
    const tolerance = avgRent * 0.1; // 10% tolerance
    
    if (diff === 0) {
      score += 0.3;
    } else if (diff <= tolerance) {
      score += 0.25;
    } else if (diff <= tolerance * 2) {
      score += 0.15;
    }
  }
  
  return maxScore > 0 ? score / maxScore : 0;
}

// Image similarity using URL comparison and hash lookup
async function calculateImageSimilarity(
  prop1: PropertyData, 
  prop2: PropertyData, 
  supabase: any
): Promise<number> {
  const media1 = prop1.property_media || [];
  const media2 = prop2.property_media || [];
  
  if (media1.length === 0 || media2.length === 0) return 0;
  
  let maxSimilarity = 0;
  let exactMatches = 0;
  let totalComparisons = 0;
  
  // Get hashes for both properties if available
  const { data: hashes1 } = await supabase
    .from('property_media_hashes')
    .select('media_url, hash_value, hash_type')
    .eq('property_id', prop1.id);
    
  const { data: hashes2 } = await supabase
    .from('property_media_hashes')
    .select('media_url, hash_value, hash_type')
    .eq('property_id', prop2.id);
  
  const hashMap1 = new Map();
  const hashMap2 = new Map();
  
  (hashes1 || []).forEach((h: MediaHash) => {
    hashMap1.set(h.media_url, h.hash_value);
  });
  
  (hashes2 || []).forEach((h: MediaHash) => {
    hashMap2.set(h.media_url, h.hash_value);
  });
  
  // Compare images
  for (const img1 of media1) {
    for (const img2 of media2) {
      totalComparisons++;
      
      // Exact URL match (same image)
      if (img1.url === img2.url) {
        exactMatches++;
        maxSimilarity = Math.max(maxSimilarity, 1.0);
        continue;
      }
      
      // Hash comparison if available
      const hash1 = hashMap1.get(img1.url);
      const hash2 = hashMap2.get(img2.url);
      
      if (hash1 && hash2) {
        // For blockhash, we can calculate Hamming distance
        const hammingDistance = calculateHammingDistance(hash1, hash2);
        const similarity = 1 - (hammingDistance / hash1.length);
        
        if (similarity > 0.95) { // Very similar images
          exactMatches++;
          maxSimilarity = Math.max(maxSimilarity, similarity);
        } else if (similarity > 0.8) {
          maxSimilarity = Math.max(maxSimilarity, similarity * 0.8);
        }
      }
      
      // Filename similarity (basic fallback)
      const name1 = extractFilename(img1.url);
      const name2 = extractFilename(img2.url);
      if (name1 && name2) {
        const nameSimilarity = calculateTextSimilarity(name1, name2);
        if (nameSimilarity > 0.9) {
          maxSimilarity = Math.max(maxSimilarity, nameSimilarity * 0.6);
        }
      }
    }
  }
  
  // Calculate final image similarity score
  if (exactMatches > 0) {
    const matchRatio = exactMatches / Math.min(media1.length, media2.length);
    return Math.min(matchRatio * 1.2, 1.0); // Boost for exact matches
  }
  
  return Math.min(maxSimilarity, 1.0);
}

// Calculate Hamming distance between two binary strings
function calculateHammingDistance(str1: string, str2: string): number {
  if (str1.length !== str2.length) return Math.max(str1.length, str2.length);
  
  let distance = 0;
  for (let i = 0; i < str1.length; i++) {
    if (str1[i] !== str2[i]) distance++;
  }
  return distance;
}

// Extract filename from URL
function extractFilename(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split('/').pop() || '';
  } catch {
    return url.split('/').pop() || '';
  }
}

// Main duplicate detection function
async function calculateDuplicateScore(
  prop1: PropertyData, 
  prop2: PropertyData, 
  supabase: any,
  includeIntraUser = false
): Promise<DuplicateMatch | null> {
  
  // Skip same property
  if (prop1.id === prop2.id) return null;
  
  // Skip properties from same user unless specifically requested
  if (!includeIntraUser && prop1.user_id === prop2.user_id) return null;
  
  const reasons: string[] = [];
  const detailedScores = {
    title: 0,
    address: 0,
    specs: 0,
    description: 0,
    images: 0
  };
  
  // Title similarity (30% weight)
  const titleScore = calculateTextSimilarity(prop1.title, prop2.title);
  detailedScores.title = titleScore;
  if (titleScore >= 0.95) {
    reasons.push('identical_title');
  } else if (titleScore >= 0.8) {
    reasons.push('very_similar_title');
  } else if (titleScore >= 0.6) {
    reasons.push('similar_title');
  }
  
  // Address similarity (35% weight)
  const addressScore = calculateAddressSimilarity(prop1, prop2);
  detailedScores.address = addressScore;
  if (addressScore >= 0.95) {
    reasons.push('identical_address');
  } else if (addressScore >= 0.8) {
    reasons.push('very_similar_address');
  } else if (addressScore >= 0.6) {
    reasons.push('similar_address');
  }
  
  // Property specs similarity (20% weight)
  const specsScore = calculateSpecsSimilarity(prop1, prop2);
  detailedScores.specs = specsScore;
  if (specsScore >= 0.9) {
    reasons.push('identical_specifications');
  } else if (specsScore >= 0.7) {
    reasons.push('similar_specifications');
  }
  
  // Description similarity (10% weight)
  let descriptionScore = 0;
  if (prop1.description && prop2.description) {
    descriptionScore = calculateTextSimilarity(prop1.description, prop2.description);
    detailedScores.description = descriptionScore;
    if (descriptionScore >= 0.8) {
      reasons.push('very_similar_description');
    } else if (descriptionScore >= 0.6) {
      reasons.push('similar_description');
    }
  }
  
  // Image similarity (5% weight)
  const imageScore = await calculateImageSimilarity(prop1, prop2, supabase);
  detailedScores.images = imageScore;
  if (imageScore >= 0.9) {
    reasons.push('identical_images');
  } else if (imageScore >= 0.7) {
    reasons.push('similar_images');
  }
  
  // Calculate weighted confidence score
  const confidence = 
    (titleScore * 0.30) +
    (addressScore * 0.35) +
    (specsScore * 0.20) +
    (descriptionScore * 0.10) +
    (imageScore * 0.05);
  
  // Minimum thresholds for duplicate detection
  const isHighConfidence = confidence >= 0.85;
  const isMediumConfidence = confidence >= 0.70 && reasons.length >= 2;
  const hasStrongIndicators = (titleScore >= 0.8 && addressScore >= 0.8) || 
                              (addressScore >= 0.95) ||
                              (imageScore >= 0.9);
  
  if (isHighConfidence || isMediumConfidence || hasStrongIndicators) {
    return {
      property1: prop1,
      property2: prop2,
      confidence: Math.round(confidence * 10000) / 10000, // 4 decimal places
      reasons,
      detailedScores
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

    const { 
      trigger, 
      admin_user_id, 
      limit = 1000,
      include_intra_user = false,
      property_filter = null,
      threshold = 0.7
    } = await req.json()

    console.log(`🔍 Starting enhanced duplicate scan (trigger: ${trigger})`)

    let query = supabase
      .from('properties')
      .select(`
        *,
        property_media (
          id,
          url,
          media_type,
          title
        )
      `)
      .limit(limit);

    // Apply filters if specified
    if (property_filter) {
      if (property_filter.created_since) {
        query = query.gte('created_at', property_filter.created_since);
      }
      if (property_filter.user_id) {
        query = query.eq('user_id', property_filter.user_id);
      }
      if (property_filter.status) {
        query = query.eq('status', property_filter.status);
      }
    }

    const { data: properties, error: propertiesError } = await query;

    if (propertiesError) {
      throw propertiesError
    }

    console.log(`📊 Loaded ${properties.length} properties for enhanced analysis`)

    const duplicateMatches: DuplicateMatch[] = []
    let comparisonsCount = 0;

    // Compare each property with every other property
    for (let i = 0; i < properties.length; i++) {
      for (let j = i + 1; j < properties.length; j++) {
        comparisonsCount++;
        
        const match = await calculateDuplicateScore(
          properties[i], 
          properties[j], 
          supabase,
          include_intra_user
        );
        
        if (match && match.confidence >= threshold) {
          duplicateMatches.push(match);
        }
        
        // Progress logging for large batches
        if (comparisonsCount % 1000 === 0) {
          console.log(`🔄 Processed ${comparisonsCount} comparisons...`);
        }
      }
    }

    console.log(`✅ Analysis complete: ${duplicateMatches.length} potential duplicates found from ${comparisonsCount} comparisons`)

    // Sort by confidence (highest first)
    duplicateMatches.sort((a, b) => b.confidence - a.confidence);

    // Group duplicates and save to database
    let groupsCreated = 0;
    let groupsSkipped = 0;

    for (const match of duplicateMatches) {
      // Check if a group already exists for these properties
      const { data: existingGroups } = await supabase
        .from('global_duplicate_groups')
        .select(`
          id,
          global_duplicate_properties!inner(property_id)
        `)
        .eq('status', 'pending')
        .or(`global_duplicate_properties.property_id.eq.${match.property1.id},global_duplicate_properties.property_id.eq.${match.property2.id}`);

      if (existingGroups && existingGroups.length > 0) {
        groupsSkipped++;
        continue;
      }

      // Create a new duplicate group
      const { data: newGroup, error: groupError } = await supabase
        .from('global_duplicate_groups')
        .insert({
          confidence_score: match.confidence,
          status: 'pending'
        })
        .select()
        .single();

      if (groupError) {
        console.error('❌ Error creating duplicate group:', groupError);
        continue;
      }

      // Add properties to the group with detailed similarity data
      const groupProperties = [
        {
          duplicate_group_id: newGroup.id,
          property_id: match.property1.id,
          similarity_reasons: [
            ...match.reasons,
            `title_score:${match.detailedScores.title.toFixed(3)}`,
            `address_score:${match.detailedScores.address.toFixed(3)}`,
            `specs_score:${match.detailedScores.specs.toFixed(3)}`,
            `description_score:${match.detailedScores.description.toFixed(3)}`,
            `images_score:${match.detailedScores.images.toFixed(3)}`
          ]
        },
        {
          duplicate_group_id: newGroup.id,
          property_id: match.property2.id,
          similarity_reasons: [
            ...match.reasons,
            `title_score:${match.detailedScores.title.toFixed(3)}`,
            `address_score:${match.detailedScores.address.toFixed(3)}`,
            `specs_score:${match.detailedScores.specs.toFixed(3)}`,
            `description_score:${match.detailedScores.description.toFixed(3)}`,
            `images_score:${match.detailedScores.images.toFixed(3)}`
          ]
        }
      ];

      const { error: propertiesError } = await supabase
        .from('global_duplicate_properties')
        .insert(groupProperties);

      if (propertiesError) {
        console.error('❌ Error adding properties to group:', propertiesError);
        // Clean up the group if we can't add properties
        await supabase
          .from('global_duplicate_groups')
          .delete()
          .eq('id', newGroup.id);
        continue;
      }

      groupsCreated++;
    }

    // Log the scan with enhanced details
    if (admin_user_id) {
      await supabase
        .from('duplicate_detection_log')
        .insert({
          admin_user_id,
          action_type: 'enhanced_global_scan',
          affected_properties: properties.map(p => p.id),
          details: {
            trigger,
            properties_scanned: properties.length,
            comparisons_made: comparisonsCount,
            duplicates_found: duplicateMatches.length,
            groups_created: groupsCreated,
            groups_skipped: groupsSkipped,
            threshold_used: threshold,
            include_intra_user,
            filters: property_filter,
            algorithm_version: '2.0_enhanced'
          }
        });
    }

    console.log(`🎉 Enhanced scan complete: ${groupsCreated} duplicate groups created, ${groupsSkipped} skipped (already exist)`)

    return new Response(
      JSON.stringify({
        success: true,
        properties_scanned: properties.length,
        comparisons_made: comparisonsCount,
        duplicates_found: duplicateMatches.length,
        groups_created: groupsCreated,
        groups_skipped: groupsSkipped,
        algorithm_version: '2.0_enhanced',
        top_matches: duplicateMatches.slice(0, 5).map(m => ({
          confidence: m.confidence,
          reasons: m.reasons,
          property1_title: m.property1.title,
          property2_title: m.property2.title,
          detailed_scores: m.detailedScores
        }))
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 Error in enhanced duplicate scan:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        algorithm_version: '2.0_enhanced'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})