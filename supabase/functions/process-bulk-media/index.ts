import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MediaProcessingRequest {
  properties: Array<{
    id: string;
    data: Record<string, any>;
  }>;
  userId: string;
  csvFileName?: string;
}

interface MediaItem {
  url: string;
  type: 'photo' | 'floorplan';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { properties, userId, csvFileName }: MediaProcessingRequest = await req.json();

    console.log(`🚀 Starting background media processing for ${properties.length} properties`);

    let totalSuccess = 0;
    let totalFailed = 0;
    const errors: string[] = [];
    const processedProperties: string[] = [];
    const skippedUrls: string[] = [];

    // Enhanced media URL extraction with better validation
    const extractMediaUrls = (rowData: Record<string, any>): MediaItem[] => {
      const mediaItems: MediaItem[] = [];
      
      Object.entries(rowData).forEach(([key, value]) => {
        if (!value || typeof value !== 'string') return;
        
        const lowerKey = key.toLowerCase();
        const isPhotoField = lowerKey.includes('photo') || lowerKey.includes('image') || lowerKey.includes('picture') || lowerKey.includes('img');
        const isFloorplanField = lowerKey.includes('floorplan') || lowerKey.includes('floor_plan') || lowerKey.includes('layout') || lowerKey.includes('plan') || lowerKey.includes('blueprint');
        
        if (isPhotoField || isFloorplanField) {
          // Handle multiple URLs separated by various delimiters
          const urls = value.split(/[,;|\n\r]/).map(url => url.trim()).filter(url => {
            try {
              const urlObj = new URL(url);
              // Enhanced validation for image/PDF URLs
              return urlObj.protocol.startsWith('http') && 
                     (url.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|pdf)(\?.*)?$/i) !== null ||
                      isImageHostUrl(url));
            } catch {
              return false;
            }
          });
          
          urls.forEach(url => {
            // Check for duplicates within same property
            if (!mediaItems.some(item => item.url === url)) {
              mediaItems.push({
                url,
                type: isFloorplanField ? 'floorplan' : 'photo'
              });
            }
          });
        }
      });

      return mediaItems;
    };

    // Check if URL is from a known image hosting service
    const isImageHostUrl = (url: string): boolean => {
      const imageHosts = [
        'imgur.com', 'flickr.com', 'cloudinary.com', 'unsplash.com', 
        'pexels.com', 'amazonaws.com', 'googleusercontent.com',
        'dropbox.com', 'onedrive.com', 'googledrive.com', 'cdn.',
        'images.', 'photos.', 'media.'
      ];
      return imageHosts.some(host => url.toLowerCase().includes(host));
    };

    // Check if media already exists for property (duplicate detection)
    const isMediaAlreadyProcessed = async (propertyId: string, url: string): Promise<boolean> => {
      const { data } = await supabase
        .from('property_media')
        .select('id')
        .eq('property_id', propertyId)
        .like('category', `%${url}%`)
        .limit(1);
      
      return data && data.length > 0;
    };

    // Process media for each property with enhanced error handling
    for (let propIndex = 0; propIndex < properties.length; propIndex++) {
      const property = properties[propIndex];
      const mediaItems = extractMediaUrls(property.data);
      
      if (mediaItems.length === 0) {
        console.log(`⏩ Skipping property ${property.id} - no media URLs found`);
        continue;
      }

      console.log(`📂 Processing ${mediaItems.length} media items for property ${property.id} (${propIndex + 1}/${properties.length})`);
      processedProperties.push(property.id);

      // Process each media item with duplicate detection
      for (let i = 0; i < mediaItems.length; i++) {
        const mediaItem = mediaItems[i];
        
        try {
          // Check if media already exists (duplicate detection)
          const alreadyExists = await isMediaAlreadyProcessed(property.id, mediaItem.url);
          if (alreadyExists) {
            skippedUrls.push(mediaItem.url);
            console.log(`⏭️ Skipping duplicate: ${mediaItem.url}`);
            continue;
          }

          // Download media with enhanced timeout and retry
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000); // Increased timeout
          
          const response = await fetch(mediaItem.url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Leasy-Media-Processor/1.0',
              'Accept': 'image/*, application/pdf',
              'Cache-Control': 'no-cache'
            }
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const contentType = response.headers.get('content-type') || 'image/jpeg';
          const blob = await response.blob();
          
          // Enhanced file size and type validation
          if (blob.size > 15 * 1024 * 1024) { // Increased limit to 15MB
            throw new Error(`File too large: ${(blob.size / 1024 / 1024).toFixed(1)}MB (max 15MB)`);
          }

          if (blob.size < 1024) { // Minimum 1KB
            throw new Error('File too small, likely invalid');
          }

          // Generate descriptive filename with property context
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000);
          const extension = mediaItem.url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
          const safePropertyId = property.id.replace(/[^a-z0-9_-]/gi, '');
          const fileName = `${mediaItem.type}_${safePropertyId}_${i + 1}_${timestamp}_${random}.${extension}`;
          
          // Create organized file path structure
          const csvFolder = csvFileName ? 
            csvFileName.replace(/[^a-z0-9_-]/gi, '-').replace(/\.csv$/i, '').toLowerCase() : 
            'bulk_upload';
          const mediaTypeFolder = mediaItem.type === 'floorplan' ? 'floorplans' : 'photos';
          const filePath = `bulkuploads/${csvFolder}/${property.id}/${mediaTypeFolder}/${fileName}`;

          // Upload to Supabase storage with retry logic
          let uploadResult;
          try {
            uploadResult = await supabase.storage
              .from('property-photos')
              .upload(filePath, blob, {
                contentType,
                upsert: false,
                cacheControl: '3600'
              });
          } catch (uploadError) {
            // Retry once with different filename if conflict
            const retryFileName = `retry_${fileName}`;
            const retryFilePath = `bulkuploads/${csvFolder}/${property.id}/${mediaTypeFolder}/${retryFileName}`;
            uploadResult = await supabase.storage
              .from('property-photos')
              .upload(retryFilePath, blob, {
                contentType,
                upsert: false,
                cacheControl: '3600'
              });
          }

          if (uploadResult.error) {
            throw new Error(`Storage upload failed: ${uploadResult.error.message}`);
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('property-photos')
            .getPublicUrl(uploadResult.data.path);

          // Save to property_media table with enhanced metadata
          const { error: dbError } = await supabase
            .from('property_media')
            .insert({
              property_id: property.id,
              url: publicUrl,
              media_type: mediaItem.type,
              title: `Auto-imported ${mediaItem.type} ${i + 1}`,
              category: mediaItem.url, // Store original URL for reference/duplicate detection
              sort_order: i
            });

          if (dbError) {
            // Clean up uploaded file if DB insert fails
            await supabase.storage
              .from('property-photos')
              .remove([uploadResult.data.path]);
            
            throw new Error(`Database insert failed: ${dbError.message}`);
          }

          totalSuccess++;
          console.log(`✅ Successfully processed (${totalSuccess}): ${mediaItem.url} -> ${publicUrl}`);

          // Small delay to be respectful to external servers
          if (i < mediaItems.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

        } catch (error) {
          totalFailed++;
          const errorMessage = `${mediaItem.url}: ${error.message}`;
          errors.push(errorMessage);
          console.warn(`❌ Failed to process (${totalFailed}): ${errorMessage}`);
        }
      }

      // Delay between properties to avoid overwhelming external servers
      if (propIndex < properties.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Media processing complete: ${totalSuccess} success, ${totalFailed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        totalSuccess,
        totalFailed,
        errors,
        processedProperties: properties.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in media processing:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        totalSuccess: 0,
        totalFailed: 0,
        errors: [error.message]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});