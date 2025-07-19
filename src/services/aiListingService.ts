import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PropertyData {
  id?: string;
  title?: string;
  description?: string;
  apartment_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_meters?: number;
  monthly_rent?: number;
  city?: string;
  street_name?: string;
  street_number?: string;
  zip_code?: string;
  country?: string;
}

export interface AIGenerationRequest {
  type: 'description' | 'title' | 'alt_text' | 'translation' | 'summary' | 'tags' | 'validation';
  property?: PropertyData;
  content?: string;
  imageUrl?: string;
  language?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
  targetLanguage?: string;
  customPrompt?: string;
}

export interface AIGenerationResult {
  content: string;
  metadata?: {
    language?: string;
    tone?: string;
    wordCount?: number;
    tags?: string[];
    quality_score?: number;
    suggestions?: string[];
  };
}

class AIListingService {
  private async callAIFunction(request: AIGenerationRequest): Promise<AIGenerationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-property-description', {
        body: {
          ...request,
          property: request.property,
        }
      });

      if (error) {
        console.error('AI Service Error:', error);
        throw new Error(error.message || 'Failed to generate AI content');
      }

      return data;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error(error instanceof Error ? error.message : 'AI service unavailable');
    }
  }

  async generateDescription(
    property: PropertyData,
    options: {
      tone?: string;
      language?: string;
      length?: 'short' | 'medium' | 'long';
      customPrompt?: string;
    } = {}
  ): Promise<AIGenerationResult> {
    return this.callAIFunction({
      type: 'description',
      property,
      ...options
    });
  }

  async generateTitle(
    property: PropertyData,
    customPrompt?: string
  ): Promise<AIGenerationResult> {
    return this.callAIFunction({
      type: 'title',
      property,
      customPrompt
    });
  }

  async generateAltText(
    imageUrl: string,
    property?: PropertyData
  ): Promise<AIGenerationResult> {
    return this.callAIFunction({
      type: 'alt_text',
      imageUrl,
      property
    });
  }

  async translateContent(
    content: string,
    targetLanguage: string,
    property?: PropertyData
  ): Promise<AIGenerationResult> {
    return this.callAIFunction({
      type: 'translation',
      content,
      targetLanguage,
      property
    });
  }

  async generateSummary(
    property: PropertyData,
    length: 'short' | 'medium' | 'long' = 'short'
  ): Promise<AIGenerationResult> {
    return this.callAIFunction({
      type: 'summary',
      property,
      length
    });
  }

  async generateTags(property: PropertyData): Promise<AIGenerationResult> {
    return this.callAIFunction({
      type: 'tags',
      property
    });
  }

  async validateDraft(property: PropertyData): Promise<AIGenerationResult> {
    return this.callAIFunction({
      type: 'validation',
      property
    });
  }

  async logGeneration(
    userId: string,
    propertyId?: string,
    type?: string,
    content?: string,
    metadata?: any
  ) {
    try {
      await supabase.from('ai_generation_logs').insert({
        user_id: userId,
        property_title: propertyId ? `Property ${propertyId}` : 'Bulk Operation',
        tone: metadata?.tone || type,
        format: metadata?.format || 'text',
        language: metadata?.language || 'en',
        character_count: content?.length || 0
      });
    } catch (error) {
      console.warn('Failed to log AI generation:', error);
    }
  }

  async checkUsageLimit(userId: string): Promise<{ canUse: boolean; usage: number; limit: number }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('ai_generation_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', today);

      if (error) throw error;

      const usage = data?.length || 0;
      const limit = 50; // Daily limit per user

      return {
        canUse: usage < limit,
        usage,
        limit
      };
    } catch (error) {
      console.warn('Failed to check usage limit:', error);
      return { canUse: true, usage: 0, limit: 50 };
    }
  }
}

export const aiListingService = new AIListingService();