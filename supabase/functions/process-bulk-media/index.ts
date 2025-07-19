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

    console.log(`Starting media processing for ${properties.length} properties`);

    let totalSuccess = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    // Extract media URLs from row data
    const extractMediaUrls = (rowData: Record<string, any>): MediaItem[] => {
      const mediaItems: MediaItem[] = [];
      
      Object.entries(rowData).forEach(([key, value]) => {
        if (!value || typeof value !== 'string') return;
        
        const lowerKey = key.toLowerCase();
        const isPhotoField = lowerKey.includes('photo') || lowerKey.includes('image') || lowerKey.includes('picture');
        const isFloorplanField = lowerKey.includes('floorplan') || lowerKey.includes('floor_plan') || lowerKey.includes('layout') || lowerKey.includes('plan');
        
        if (isPhotoField || isFloorplanField) {
          const urls = value.split(/[,;]/).map(url => url.trim()).filter(url => {
            try {
              new URL(url);
              return url.match(/\.(jpg|jpeg|png|gif|webp|pdf)(\?.*)?$/i) !== null;
            } catch {
              return false;
            }
          });
          
          urls.forEach(url => {
            mediaItems.push({
              url,
              type: isFloorplanField ? 'floorplan' : 'photo'
            });
          });
        }
      });

      return mediaItems;
    };

    // Process media for each property
    for (const property of properties) {
      const mediaItems = extractMediaUrls(property.data);
      
      if (mediaItems.length === 0) continue;

      console.log(`Processing ${mediaItems.length} media items for property ${property.id}`);

      // Process each media item
      for (let i = 0; i < mediaItems.length; i++) {
        const mediaItem = mediaItems[i];
        
        try {
          // Download media with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          
          const response = await fetch(mediaItem.url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Leasy-Media-Processor/1.0'
            }
          });
          
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const contentType = response.headers.get('content-type') || '';
          const blob = await response.blob();
          
          // Check file size (max 10MB)
          if (blob.size > 10 * 1024 * 1024) {
            throw new Error(`File too large: ${(blob.size / 1024 / 1024).toFixed(1)}MB`);
          }

          // Generate unique filename
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000);
          const extension = mediaItem.url.split('.').pop()?.split('?')[0] || 'jpg';
          const fileName = `${mediaItem.type}_${timestamp}_${random}.${extension}`;
          
          // Create file path
          const csvFolder = csvFileName ? 
            csvFileName.replace(/[^a-z0-9_-]/gi, '-').replace(/\.csv$/i, '') : 
            'bulk_upload';
          const filePath = `${csvFolder}/${property.id}/${fileName}`;

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
              property_id: property.id,
              url: publicUrl,
              media_type: mediaItem.type,
              title: `Auto-imported ${mediaItem.type}`,
              category: mediaItem.type === 'floorplan' ? 'floorplan' : 'exterior',
              sort_order: i
            });

          if (dbError) {
            // Clean up uploaded file if DB insert fails
            await supabase.storage
              .from('property-photos')
              .remove([filePath]);
            
            throw new Error(`Database insert failed: ${dbError.message}`);
          }

          totalSuccess++;
          console.log(`✅ Successfully processed: ${mediaItem.url}`);

        } catch (error) {
          totalFailed++;
          const errorMessage = `${mediaItem.url}: ${error.message}`;
          errors.push(errorMessage);
          console.warn(`❌ Failed to process: ${errorMessage}`);
        }
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