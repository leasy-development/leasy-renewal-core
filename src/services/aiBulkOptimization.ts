import { supabase } from '@/integrations/supabase/client';

export interface AIGenerationQueueItem {
  id: string;
  property_id: string;
  user_id: string;
  type: 'title' | 'description' | 'meta_description' | 'summary' | 'tags' | 'translation';
  target_language?: 'en' | 'de';
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error_message?: string;
  attempts: number;
  max_attempts: number;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface AIOptimizationStats {
  total_properties: number;
  ai_ready: number;
  ai_optimized: number;
  missing_translations: number;
  low_quality_scores: number;
  queue_pending: number;
}

export interface PropertyAIStatus {
  id: string;
  title: string;
  city: string;
  ai_ready: boolean;
  ai_optimized: boolean;
  content_quality_score: number;
  translation_verified: boolean;
  listing_segment?: string;
  has_german: boolean;
  has_english: boolean;
  queue_items: AIGenerationQueueItem[];
}

export class AIBulkOptimizationService {
  /**
   * Get AI optimization statistics for the current user
   */
  static async getOptimizationStats(userId: string): Promise<AIOptimizationStats> {
    // Get property statistics
    const { data: properties, error } = await supabase
      .from('properties')
      .select('ai_ready, ai_optimized, content_quality_score, title_de, title_en, description_de, description_en')
      .eq('user_id', userId);

    if (error) throw error;

    // Get queue statistics
    const { data: queueItems, error: queueError } = await supabase
      .from('ai_generation_queue')
      .select('status')
      .eq('user_id', userId)
      .in('status', ['queued', 'in_progress']);

    if (queueError) throw queueError;

    const stats: AIOptimizationStats = {
      total_properties: properties?.length || 0,
      ai_ready: properties?.filter(p => p.ai_ready).length || 0,
      ai_optimized: properties?.filter(p => p.ai_optimized).length || 0,
      missing_translations: properties?.filter(p => 
        (!p.title_de && !p.title_en) || (!p.description_de && !p.description_en)
      ).length || 0,
      low_quality_scores: properties?.filter(p => 
        p.content_quality_score < 70
      ).length || 0,
      queue_pending: queueItems?.length || 0
    };

    return stats;
  }

  /**
   * Get detailed property AI status
   */
  static async getPropertiesAIStatus(userId: string): Promise<PropertyAIStatus[]> {
    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        id, title, city, ai_ready, ai_optimized, content_quality_score,
        translation_verified, listing_segment, title_de, title_en,
        description_de, description_en
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Get queue items for all properties
    const propertyIds = properties?.map(p => p.id) || [];
    const { data: queueItems } = await supabase
      .from('ai_generation_queue')
      .select('*')
      .in('property_id', propertyIds)
      .in('status', ['queued', 'in_progress']);

    // Group queue items by property
    const queueByProperty = (queueItems || []).reduce((acc, item) => {
      if (!acc[item.property_id]) acc[item.property_id] = [];
      acc[item.property_id].push(item as any);
      return acc;
    }, {} as Record<string, any[]>);

    return (properties || []).map(property => ({
      id: property.id,
      title: property.title || 'Untitled Property',
      city: property.city || '',
      ai_ready: property.ai_ready || false,
      ai_optimized: property.ai_optimized || false,
      content_quality_score: property.content_quality_score || 0,
      translation_verified: property.translation_verified || false,
      listing_segment: property.listing_segment,
      has_german: !!(property.title_de || property.description_de),
      has_english: !!(property.title_en || property.description_en),
      queue_items: queueByProperty[property.id] || []
    }));
  }

  /**
   * Queue AI generation for a single property
   */
  static async queuePropertyOptimization(
    propertyId: string,
    userId: string,
    types: string[],
    targetLanguage?: 'en' | 'de',
    priority = 0
  ): Promise<void> {
    const queueItems = types.map(type => ({
      property_id: propertyId,
      user_id: userId,
      type,
      target_language: targetLanguage,
      priority,
      status: 'queued'
    }));

    const { error } = await supabase
      .from('ai_generation_queue')
      .insert(queueItems);

    if (error) throw error;
  }

  /**
   * Queue bulk AI optimization for multiple properties
   */
  static async queueBulkOptimization(
    propertyIds: string[],
    userId: string,
    types: string[],
    onlyMissing = true
  ): Promise<{ queued: number; skipped: number }> {
    let queued = 0;
    let skipped = 0;

    for (const propertyId of propertyIds) {
      try {
        // If onlyMissing is true, check what's actually missing
        if (onlyMissing) {
          const { data: property } = await supabase
            .from('properties')
            .select('title_de, title_en, description_de, description_en, content_quality_score')
            .eq('id', propertyId)
            .single();

          if (!property) {
            skipped++;
            continue;
          }

          // Determine what needs to be generated
          const neededTypes = types.filter(type => {
            switch (type) {
              case 'title':
                return !property.title_de || !property.title_en;
              case 'description':
                return !property.description_de || !property.description_en;
              case 'meta_description':
                return true; // Always regenerate meta descriptions for optimization
              default:
                return true;
            }
          });

          if (neededTypes.length === 0) {
            skipped++;
            continue;
          }

          await this.queuePropertyOptimization(propertyId, userId, neededTypes);
          queued++;
        } else {
          await this.queuePropertyOptimization(propertyId, userId, types);
          queued++;
        }
      } catch (error) {
        console.error(`Failed to queue property ${propertyId}:`, error);
        skipped++;
      }
    }

    return { queued, skipped };
  }

