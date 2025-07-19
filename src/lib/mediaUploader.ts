import { supabase } from '@/integrations/supabase/client';

interface MediaUploadResult {
  success: boolean;
  url?: string;
  publicUrl?: string;
  error?: string;
  originalUrl: string;
  mediaType: 'photo' | 'floorplan';
  size?: number;
  fileName?: string;
}

interface MediaUploadProgress {
  total: number;
  completed: number;
  current?: string;
  errors: Array<{ url: string; error: string }>;
}

interface MediaUploadOptions {
  userId: string;
  propertyId: string;
  csvFileName?: string;
  maxFileSize?: number; // in bytes, default 10MB
  onProgress?: (progress: MediaUploadProgress) => void;
  signal?: AbortSignal;
}

class MediaUploader {
  private readonly maxFileSize: number;
  private readonly allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  private readonly duplicateCache = new Set<string>(); // Cache for duplicate detection

  constructor(maxFileSize = 10 * 1024 * 1024) { // 10MB default
    this.maxFileSize = maxFileSize;
  }

  // Check if URL has already been processed (duplicate detection)
  private async isUrlAlreadyProcessed(url: string, propertyId: string): Promise<boolean> {
    const cacheKey = `${url}:${propertyId}`;
    if (this.duplicateCache.has(cacheKey)) {
      return true;
    }

    // Check database for existing media with same original URL
    const { data } = await supabase
      .from('property_media')
      .select('id')
      .eq('property_id', propertyId)
      .like('category', `%${url}%`)
      .limit(1);

    const exists = data && data.length > 0;
    if (exists) {
      this.duplicateCache.add(cacheKey);
    }
    return exists;
  }

