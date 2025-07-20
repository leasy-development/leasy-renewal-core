import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ImageHash {
  id: string;
  property_id: string;
  image_url: string;
  hash_type: string;
  hash_value: string;
  file_size?: number;
  width?: number;
  height?: number;
  created_at: string;
}

export interface ImageCategorization {
  id: string;
  property_id: string;
  image_url: string;
  predicted_category?: string;
  confidence_score?: number;
  final_category?: string;
  is_auto_assigned: boolean;
  model_version: string;
  created_at: string;
  updated_at: string;
}

export interface ImageAuditTrail {
  id: string;
  property_id: string;
  image_url: string;
  source_type: 'manual_upload' | 'bulk_import' | 'scraper' | 'ai_generated';
  source_url?: string;
  original_filename?: string;
  user_id?: string;
  metadata: any;
  health_check_results: any;
  created_at: string;
}

export interface CategorizationFeedback {
  id: string;
  image_categorization_id: string;
  original_prediction?: string;
  corrected_category: string;
  user_id: string;
  feedback_type: string;
  confidence_before?: number;
  created_at: string;
}

export type ImageCategory = 
  | 'main_bedroom'
  | 'second_bedroom'
  | 'third_bedroom'
  | 'main_bathroom'
  | 'second_bathroom'
  | 'kitchen'
  | 'living_room'
  | 'dining_room'
  | 'balcony'
  | 'terrace'
  | 'outside'
  | 'entrance'
  | 'hallway'
  | 'storage'
  | 'other';

export const IMAGE_CATEGORIES: { value: ImageCategory; label: string; priority: number }[] = [
  { value: 'main_bedroom', label: 'Main Bedroom', priority: 1 },
  { value: 'second_bedroom', label: 'Second Bedroom', priority: 2 },
  { value: 'third_bedroom', label: 'Third Bedroom', priority: 3 },
  { value: 'living_room', label: 'Living Room', priority: 4 },
  { value: 'kitchen', label: 'Kitchen', priority: 5 },
  { value: 'dining_room', label: 'Dining Room', priority: 6 },
  { value: 'main_bathroom', label: 'Main Bathroom', priority: 7 },
  { value: 'second_bathroom', label: 'Second Bathroom', priority: 8 },
  { value: 'balcony', label: 'Balcony', priority: 9 },
  { value: 'terrace', label: 'Terrace', priority: 10 },
  { value: 'entrance', label: 'Entrance', priority: 11 },
  { value: 'hallway', label: 'Hallway', priority: 12 },
  { value: 'outside', label: 'Outside', priority: 13 },
  { value: 'storage', label: 'Storage', priority: 14 },
  { value: 'other', label: 'Other', priority: 15 }
];

class MediaIntelligenceService {
  // Check for duplicate images based on hash
  async checkDuplicate(propertyId: string, hashValue: string, hashType = 'phash'): Promise<ImageHash | null> {
    try {
      const { data, error } = await supabase
        .from('image_hashes')
        .select('*')
        .eq('hash_value', hashValue)
        .eq('hash_type', hashType)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return null;
    }
  }

