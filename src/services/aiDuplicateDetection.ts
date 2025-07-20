import { supabase } from "@/integrations/supabase/client";

export interface AIDetectionResult {
  property1: any;
  property2: any;
  similarity_score: number;
  confidence: number;
  reasons: string[];
  explanation: string;
  recommendation: 'merge' | 'review' | 'dismiss';
  ai_enhanced: boolean;
}

export interface AIDetectionResponse {
  matches: AIDetectionResult[];
  total_analyzed: number;
  ai_enhanced: boolean;
}

// AI-powered duplicate detection
export async function detectDuplicatesWithAI(): Promise<AIDetectionResponse> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.functions.invoke('ai-duplicate-detection', {
      body: { 
        action: 'detect_duplicates',
        user_id: user.id
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('AI duplicate detection failed:', error);
    throw new Error(`AI-Duplikatserkennung fehlgeschlagen: ${error.message}`);
  }
}

// Analyze specific property pair with AI
export async function analyzePropertyPair(property1: any, property2: any): Promise<AIDetectionResult> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-duplicate-detection', {
      body: { 
        action: 'analyze_pair',
        property1,
        property2
      },
    });

    if (error) throw error;
    return {
      property1,
      property2,
      ...data,
      ai_enhanced: true
    };
  } catch (error) {
    console.error('AI pair analysis failed:', error);
    throw new Error(`KI-Paaranalyse fehlgeschlagen: ${error.message}`);
  }
}

// Save AI-detected duplicates to database with enhanced metadata
export async function saveAIDuplicateGroups(matches: AIDetectionResult[]): Promise<void> {
  try {
    for (const match of matches) {
      // Create duplicate group with AI metadata
      const { data: group, error: groupError } = await supabase
        .from('global_duplicate_groups')
        .insert({
          confidence_score: match.confidence,
          status: match.recommendation === 'merge' ? 'pending' : 'pending',
          notes: `AI-Analyse: ${match.explanation}`
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add properties to group with AI reasoning
      const { error: propertiesError } = await supabase
        .from('global_duplicate_properties')
        .insert([
          {
            duplicate_group_id: group.id,
            property_id: match.property1.id,
            similarity_reasons: [
              `KI-Konfidenz: ${match.confidence}%`,
              `Ähnlichkeit: ${match.similarity_score}%`,
              `Empfehlung: ${match.recommendation}`,
              ...match.reasons
            ]
          },
          {
            duplicate_group_id: group.id,
            property_id: match.property2.id,
            similarity_reasons: [
              `KI-Konfidenz: ${match.confidence}%`,
              `Ähnlichkeit: ${match.similarity_score}%`,
              `Empfehlung: ${match.recommendation}`,
              ...match.reasons
            ]
          }
        ]);

      if (propertiesError) throw propertiesError;

      // Log AI detection
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        await supabase
          .from('duplicate_detection_log')
          .insert({
            action_type: 'ai_detection',
            admin_user_id: user.data.user.id,
            affected_properties: [match.property1.id, match.property2.id],
            details: {
              ai_confidence: match.confidence,
              similarity_score: match.similarity_score,
              recommendation: match.recommendation,
              explanation: match.explanation,
              reasons: match.reasons
            }
          });
      }
    }
  } catch (error) {
    console.error('Error saving AI duplicate groups:', error);
    throw error;
  }
}

// Get AI detection statistics
export async function getAIDetectionStats(): Promise<{
  total_ai_detections: number;
  high_confidence_matches: number;
  avg_confidence: number;
  recommendations: { merge: number; review: number; dismiss: number };
}> {
  try {
    const { data: logs, error } = await supabase
      .from('duplicate_detection_log')
      .select('details')
      .eq('action_type', 'ai_detection')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    if (error) throw error;

    const stats = {
      total_ai_detections: logs?.length || 0,
      high_confidence_matches: 0,
      avg_confidence: 0,
      recommendations: { merge: 0, review: 0, dismiss: 0 }
    };

    if (logs && logs.length > 0) {
      let totalConfidence = 0;
      
      logs.forEach(log => {
        const details = log.details as any;
        if (details.ai_confidence) {
          totalConfidence += details.ai_confidence;
          if (details.ai_confidence >= 90) {
            stats.high_confidence_matches++;
          }
        }
        if (details.recommendation) {
          stats.recommendations[details.recommendation as keyof typeof stats.recommendations]++;
        }
      });

      stats.avg_confidence = Math.round(totalConfidence / logs.length);
    }

    return stats;
  } catch (error) {
    console.error('Error getting AI detection stats:', error);
    return {
      total_ai_detections: 0,
      high_confidence_matches: 0,
      avg_confidence: 0,
      recommendations: { merge: 0, review: 0, dismiss: 0 }
    };
  }
}