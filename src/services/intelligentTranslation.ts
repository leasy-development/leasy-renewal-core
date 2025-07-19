import { supabase } from '@/integrations/supabase/client';
import { 
  shouldGenerateTranslation, 
  getSourceContentForTranslation,
  getTranslationStatus 
} from '@/lib/languageDetection';

export interface TranslationRequest {
  propertyId: string;
  targetLanguage: 'de' | 'en';
  fields: ('title' | 'description' | 'meta_description')[];
}

export interface TranslationResult {
  title_de?: string;
  title_en?: string;
  description_de?: string;
  description_en?: string;
  meta_description_de?: string;
  meta_description_en?: string;
}

export class IntelligentTranslationService {
  /**
   * Generate only missing translations for a property
   */
  static async generateMissingTranslations(
    property: any,
    forceLanguages?: ('de' | 'en')[]
  ): Promise<TranslationResult> {
    const status = getTranslationStatus(property);
    const result: TranslationResult = {};
    
    // Determine which languages to generate
    const languagesToGenerate = forceLanguages || status.missingLanguages as ('de' | 'en')[];
    
    for (const targetLang of languagesToGenerate) {
      if (!shouldGenerateTranslation(property, targetLang)) {
        console.log(`Skipping ${targetLang} translation - already exists or no source content`);
        continue;
      }
      
      const sourceContent = getSourceContentForTranslation(property, targetLang);
      
      if (!sourceContent.title && !sourceContent.description) {
        console.log(`No source content available for ${targetLang} translation`);
        continue;
      }
      
      try {
        const translations = await this.callTranslationAPI(sourceContent, targetLang);
        
        // Merge results
        Object.assign(result, translations);
        
        console.log(`Generated ${targetLang} translations:`, translations);
      } catch (error) {
        console.error(`Failed to generate ${targetLang} translations:`, error);
        throw error;
      }
    }
    
    return result;
  }
  
  /**
   * Update property with missing translations
   */
  static async updatePropertyTranslations(
    propertyId: string,
    userId: string
  ): Promise<void> {
    // First, fetch the current property data
    const { data: property, error: fetchError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('user_id', userId)
      .single();
      
    if (fetchError || !property) {
      throw new Error('Property not found or access denied');
    }
    
    // Generate missing translations
    const translations = await this.generateMissingTranslations(property);
    
    if (Object.keys(translations).length === 0) {
      console.log('No translations needed for property', propertyId);
      return;
    }
    
    // Update the property with new translations
    const { error: updateError } = await supabase
      .from('properties')
      .update(translations)
      .eq('id', propertyId)
      .eq('user_id', userId);
      
    if (updateError) {
      throw new Error(`Failed to update property translations: ${updateError.message}`);
    }
    
    console.log(`Updated property ${propertyId} with translations:`, translations);
  }
  
  /**
   * Batch process multiple properties for missing translations
   */
  static async batchGenerateTranslations(
    propertyIds: string[],
    userId: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ success: string[], failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];
    
    for (let i = 0; i < propertyIds.length; i++) {
      const propertyId = propertyIds[i];
      
      try {
        await this.updatePropertyTranslations(propertyId, userId);
        success.push(propertyId);
      } catch (error) {
        console.error(`Failed to process property ${propertyId}:`, error);
        failed.push(propertyId);
      }
      
      onProgress?.(i + 1, propertyIds.length);
    }
    
    return { success, failed };
  }
  
  /**
   * Call the AI translation API
   */
  private static async callTranslationAPI(
    sourceContent: { title?: string; description?: string; metaDescription?: string },
    targetLanguage: 'de' | 'en'
  ): Promise<TranslationResult> {
    const sourceLanguage = targetLanguage === 'de' ? 'en' : 'de';
    
    // Prepare the request payload
    const translationRequests: Array<{ type: string; content: string }> = [];
    
    if (sourceContent.title) {
      translationRequests.push({ type: 'title', content: sourceContent.title });
    }
    
    if (sourceContent.description) {
      translationRequests.push({ type: 'description', content: sourceContent.description });
    }
    
    if (sourceContent.metaDescription) {
      translationRequests.push({ type: 'meta_description', content: sourceContent.metaDescription });
    }
    
    if (translationRequests.length === 0) {
      return {};
    }
    
    // Call the translation edge function
    const { data, error } = await supabase.functions.invoke('generate-property-description', {
      body: {
        type: 'translation',
        sourceLanguage,
        targetLanguage,
        requests: translationRequests
      }
    });
    
    if (error) {
      throw new Error(`Translation API error: ${error.message}`);
    }
    
    if (!data || !data.translations) {
      throw new Error('Invalid response from translation API');
    }
    
    // Format the response according to our schema
    const result: TranslationResult = {};
    
    data.translations.forEach((translation: { type: string; content: string }) => {
      const fieldName = `${translation.type}_${targetLanguage}` as keyof TranslationResult;
      result[fieldName] = translation.content;
    });
    
    return result;
  }
  
  /**
   * Check if a property needs translations
   */
  static needsTranslation(property: any): boolean {
    const status = getTranslationStatus(property);
    return status.missingLanguages.length > 0;
  }
  
  /**
   * Get translation statistics for multiple properties
   */
  static getTranslationStats(properties: any[]): {
    total: number;
    withGerman: number;
    withEnglish: number;
    withBoth: number;
    needsTranslation: number;
  } {
    const stats = {
      total: properties.length,
      withGerman: 0,
      withEnglish: 0,
      withBoth: 0,
      needsTranslation: 0
    };
    
    properties.forEach(property => {
      const status = getTranslationStatus(property);
      
      if (status.hasGerman) stats.withGerman++;
      if (status.hasEnglish) stats.withEnglish++;
      if (status.hasGerman && status.hasEnglish) stats.withBoth++;
      if (status.missingLanguages.length > 0) stats.needsTranslation++;
    });
    
    return stats;
  }
}