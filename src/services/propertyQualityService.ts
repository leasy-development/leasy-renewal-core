import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Extended property quality and completeness service
export interface PropertyQualityScore {
  id: string;
  property_id: string;
  completeness_score: number;
  ai_optimization_score: number;
  media_quality_score: number;
  text_quality_score: number;
  missing_fields: string[];
  optimization_suggestions: string[];
  last_analyzed_at: string;
  created_at: string;
  updated_at: string;
}

export interface PropertyProgress {
  propertyId: string;
  title: string;
  completeness: number;
  missingFields: string[];
  aiOptimized: boolean;
  mediaCount: number;
  lastUpdated: string;
}

class PropertyQualityService {
  /**
   * Analyze property completeness and generate quality score
   */
  async analyzePropertyQuality(propertyId: string): Promise<PropertyQualityScore | null> {
    try {
      // Get property data
      const { data: property, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propError) throw propError;

      // Get property media
      const { data: media, error: mediaError } = await supabase
        .from('property_media')
        .select('*')
        .eq('property_id', propertyId);

      if (mediaError) throw mediaError;

      // Calculate scores
      const completenessScore = this.calculateCompletenessScore(property);
      const aiOptimizationScore = this.calculateAIOptimizationScore(property);
      const mediaQualityScore = this.calculateMediaQualityScore(media || []);
      const textQualityScore = this.calculateTextQualityScore(property);

      // Identify missing fields
      const missingFields = this.identifyMissingFields(property);
      
      // Generate optimization suggestions
      const optimizationSuggestions = this.generateOptimizationSuggestions(
        property, 
        media || [], 
        { completenessScore, aiOptimizationScore, mediaQualityScore, textQualityScore }
      );

      // Store or update quality score
      const qualityData = {
        property_id: propertyId,
        completeness_score: completenessScore,
        ai_optimization_score: aiOptimizationScore,
        media_quality_score: mediaQualityScore,
        text_quality_score: textQualityScore,
        missing_fields: missingFields,
        optimization_suggestions: optimizationSuggestions,
        last_analyzed_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('property_quality_scores')
        .upsert(qualityData, { onConflict: 'property_id' })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error analyzing property quality:', error);
      return null;
    }
  }

  /**
   * Get quality score for a property
   */
  async getPropertyQualityScore(propertyId: string): Promise<PropertyQualityScore | null> {
    try {
      const { data, error } = await supabase
        .from('property_quality_scores')
        .select('*')
        .eq('property_id', propertyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting property quality score:', error);
      return null;
    }
  }

  /**
   * Get property progress for dashboard
   */
  async getPropertyProgress(userId: string, limit = 10): Promise<PropertyProgress[]> {
    try {
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          updated_at,
          property_media(count),
          property_quality_scores(*)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (propError) throw propError;

      const progress: PropertyProgress[] = [];

      for (const property of properties || []) {
        const qualityScore = property.property_quality_scores?.[0];
        
        // If no quality score exists, analyze it
        if (!qualityScore) {
          await this.analyzePropertyQuality(property.id);
        }

        const mediaCount = property.property_media?.[0]?.count || 0;
        const completeness = qualityScore?.completeness_score || 0;
        const missingFields = qualityScore?.missing_fields || [];
        const aiOptimized = (qualityScore?.ai_optimization_score || 0) > 80;

        progress.push({
          propertyId: property.id,
          title: property.title,
          completeness,
          missingFields,
          aiOptimized,
          mediaCount,
          lastUpdated: property.updated_at
        });
      }

      return progress;
    } catch (error) {
      console.error('Error getting property progress:', error);
      return [];
    }
  }

  /**
   * Calculate completeness score (0-100)
   */
  private calculateCompletenessScore(property: any): number {
    const requiredFields = [
      'title', 'description', 'street_name', 'city', 'zip_code',
      'monthly_rent', 'bedrooms', 'bathrooms', 'square_meters'
    ];

    const optionalFields = [
      'apartment_type', 'total_rooms', 'category', 'checkin_time',
      'checkout_time', 'max_guests', 'house_rules'
    ];

    let score = 0;
    const totalWeight = requiredFields.length * 2 + optionalFields.length;

    // Required fields are worth 2 points each
    for (const field of requiredFields) {
      if (property[field] && property[field] !== '') {
        score += 2;
      }
    }

    // Optional fields are worth 1 point each
    for (const field of optionalFields) {
      if (property[field] && property[field] !== '') {
        score += 1;
      }
    }

    return Math.round((score / totalWeight) * 100);
  }

  /**
   * Calculate AI optimization score (0-100)
   */
  private calculateAIOptimizationScore(property: any): number {
    let score = 0;
    let total = 0;

    // AI-generated description
    if (property.description && property.description.length > 50) {
      score += 30;
    }
    total += 30;

    // Multi-language content
    if (property.description_en || property.title_en) {
      score += 25;
    }
    total += 25;

    // Meta descriptions
    if (property.meta_description_de || property.meta_description_en) {
      score += 20;
    }
    total += 20;

    // AI readiness flag
    if (property.ai_ready) {
      score += 15;
    }
    total += 15;

    // AI optimization flag
    if (property.ai_optimized) {
      score += 10;
    }
    total += 10;

    return Math.round((score / total) * 100);
  }

  /**
   * Calculate media quality score (0-100)
   */
  private calculateMediaQualityScore(media: any[]): number {
    if (!media || media.length === 0) return 0;

    let score = 0;
    let total = 0;

    // Base score for having media
    score += Math.min(media.length * 10, 50);
    total += 50;

    // Categorized media bonus
    const categorizedMedia = media.filter(m => m.category || m.ai_category);
    score += (categorizedMedia.length / media.length) * 25;
    total += 25;

    // Alt text bonus
    const mediaWithAltText = media.filter(m => m.title || m.ai_generated_alt_text);
    score += (mediaWithAltText.length / media.length) * 25;
    total += 25;

    return Math.round((score / total) * 100);
  }

  /**
   * Calculate text quality score (0-100)
   */
  private calculateTextQualityScore(property: any): number {
    let score = 0;
    let total = 100;

    // Title quality (30 points)
    if (property.title) {
      const titleLength = property.title.length;
      if (titleLength >= 20 && titleLength <= 80) {
        score += 30;
      } else if (titleLength >= 10) {
        score += 15;
      }
    }

    // Description quality (50 points)
    if (property.description) {
      const descLength = property.description.length;
      if (descLength >= 100 && descLength <= 1000) {
        score += 50;
      } else if (descLength >= 50) {
        score += 25;
      }
    }

    // Language consistency (20 points)
    if (property.language_detected) {
      score += 20;
    }

    return Math.round((score / total) * 100);
  }

  /**
   * Identify missing important fields
   */
  private identifyMissingFields(property: any): string[] {
    const missing: string[] = [];

    const criticalFields = [
      { field: 'description', label: 'Beschreibung' },
      { field: 'monthly_rent', label: 'Miete' },
      { field: 'square_meters', label: 'Quadratmeter' },
      { field: 'bedrooms', label: 'Schlafzimmer' },
      { field: 'bathrooms', label: 'Badezimmer' }
    ];

    const importantFields = [
      { field: 'apartment_type', label: 'Wohnungstyp' },
      { field: 'total_rooms', label: 'Gesamtzimmer' },
      { field: 'available_from', label: 'Verfügbar ab' },
      { field: 'max_guests', label: 'Max. Gäste' }
    ];

    const aiFields = [
      { field: 'description_en', label: 'Englische Beschreibung' },
      { field: 'meta_description_de', label: 'Meta-Beschreibung' },
      { field: 'title_en', label: 'Englischer Titel' }
    ];

    // Check critical fields
    for (const { field, label } of criticalFields) {
      if (!property[field] || property[field] === '') {
        missing.push(label);
      }
    }

    // Check important fields
    for (const { field, label } of importantFields) {
      if (!property[field] || property[field] === '') {
        missing.push(label);
      }
    }

    // Check AI optimization fields
    for (const { field, label } of aiFields) {
      if (!property[field] || property[field] === '') {
        missing.push(label);
      }
    }

    return missing;
  }

  /**
   * Generate optimization suggestions
   */
  private generateOptimizationSuggestions(
    property: any, 
    media: any[], 
    scores: { completenessScore: number; aiOptimizationScore: number; mediaQualityScore: number; textQualityScore: number }
  ): string[] {
    const suggestions: string[] = [];

    // Completeness suggestions
    if (scores.completenessScore < 70) {
      suggestions.push('Vervollständige fehlende Grunddaten');
    }

    if (!property.description || property.description.length < 100) {
      suggestions.push('Erstelle eine ausführlichere Beschreibung');
    }

    // AI optimization suggestions
    if (scores.aiOptimizationScore < 60) {
      suggestions.push('Nutze AI-Tools zur Optimierung');
    }

    if (!property.description_en) {
      suggestions.push('Generiere englische Übersetzung');
    }

    if (!property.meta_description_de) {
      suggestions.push('Erstelle Meta-Beschreibung für SEO');
    }

    // Media suggestions
    if (media.length === 0) {
      suggestions.push('Füge Bilder hinzu');
    } else if (media.length < 5) {
      suggestions.push('Füge weitere Bilder hinzu (mindestens 5 empfohlen)');
    }

    if (media.length > 0) {
      const uncategorized = media.filter(m => !m.category && !m.ai_category);
      if (uncategorized.length > 0) {
        suggestions.push('Kategorisiere alle Bilder');
      }

      const withoutAltText = media.filter(m => !m.title && !m.ai_generated_alt_text);
      if (withoutAltText.length > 0) {
        suggestions.push('Generiere Alt-Texte für Bilder');
      }
    }

    // Text quality suggestions
    if (scores.textQualityScore < 70) {
      if (property.title && property.title.length < 20) {
        suggestions.push('Erweitere den Titel (mindestens 20 Zeichen)');
      }
      
      if (property.description && property.description.length < 200) {
        suggestions.push('Erweitere die Beschreibung (mindestens 200 Zeichen)');
      }
    }

    return suggestions;
  }

  /**
   * Auto-analyze all properties for a user
   */
  async analyzeAllUserProperties(userId: string): Promise<{ analyzed: number; errors: number }> {
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id')
        .eq('user_id', userId);

      if (error) throw error;

      let analyzed = 0;
      let errors = 0;

      for (const property of properties || []) {
        const result = await this.analyzePropertyQuality(property.id);
        if (result) {
          analyzed++;
        } else {
          errors++;
        }
      }

      return { analyzed, errors };
    } catch (error) {
      console.error('Error analyzing all user properties:', error);
      return { analyzed: 0, errors: 1 };
    }
  }
}

export const propertyQualityService = new PropertyQualityService();