  // Extract and process all media from existing properties missing media
  async processExistingPropertiesMissingMedia(
    userId: string,
    onProgress?: (current: number, total: number, propertyId: string) => void
  ): Promise<{
    processedProperties: number;
    totalMediaDownloaded: number;
    totalFailed: number;
    errors: string[];
  }> {
    let processedProperties = 0;
    let totalMediaDownloaded = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    try {
      // Get all properties for user that have no media
      const { data: propertiesWithoutMedia } = await supabase
        .from('properties')
        .select('id, title, description')
        .eq('user_id', userId)
        .not('id', 'in', `(
          SELECT DISTINCT property_id 
          FROM property_media 
          WHERE property_id IS NOT NULL
        )`);

      if (!propertiesWithoutMedia || propertiesWithoutMedia.length === 0) {
        return { processedProperties: 0, totalMediaDownloaded: 0, totalFailed: 0, errors: [] };
      }

      for (let i = 0; i < propertiesWithoutMedia.length; i++) {
        const property = propertiesWithoutMedia[i];
        
        if (onProgress) {
          onProgress(i + 1, propertiesWithoutMedia.length, property.id);
        }

        // Extract media URLs from property data
        const mediaItems = this.extractMediaUrls(property);
        
        if (mediaItems.length > 0) {
          const { summary } = await this.uploadPropertyMedia(property, {
            userId,
            propertyId: property.id,
            csvFileName: 'existing_properties_scan'
          });

          totalMediaDownloaded += summary.success;
          totalFailed += summary.failed;
          errors.push(...summary.errors);
          processedProperties++;
        }
      }

      return {
        processedProperties,
        totalMediaDownloaded,
        totalFailed,
        errors
      };

    } catch (error) {
      errors.push(`Failed to process existing properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { processedProperties, totalMediaDownloaded, totalFailed, errors };
    }
  }

  // Extract media URLs from CSV row data
  extractMediaUrls(rowData: Record<string, any>): Array<{ url: string; type: 'photo' | 'floorplan' }> {
    const mediaItems: Array<{ url: string; type: 'photo' | 'floorplan' }> = [];
    
    Object.entries(rowData).forEach(([key, value]) => {
      if (!value || typeof value !== 'string') return;
      
      const lowerKey = key.toLowerCase();
      const isPhotoField = lowerKey.includes('photo') || lowerKey.includes('image') || lowerKey.includes('picture');
      const isFloorplanField = lowerKey.includes('floorplan') || lowerKey.includes('floor_plan') || lowerKey.includes('layout') || lowerKey.includes('plan');
      
      if (isPhotoField || isFloorplanField) {
        const urls = this.parseMultipleUrls(value);
        urls.forEach(url => {
          mediaItems.push({
            url: url.trim(),
            type: isFloorplanField ? 'floorplan' : 'photo'
          });
        });
      }
    });

    return mediaItems;
  }

  // Parse multiple URLs separated by commas or semicolons
  private parseMultipleUrls(value: string): string[] {
    return value
      .split(/[,;]/)
      .map(url => url.trim())
      .filter(url => this.isValidUrl(url));
  }

  // Validate URL format
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.match(/\.(jpg|jpeg|png|gif|webp|pdf)(\?.*)?$/i) !== null;
    } catch {
      return false;
    }
  }

  // Generate unique filename to avoid conflicts
  private generateFileName(originalUrl: string, mediaType: 'photo' | 'floorplan', index: number): string {
    const urlObj = new URL(originalUrl);
    const pathParts = urlObj.pathname.split('/');
    const originalName = pathParts[pathParts.length - 1] || 'media';
    const extension = originalName.split('.').pop() || 'jpg';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    return `${mediaType}_${baseName}_${index}_${timestamp}_${random}.${extension}`;
  }

  // Download and validate media file
  private async downloadMedia(url: string, signal?: AbortSignal): Promise<{ blob: Blob; contentType: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // Combine signals if provided
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Leasy-Media-Importer/1.0'
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      
      if (!this.allowedTypes.some(type => contentType.startsWith(type.split('/')[0]))) {
        throw new Error(`Unsupported file type: ${contentType}`);
      }

      const blob = await response.blob();
      
      if (blob.size > this.maxFileSize) {
        throw new Error(`File too large: ${(blob.size / 1024 / 1024).toFixed(1)}MB (max ${this.maxFileSize / 1024 / 1024}MB)`);
      }

      return { blob, contentType };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Download timeout or cancelled');
      }
      throw error;
    }
  }

  // Upload single media file
  async uploadSingleMedia(
    mediaItem: { url: string; type: 'photo' | 'floorplan' },
    options: MediaUploadOptions,
    index: number
  ): Promise<MediaUploadResult> {
    try {
      // Download the media
      const { blob, contentType } = await this.downloadMedia(mediaItem.url, options.signal);
      
      // Generate file path
      const fileName = this.generateFileName(mediaItem.url, mediaItem.type, index);
      const csvFolder = options.csvFileName ? 
        options.csvFileName.replace(/[^a-z0-9_-]/gi, '-').replace(/\.csv$/i, '') : 
        'bulk_upload';
      const filePath = `${csvFolder}/${options.propertyId}/${fileName}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(filePath, blob, {
          contentType,
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-photos')
        .getPublicUrl(filePath);

      // Save to property_media table
      const { error: dbError } = await supabase
        .from('property_media')
        .insert({
          property_id: options.propertyId,
          url: publicUrl,
          media_type: mediaItem.type,
          title: `Auto-imported ${mediaItem.type}`,
          category: mediaItem.type === 'floorplan' ? 'floorplan' : 'exterior',
          sort_order: index
        });

      if (dbError) {
        // Try to clean up uploaded file if DB insert fails
        await supabase.storage
          .from('property-photos')
          .remove([filePath]);
        
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      return {
        success: true,
        url: uploadData.path,
        publicUrl,
        originalUrl: mediaItem.url,
        mediaType: mediaItem.type,
        size: blob.size,
        fileName
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        originalUrl: mediaItem.url,
        mediaType: mediaItem.type
      };
    }
  }

  // Upload all media for a property
  async uploadPropertyMedia(
    rowData: Record<string, any>,
    options: MediaUploadOptions
  ): Promise<{ results: MediaUploadResult[]; summary: { success: number; failed: number; errors: string[] } }> {
    const mediaItems = this.extractMediaUrls(rowData);
    
    if (mediaItems.length === 0) {
      return {
        results: [],
        summary: { success: 0, failed: 0, errors: [] }
      };
    }

    const results: MediaUploadResult[] = [];
    const errors: string[] = [];
    let completed = 0;

    // Process media items with progress updates
    for (let i = 0; i < mediaItems.length; i++) {
      const mediaItem = mediaItems[i];
      
      // Update progress
      if (options.onProgress) {
        options.onProgress({
          total: mediaItems.length,
          completed,
          current: mediaItem.url,
          errors: errors.map(error => ({ url: '', error }))
        });
      }

      // Check if operation was cancelled
      if (options.signal?.aborted) {
        break;
      }

      const result = await this.uploadSingleMedia(mediaItem, options, i);
      results.push(result);
      
      if (!result.success && result.error) {
        errors.push(`${result.originalUrl}: ${result.error}`);
      }
      
      completed++;
    }

    // Final progress update
    if (options.onProgress) {
      options.onProgress({
        total: mediaItems.length,
        completed,
        errors: errors.map(error => ({ url: '', error }))
      });
    }

    const summary = {
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      errors
    };

    return { results, summary };
  }

  // Batch upload media for multiple properties
  async uploadBatchMedia(
    properties: Array<{ id: string; data: Record<string, any> }>,
    options: Omit<MediaUploadOptions, 'propertyId'> & { 
      onPropertyProgress?: (propertyIndex: number, propertyTotal: number) => void;
      batchSize?: number;
    }
  ): Promise<{
    results: Record<string, MediaUploadResult[]>;
    summary: { totalSuccess: number; totalFailed: number; propertyResults: Record<string, any> };
  }> {
    const { batchSize = 3, onPropertyProgress, ...baseOptions } = options;
    const results: Record<string, MediaUploadResult[]> = {};
    const propertyResults: Record<string, any> = {};
    let totalSuccess = 0;
    let totalFailed = 0;

    // Process properties in batches to avoid overwhelming the server
    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      
      // Process current batch in parallel
      const batchPromises = batch.map(async (property, batchIndex) => {
        const propertyIndex = i + batchIndex;
        
        if (onPropertyProgress) {
          onPropertyProgress(propertyIndex, properties.length);
        }

        const { results: propertyMediaResults, summary } = await this.uploadPropertyMedia(
          property.data,
          { ...baseOptions, propertyId: property.id }
        );

        results[property.id] = propertyMediaResults;
        propertyResults[property.id] = summary;
        totalSuccess += summary.success;
        totalFailed += summary.failed;
      });

      await Promise.all(batchPromises);

      // Small delay between batches to be respectful to external servers
      if (i + batchSize < properties.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      results,
      summary: {
        totalSuccess,
        totalFailed,
        propertyResults
      }
    };
  }

  // Cleanup failed uploads
  async cleanupFailedUploads(results: MediaUploadResult[]): Promise<void> {
    const failedUploads = results.filter(r => r.success && r.url);
    
    if (failedUploads.length === 0) return;

    const filePaths = failedUploads.map(r => r.url!);
    
    try {
      await supabase.storage
        .from('property-photos')
        .remove(filePaths);
    } catch (error) {
      console.error('Failed to cleanup uploads:', error);
    }
  }
}

// Export singleton instance
export const mediaUploader = new MediaUploader();

// Export types
export type { MediaUploadResult, MediaUploadProgress, MediaUploadOptions };