  // Store image hash for deduplication
  async storeImageHash(
    propertyId: string,
    imageUrl: string,
    hashValue: string,
    metadata: { file_size?: number; width?: number; height?: number } = {}
  ): Promise<ImageHash | null> {
    try {
      const { data, error } = await supabase
        .from('image_hashes')
        .insert({
          property_id: propertyId,
          image_url: imageUrl,
          hash_value: hashValue,
          hash_type: 'phash',
          ...metadata
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error storing image hash:', error);
      return null;
    }
  }

  // Get image categorization for a property
  async getImageCategorizations(propertyId: string): Promise<ImageCategorization[]> {
    try {
      const { data, error } = await supabase
        .from('image_categorization')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching categorizations:', error);
      return [];
    }
  }

  // Store categorization result
  async storeCategorization(
    propertyId: string,
    imageUrl: string,
    predictedCategory: ImageCategory,
    confidenceScore: number,
    isAutoAssigned = true
  ): Promise<ImageCategorization | null> {
    try {
      const { data, error } = await supabase
        .from('image_categorization')
        .insert({
          property_id: propertyId,
          image_url: imageUrl,
          predicted_category: predictedCategory,
          confidence_score: confidenceScore,
          final_category: isAutoAssigned && confidenceScore >= 0.8 ? predictedCategory : null,
          is_auto_assigned: isAutoAssigned && confidenceScore >= 0.8,
          model_version: 'v1.0'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error storing categorization:', error);
      return null;
    }
  }

  // Update categorization with user feedback
  async updateCategorization(
    categorizationId: string,
    finalCategory: ImageCategory
  ): Promise<boolean> {
    try {
      // Get the current categorization
      const { data: currentData, error: fetchError } = await supabase
        .from('image_categorization')
        .select('*')
        .eq('id', categorizationId)
        .single();

      if (fetchError) throw fetchError;

      // Update the categorization
      const { error: updateError } = await supabase
        .from('image_categorization')
        .update({
          final_category: finalCategory,
          is_auto_assigned: false
        })
        .eq('id', categorizationId);

      if (updateError) throw updateError;

      // Store feedback for learning
      if (currentData.predicted_category && currentData.predicted_category !== finalCategory) {
        await this.storeFeedback(
          categorizationId,
          currentData.predicted_category,
          finalCategory,
          currentData.confidence_score
        );
      }

      return true;
    } catch (error) {
      console.error('Error updating categorization:', error);
      return false;
    }
  }

  // Store user feedback for model improvement
  async storeFeedback(
    categorizationId: string,
    originalPrediction: ImageCategory,
    correctedCategory: ImageCategory,
    confidenceBefore?: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('categorization_feedback')
        .insert({
          image_categorization_id: categorizationId,
          original_prediction: originalPrediction,
          corrected_category: correctedCategory,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          feedback_type: 'manual_correction',
          confidence_before: confidenceBefore
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing feedback:', error);
    }
  }

  // Record audit trail for image
  async recordAuditTrail(
    propertyId: string,
    imageUrl: string,
    sourceType: 'manual_upload' | 'bulk_import' | 'scraper' | 'ai_generated',
    metadata: Record<string, any> = {},
    healthCheckResults: Record<string, any> = {}
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('image_audit_trail')
        .insert({
          property_id: propertyId,
          image_url: imageUrl,
          source_type: sourceType,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          metadata,
          health_check_results: healthCheckResults
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording audit trail:', error);
    }
  }

  // Get audit trail for property
  async getAuditTrail(propertyId: string): Promise<ImageAuditTrail[]> {
    try {
      const { data, error } = await supabase
        .from('image_audit_trail')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      return [];
    }
  }

  // Health check for image
  async healthCheckImage(imageUrl: string): Promise<Record<string, any>> {
    const results = {
      is_accessible: false,
      is_valid_image: false,
      dimensions: null,
      file_size: null,
      is_too_small: false,
      is_blank: false,
      error: null
    };

    try {
      // Check if image is accessible
      const response = await fetch(imageUrl, { method: 'HEAD' });
      results.is_accessible = response.ok;

      if (!response.ok) {
        results.error = `HTTP ${response.status}: ${response.statusText}`;
        return results;
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      results.is_valid_image = contentType?.startsWith('image/') || false;

      // Get file size
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        results.file_size = parseInt(contentLength);
      }

      // Load image to check dimensions and quality
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      results.dimensions = { width: img.width, height: img.height };
      results.is_too_small = img.width < 200 || img.height < 200;

      // Basic blank image detection (solid color check)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = Math.min(img.width, 100);
        canvas.height = Math.min(img.height, 100);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Check if all pixels are similar (indicating blank/solid color)
        let variance = 0;
        const firstPixel = [pixels[0], pixels[1], pixels[2]];
        
        for (let i = 0; i < pixels.length; i += 4) {
          const pixel = [pixels[i], pixels[i + 1], pixels[i + 2]];
          variance += Math.pow(pixel[0] - firstPixel[0], 2) +
                    Math.pow(pixel[1] - firstPixel[1], 2) +
                    Math.pow(pixel[2] - firstPixel[2], 2);
        }
        
        variance /= (pixels.length / 4);
        results.is_blank = variance < 100; // Low variance indicates solid color
      }

    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return results;
  }

  // Sort images by category priority
  sortImagesByCategory(images: any[]): any[] {
    return [...images].sort((a, b) => {
      const categoryA = IMAGE_CATEGORIES.find(cat => cat.value === a.ai_category);
      const categoryB = IMAGE_CATEGORIES.find(cat => cat.value === b.ai_category);
      
      const priorityA = categoryA?.priority || 999;
      const priorityB = categoryB?.priority || 999;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Secondary sort by sort_order if available
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
  }

  // Update property media with AI categorization
  async updatePropertyMediaCategorization(
    mediaId: string,
    category: ImageCategory,
    confidenceScore: number,
    sortOrder?: number
  ): Promise<boolean> {
    try {
      const updateData: any = {
        ai_category: category,
        confidence_score: confidenceScore
      };
      
      if (sortOrder !== undefined) {
        updateData.sort_order = sortOrder;
      }

      const { error } = await supabase
        .from('property_media')
        .update(updateData)
        .eq('id', mediaId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating property media categorization:', error);
      return false;
    }
  }
}

export const mediaIntelligenceService = new MediaIntelligenceService();