  /**
   * Process queued AI generation tasks using the new bulk optimization endpoint
   */
  static async processQueue(userId: string, maxItems = 10): Promise<void> {
    // Get queued items for the user
    const { data: queueItems, error } = await supabase
      .from('ai_generation_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'queued')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(maxItems);

    if (error) throw error;

    if (!queueItems || queueItems.length === 0) {
      console.log('No queued items to process');
      return;
    }

    console.log(`Processing ${queueItems.length} queued items...`);

    // Group items by property and type for efficient processing
    const groupedItems = queueItems.reduce((acc, item) => {
      const key = item.property_id;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    // Process each property's queue items
    for (const [propertyId, items] of Object.entries(groupedItems)) {
      try {
        // Mark items as in progress
        const itemIds = items.map(item => item.id);
        await supabase
          .from('ai_generation_queue')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .in('id', itemIds);

        // Extract types and languages from queue items
        const types = [...new Set(items.map(item => item.type))];
        const targetLanguages = [...new Set(items.map(item => item.target_language).filter(Boolean))];

        // Call the bulk optimization function
        const { data: result, error: processError } = await supabase.functions.invoke('process-bulk-optimization', {
          body: {
            user_id: userId,
            property_ids: [propertyId],
            types,
            only_missing: false, // Process all requested types
            target_language: targetLanguages.length === 1 ? targetLanguages[0] : undefined,
            batch_size: 1
          }
        });

        if (processError) {
          throw processError;
        }

        // Mark items as completed
        await supabase
          .from('ai_generation_queue')
          .update({ 
            status: 'completed', 
            result: result,
            updated_at: new Date().toISOString() 
          })
          .in('id', itemIds);

        console.log(`✅ Processed ${items.length} queue items for property ${propertyId}`);

      } catch (error) {
        console.error(`Failed to process queue items for property ${propertyId}:`, error);
        
        // Mark items as failed and increment attempts
        for (const item of items) {
          await supabase
            .from('ai_generation_queue')
            .update({ 
              status: item.attempts + 1 >= item.max_attempts ? 'failed' : 'queued',
              attempts: item.attempts + 1,
              error_message: error instanceof Error ? error.message : 'Unknown error',
              updated_at: new Date().toISOString() 
            })
            .eq('id', item.id);
        }
      }
    }
  }

  /**
   * Generate content using AI service
   */
  private static async generateContent(item: AIGenerationQueueItem): Promise<any> {
    // Get property data
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', item.property_id)
      .single();

    if (error || !property) {
      throw new Error('Property not found');
    }

    // Call the AI generation edge function
    const { data, error: aiError } = await supabase.functions.invoke('generate-property-description', {
      body: {
        type: item.type,
        property,
        targetLanguage: item.target_language
      }
    });

    if (aiError) throw aiError;
    return data;
  }

  /**
   * Update property with generated content
   */
  private static async updatePropertyWithResult(
    item: AIGenerationQueueItem, 
    result: any
  ): Promise<void> {
    const updates: any = {};
    
    // Map result to property fields based on type
    switch (item.type) {
      case 'title':
        if (item.target_language === 'de') {
          updates.title_de = result.content;
        } else if (item.target_language === 'en') {
          updates.title_en = result.content;
        } else {
          updates.title = result.content;
        }
        break;
      case 'description':
        if (item.target_language === 'de') {
          updates.description_de = result.content;
        } else if (item.target_language === 'en') {
          updates.description_en = result.content;
        } else {
          updates.description = result.content;
        }
        break;
      case 'meta_description':
        if (item.target_language === 'de') {
          updates.meta_description_de = result.content;
        } else if (item.target_language === 'en') {
          updates.meta_description_en = result.content;
        }
        break;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', item.property_id);

      if (error) throw error;

      // Create version history
      for (const [fieldName, content] of Object.entries(updates)) {
        await supabase
          .from('ai_versions')
          .insert({
            property_id: item.property_id,
            field_name: fieldName,
            content: content as string,
            ai_generated: true,
            created_by: item.user_id
          });
      }
    }
  }

  /**
   * Calculate content quality score
   */
  static calculateQualityScore(property: any): number {
    let score = 0;
    const maxScore = 100;

    // Title quality (20 points)
    if (property.title && property.title.length > 10) score += 10;
    if (property.title_de || property.title_en) score += 10;

    // Description quality (30 points)
    if (property.description && property.description.length > 50) score += 15;
    if (property.description_de || property.description_en) score += 15;

    // Translations (25 points)
    if (property.title_de && property.title_en) score += 10;
    if (property.description_de && property.description_en) score += 15;

    // Meta descriptions (10 points)
    if (property.meta_description_de || property.meta_description_en) score += 10;

    // Property details completeness (15 points)
    if (property.square_meters && property.bedrooms) score += 5;
    if (property.monthly_rent) score += 5;
    if (property.city && property.zip_code) score += 5;

    return Math.min(score, maxScore);
  }

  /**
   * Mark property as AI ready
   */
  static async markAsAIReady(propertyId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('properties')
      .update({ ai_ready: true })
      .eq('id', propertyId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Update content quality scores for all properties
   */
  static async updateQualityScores(userId: string): Promise<void> {
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    for (const property of properties || []) {
      const qualityScore = this.calculateQualityScore(property);
      
      await supabase
        .from('properties')
        .update({ content_quality_score: qualityScore })
        .eq('id', property.id);
    }
  }
}