import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Search, CheckCircle, AlertCircle, Image, TestTube } from 'lucide-react';

interface ExtractedMedia {
  propertyId: string;
  propertyTitle: string;
  urls: string[];
  field: string;
}

interface ProcessResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export function MediaURLExtractor() {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedMedia, setExtractedMedia] = useState<ExtractedMedia[]>([]);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [manualUrls, setManualUrls] = useState('');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Enhanced URL pattern to match various image URLs including CDN URLs with query parameters
  const imageUrlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]*\.(?:jpg|jpeg|png|gif|webp|bmp|svg)(?:\?[^\s<>"{}|\\^`[\]]*)?/gi;

  const scanForImageUrls = async () => {
    setIsScanning(true);
    setExtractedMedia([]);
    
    try {
      // Get all properties for the current user
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, title, description, landlord_info, contractual_partner')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      const extracted: ExtractedMedia[] = [];

      properties?.forEach(property => {
        const urls = new Set<string>();
        
        // Check description field
        if (property.description) {
          const matches = property.description.match(imageUrlPattern);
          if (matches) {
            matches.forEach(url => urls.add(url));
          }
        }

        // Check landlord_info if it's a string
        if (property.landlord_info && typeof property.landlord_info === 'string') {
          const matches = property.landlord_info.match(imageUrlPattern);
          if (matches) {
            matches.forEach(url => urls.add(url));
          }
        }

        // Check contractual_partner if it's a string
        if (property.contractual_partner && typeof property.contractual_partner === 'string') {
          const matches = property.contractual_partner.match(imageUrlPattern);
          if (matches) {
            matches.forEach(url => urls.add(url));
          }
        }

        if (urls.size > 0) {
          extracted.push({
            propertyId: property.id,
            propertyTitle: property.title,
            urls: Array.from(urls),
            field: 'description' // Simplified for display
          });
        }
      });

      setExtractedMedia(extracted);
      
      if (extracted.length === 0) {
        toast({
          title: "No URLs Found",
          description: "No image URLs were found in your property descriptions.",
        });
      } else {
        toast({
          title: "URLs Found",
          description: `Found ${extracted.reduce((sum, item) => sum + item.urls.length, 0)} image URLs across ${extracted.length} properties.`,
        });
      }
    } catch (error) {
      console.error('Error scanning for URLs:', error);
      toast({
        title: "Scan Failed",
        description: "Failed to scan properties for image URLs.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const isValidImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  };

  const downloadAndSaveImage = async (url: string, propertyId: string): Promise<boolean> => {
    try {
      if (!isValidImageUrl(url)) {
        throw new Error('Invalid URL format');
      }

      // Check if this URL already exists in property_media
      const { data: existing } = await supabase
        .from('property_media')
        .select('id')
        .eq('property_id', propertyId)
        .eq('url', url)
        .single();

      if (existing) {
        return true; // Already exists, skip
      }

      // Download the image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const contentType = response.headers.get('content-type');
      
      if (!contentType?.startsWith('image/')) {
        throw new Error('URL does not point to an image');
      }

      // Generate filename
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const originalFilename = pathParts[pathParts.length - 1] || 'image';
      const extension = contentType.split('/')[1] || 'jpg';
      const filename = `${propertyId}/${Date.now()}-${originalFilename}.${extension}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(filename, blob, {
          contentType,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-photos')
        .getPublicUrl(filename);

      // Save to property_media table
      const { error: dbError } = await supabase
        .from('property_media')
        .insert({
          property_id: propertyId,
          media_type: 'photo',
          url: publicUrl,
          title: `Extracted from URL: ${url}`,
          sort_order: 0
        });

      if (dbError) throw dbError;

      return true;
    } catch (error) {
      console.error(`Failed to process URL ${url}:`, error);
      return false;
    }
  };

  const processManualUrls = async () => {
    if (!manualUrls.trim()) {
      toast({
        title: "No URLs Provided",
        description: "Please enter some image URLs to process.",
        variant: "destructive",
      });
      return;
    }

    // Parse URLs from the manual input
    const urls = manualUrls
      .split(/[,\n\r]+/)
      .map(url => url.trim())
      .filter(url => url && isValidImageUrl(url));

    if (urls.length === 0) {
      toast({
        title: "No Valid URLs",
        description: "No valid image URLs found in your input.",
        variant: "destructive",
      });
      return;
    }

    // Get the first property to attach images to
    const { data: properties } = await supabase
      .from('properties')
      .select('id')
      .limit(1);

    if (!properties || properties.length === 0) {
      toast({
        title: "No Properties Found",
        description: "You need at least one property to attach images to.",
        variant: "destructive",
      });
      return;
    }

    const testPropertyId = properties[0].id;
    await processUrlList(urls, testPropertyId, "manual");
  };

  const processUrlList = async (urls: string[], defaultPropertyId: string, source: string) => {
    setIsProcessing(true);
    setProgress(0);
    
    const result: ProcessResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        let propertyId = defaultPropertyId;
        
        // For extracted URLs, find the correct property ID
        if (source === "extracted") {
          const mediaItem = extractedMedia.find(item => item.urls.includes(url));
          if (mediaItem) {
            propertyId = mediaItem.propertyId;
          }
        }

        const success = await downloadAndSaveImage(url, propertyId);
        
        if (success) {
          result.success++;
        } else {
          result.failed++;
          result.errors.push(`Failed to process: ${url}`);
        }

        setProgress(((i + 1) / urls.length) * 100);
      }

      setProcessResult(result);
      
      toast({
        title: "Processing Complete",
        description: `Successfully processed ${result.success} images. ${result.failed} failed.`,
        variant: result.failed > 0 ? "destructive" : "default",
      });

      // Refresh the extracted media list for extracted URLs
      if (result.success > 0 && source === "extracted") {
        await scanForImageUrls();
      }

    } catch (error) {
      console.error('Error processing URLs:', error);
      toast({
        title: "Processing Failed",
        description: "An error occurred while processing the URLs.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const processExtractedUrls = async () => {
    if (extractedMedia.length === 0) return;

    const allUrls: string[] = [];
    extractedMedia.forEach(mediaItem => {
      allUrls.push(...mediaItem.urls);
    });

    await processUrlList(allUrls, extractedMedia[0]?.propertyId || '', "extracted");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Media URL Extractor
          </CardTitle>
          <CardDescription>
            Scan your existing properties for image URLs and automatically download and store them as proper media files, or test with specific URLs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scan" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scan">Scan Properties</TabsTrigger>
              <TabsTrigger value="manual">Manual URLs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="scan" className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={scanForImageUrls}
                  disabled={isScanning || isProcessing}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  {isScanning ? 'Scanning...' : 'Scan for Image URLs'}
                </Button>
                
                {extractedMedia.length > 0 && (
                  <Button 
                    onClick={processExtractedUrls}
                    disabled={isProcessing || isScanning}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {isProcessing ? 'Processing...' : 'Download & Save Images'}
                  </Button>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Image URLs (one per line or comma-separated)</label>
                <Textarea
                  placeholder="https://example.com/image1.jpg
https://example.com/image2.png
https://www.datocms-assets.com/49893/1752067314-copy-of-numa-berlin-arc_room-614_001-rt.jpg?fm=webp&w=480"
                  value={manualUrls}
                  onChange={(e) => setManualUrls(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              
              <Button 
                onClick={processManualUrls}
                disabled={isProcessing || !manualUrls.trim()}
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {isProcessing ? 'Processing...' : 'Process URLs'}
              </Button>
            </TabsContent>
          </Tabs>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing images...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {processResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Processing complete: {processResult.success} successful, {processResult.failed} failed
                {processResult.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">View Errors</summary>
                    <ul className="mt-1 space-y-1 text-xs">
                      {processResult.errors.slice(0, 5).map((error, index) => (
                        <li key={index} className="text-red-600">{error}</li>
                      ))}
                      {processResult.errors.length > 5 && (
                        <li className="text-gray-500">... and {processResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {extractedMedia.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Found Image URLs</CardTitle>
            <CardDescription>
              {extractedMedia.reduce((sum, item) => sum + item.urls.length, 0)} image URLs found across {extractedMedia.length} properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {extractedMedia.map((item) => (
                <div key={item.propertyId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{item.propertyTitle}</h4>
                    <Badge variant="secondary">{item.urls.length} URLs</Badge>
                  </div>
                  <div className="space-y-1">
                    {item.urls.map((url, index) => (
                      <div key={index} className="text-sm text-gray-600 truncate">
                        {url}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}