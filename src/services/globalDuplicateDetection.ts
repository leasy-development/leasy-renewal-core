import { supabase } from "@/integrations/supabase/client";

export interface DuplicateMatch {
  property1: any;
  property2: any;
  confidenceScore: number;
  reasons: string[];
}

export interface GlobalDuplicateGroup {
  id: string;
  confidence_score: number;
  status: string;
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  merge_target_property_id?: string;
  notes?: string;
  properties: any[];
  global_duplicate_properties?: any[];
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
  
  const normalize = (str: string) => str.toLowerCase().replace(/[^\\w\\s]/g, '').split(/\\s+/);
  const tokens1 = new Set(normalize(text1));
  const tokens2 = new Set(normalize(text2));
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
}

// Main duplicate detection function
export async function detectGlobalDuplicates(userId?: string): Promise<DuplicateMatch[]> {
  try {
    // Get properties for specific user only
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
      `);

    // Filter by user if provided, otherwise get current user's properties
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      query = query.eq('user_id', user.id);
    }

    const { data: properties, error } = await query;

    if (error) throw error;
    if (!properties || properties.length < 2) return [];

    const matches: DuplicateMatch[] = [];

    // Compare each property with every other property
    for (let i = 0; i < properties.length; i++) {
      for (let j = i + 1; j < properties.length; j++) {
        const prop1 = properties[i];
        const prop2 = properties[j];

        // Compare properties within the same user's portfolio

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
  } catch (error) {
    console.error('Error detecting duplicates:', error);
    throw error;
  }
}

// Save detected duplicates to database
export async function saveDuplicateGroups(matches: DuplicateMatch[]): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Error saving duplicate groups:', error);
    throw error;
  }
}

// Get all pending duplicate groups for admin review
export async function getPendingDuplicateGroups(): Promise<GlobalDuplicateGroup[]> {
  try {
    const { data: groups, error } = await supabase
      .from('global_duplicate_groups')
      .select(`
        *,
        global_duplicate_properties (
          id,
          property_id,
          similarity_reasons,
          properties (
            *,
            property_media (
              id,
              url,
              media_type,
              title
            )
          )
        )
      `)
      .eq('status', 'pending')
      .order('confidence_score', { ascending: false });

    if (error) throw error;

    return groups?.map(group => ({
      ...group,
      properties: group.global_duplicate_properties?.map(dp => dp.properties) || []
    })) || [];
  } catch (error) {
    console.error('Error fetching duplicate groups:', error);
    throw error;
  }
}

// Merge duplicate properties
export async function mergeDuplicateProperties(
  groupId: string,
  targetPropertyId: string,
  propertiesToMerge: string[],
  mergeReason?: string
): Promise<void> {
  try {
    const adminUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!adminUserId) throw new Error('Admin user not found');

    // Get original property data for tracking
    const { data: originalProperties, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .in('id', propertiesToMerge);

    if (fetchError) throw fetchError;

    // Track merged properties to prevent re-import
    for (const originalProp of originalProperties || []) {
      const fingerprint = await generatePropertyFingerprint(originalProp);
      
      await supabase
        .from('merged_properties_tracking')
        .insert({
          original_property_id: originalProp.id,
          target_property_id: targetPropertyId,
          merged_by: adminUserId,
          original_data: originalProp,
          merge_reason: mergeReason,
          fingerprint
        });
    }

    // Delete merged properties (keep target)
    const propertiesToDelete = propertiesToMerge.filter(id => id !== targetPropertyId);
    if (propertiesToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .in('id', propertiesToDelete);

      if (deleteError) throw deleteError;
    }

    // Update duplicate group status
    const { error: updateError } = await supabase
      .from('global_duplicate_groups')
      .update({
        status: 'merged',
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        merge_target_property_id: targetPropertyId
      })
      .eq('id', groupId);

    if (updateError) throw updateError;

    // Log the action
    await supabase
      .from('duplicate_detection_log')
      .insert({
        action_type: 'merge',
        duplicate_group_id: groupId,
        admin_user_id: adminUserId,
        affected_properties: propertiesToMerge,
        details: {
          target_property_id: targetPropertyId,
          merge_reason: mergeReason
        }
      });

  } catch (error) {
    console.error('Error merging properties:', error);
    throw error;
  }
}

// Dismiss false positive
export async function dismissDuplicateGroup(groupId: string, notes?: string): Promise<void> {
  try {
    const adminUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!adminUserId) throw new Error('Admin user not found');

    const { error } = await supabase
      .from('global_duplicate_groups')
      .update({
        status: 'dismissed',
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        notes
      })
      .eq('id', groupId);

    if (error) throw error;

    // Log the action
    await supabase
      .from('duplicate_detection_log')
      .insert({
        action_type: 'dismiss',
        duplicate_group_id: groupId,
        admin_user_id: adminUserId,
        affected_properties: [],
        details: { notes }
      });

  } catch (error) {
    console.error('Error dismissing duplicate group:', error);
    throw error;
  }
}

// Generate property fingerprint for duplicate prevention
async function generatePropertyFingerprint(property: any): Promise<string> {
  const { data, error } = await supabase.rpc('generate_property_fingerprint', {
    p_title: property.title,
    p_street_name: property.street_name,
    p_street_number: property.street_number,
    p_zip_code: property.zip_code,
    p_city: property.city,
    p_monthly_rent: property.monthly_rent,
    p_bedrooms: property.bedrooms,
    p_square_meters: property.square_meters
  });

  if (error) throw error;
  return data;
}

// Check if property is a previously merged duplicate
export async function checkForMergedDuplicate(property: any): Promise<boolean> {
  try {
    const fingerprint = await generatePropertyFingerprint(property);
    
    const { data, error } = await supabase
      .from('merged_properties_tracking')
      .select('id')
      .eq('fingerprint', fingerprint)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking for merged duplicate:', error);
    return false;
  }
}
