import { supabase } from '@/integrations/supabase/client';
import { MappingType } from '@/types/mapping';

interface LogMappingParams {
  userId: string;
  sourceField: string;
  targetField: string;
  confidence?: number;
  mappingType?: MappingType;
}

/**
 * Logs a mapping training entry to the database
 * This will automatically trigger the suggestion system via database triggers
 */
export async function logMappingTraining({
  userId,
  sourceField,
  targetField,
  confidence = 100,
  mappingType = 'manual'
}: LogMappingParams) {
  try {
    const { data, error } = await supabase
      .from('mapping_training_log')
      .insert([
        {
          user_id: userId,
          source_field: sourceField,
          target_field: targetField,
          match_confidence: confidence,
          mapping_type: mappingType
        }
      ])
      .select();

    if (error) {
      console.error('Failed to log mapping training:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error logging mapping training:', error);
    return { success: false, error };
  }
}

/**
 * Logs multiple mapping training entries in a batch
 */
export async function logMappingTrainingBatch(
  userId: string,
  mappings: Array<{
    sourceField: string;
    targetField: string;
    confidence?: number;
    mappingType?: MappingType;
  }>
) {
  try {
    const records = mappings.map(mapping => ({
      user_id: userId,
      source_field: mapping.sourceField,
      target_field: mapping.targetField,
      match_confidence: mapping.confidence ?? 100,
      mapping_type: mapping.mappingType ?? 'manual'
    }));

    const { data, error } = await supabase
      .from('mapping_training_log')
      .insert(records)
      .select();

    if (error) {
      console.error('Failed to log mapping training batch:', error);
      throw error;
    }

    return { success: true, data, count: records.length };
  } catch (error) {
    console.error('Error logging mapping training batch:', error);
    return { success: false, error };
  }
}

/**
 * Gets mapping suggestions based on source field patterns
 */
export async function getMappingSuggestions(sourceField: string, limit = 5) {
  try {
    const normalizedField = sourceField.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    const { data, error } = await supabase
      .from('field_mapping_suggestions')
      .select('source_field, target_field, score, usage_count')
      .ilike('source_field', `%${normalizedField}%`)
      .order('score', { ascending: false })
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get mapping suggestions:', error);
      throw error;
    }

    return { success: true, suggestions: data || [] };
  } catch (error) {
    console.error('Error getting mapping suggestions:', error);
    return { success: false, error, suggestions: [] };
  }
}

/**
 * Gets user's personal mapping history
 */
export async function getUserMappingHistory(userId: string, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('mapping_training_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get user mapping history:', error);
      throw error;
    }

    return { success: true, history: data || [] };
  } catch (error) {
    console.error('Error getting user mapping history:', error);
    return { success: false, error, history: [] };
  }
}