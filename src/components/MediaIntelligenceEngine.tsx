import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Brain, Camera, FileImage, CheckCircle, AlertCircle, RefreshCw, Eye, Tag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { mediaIntelligenceService, ImageCategory, IMAGE_CATEGORIES } from '@/services/mediaIntelligenceService';

interface MediaIntelligenceEngineProps {
  propertyId: string;
}

interface PropertyMedia {
  id: string;
  url: string;
  media_type: string;
  category?: string;
  title?: string;
  sort_order: number;
  ai_category?: ImageCategory;
  confidence_score?: number;
  created_at: string;
}

interface ImageCategorization {
  id: string;
  image_url: string;
  predicted_category?: ImageCategory;
  confidence_score?: number;
  final_category?: ImageCategory;
  is_auto_assigned: boolean;
}

const MediaIntelligenceEngine: React.FC<MediaIntelligenceEngineProps> = ({ propertyId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [processingImages, setProcessingImages] = useState<Set<string>>(new Set());

  // Fetch property media
  const { data: mediaData, isLoading: mediaLoading } = useQuery({
    queryKey: ['property-media', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_media')
        .select('*')
        .eq('property_id', propertyId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as PropertyMedia[];
    }
  });

  // Fetch categorization data
  const { data: categorizations, isLoading: categorizationsLoading } = useQuery({
    queryKey: ['image-categorizations', propertyId],
    queryFn: () => mediaIntelligenceService.getImageCategorizations(propertyId)
  });

  // Fetch audit trail
  const { data: auditTrail } = useQuery({
    queryKey: ['image-audit-trail', propertyId],
    queryFn: () => mediaIntelligenceService.getAuditTrail(propertyId)
  });

  // AI categorization mutation
  const categorizationMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const response = await supabase.functions.invoke('ai-image-categorization', {
        body: { imageUrl, property_id: propertyId }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: async (result, imageUrl) => {
      // Store categorization result
      await mediaIntelligenceService.storeCategorization(
        propertyId,
        imageUrl,
        result.category,
        result.confidence,
        true
      );

      // Update property media with AI category
      const media = mediaData?.find(m => m.url === imageUrl);
      if (media) {
        await mediaIntelligenceService.updatePropertyMediaCategorization(
          media.id,
          result.category,
          result.confidence
        );
      }

      // Record audit trail
      await mediaIntelligenceService.recordAuditTrail(
        propertyId,
        imageUrl,
        'manual_upload',
        { ai_analysis: result }
      );

      queryClient.invalidateQueries({ queryKey: ['property-media', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['image-categorizations', propertyId] });
      
      toast({
        title: "Image Analyzed",
        description: `Categorized as ${result.category} with ${Math.round(result.confidence * 100)}% confidence`,
      });
    },
    onError: (error) => {
      console.error('Categorization error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze image. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Manual category update mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ categorizationId, category }: { categorizationId: string; category: ImageCategory }) => {
      return await mediaIntelligenceService.updateCategorization(categorizationId, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image-categorizations', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['property-media', propertyId] });
      toast({
        title: "Category Updated",
        description: "Image category has been updated successfully.",
      });
    }
  });

  // Batch process all images
  const processBatch = async () => {
    if (!mediaData) return;

    const imageMedias = mediaData.filter(m => m.media_type === 'photo' && !m.ai_category);
    
    for (const media of imageMedias) {
      setProcessingImages(prev => new Set(prev).add(media.id));
      
      try {
        await categorizationMutation.mutateAsync(media.url);
      } catch (error) {
        console.error(`Failed to process ${media.url}:`, error);
      } finally {
        setProcessingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(media.id);
          return newSet;
        });
      }
    }
  };

  // Filter media by category
  const filteredMedia = mediaData?.filter(media => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'uncategorized') return !media.ai_category;
    return media.ai_category === selectedCategory;
  }) || [];

  // Group media by category
  const groupedMedia = filteredMedia.reduce((acc, media) => {
    const category = media.ai_category || 'uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(media);
    return acc;
  }, {} as Record<string, PropertyMedia[]>);

  // Get categorization for image
  const getCategorization = (imageUrl: string) => {
    return categorizations?.find(c => c.image_url === imageUrl);
  };

  // Calculate statistics
  const stats = {
    total: mediaData?.length || 0,
    categorized: mediaData?.filter(m => m.ai_category).length || 0,
    uncategorized: mediaData?.filter(m => !m.ai_category && m.media_type === 'photo').length || 0,
    highConfidence: mediaData?.filter(m => m.confidence_score && m.confidence_score >= 0.8).length || 0
  };

  if (mediaLoading || categorizationsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Media Intelligence Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Media Intelligence Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Media</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.categorized}</div>
              <div className="text-sm text-muted-foreground">Categorized</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.uncategorized}</div>
              <div className="text-sm text-muted-foreground">Needs Analysis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.highConfidence}</div>
              <div className="text-sm text-muted-foreground">High Confidence</div>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={processBatch}
              disabled={categorizationMutation.isPending || stats.uncategorized === 0}
              className="flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              Analyze All Images ({stats.uncategorized})
            </Button>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Images</SelectItem>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                <Separator />
                {IMAGE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedia.map((media) => {
              const categorization = getCategorization(media.url);
              const isProcessing = processingImages.has(media.id);
              
              return (
                <Card key={media.id} className="overflow-hidden">
                  <div className="relative aspect-square">
                    <img 
                      src={media.url} 
                      alt={media.title || 'Property image'}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Processing Overlay */}
                    {isProcessing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    {media.ai_category && (
                      <Badge 
                        className="absolute top-2 left-2"
                        variant={media.confidence_score && media.confidence_score >= 0.8 ? "default" : "secondary"}
                      >
                        {IMAGE_CATEGORIES.find(cat => cat.value === media.ai_category)?.label}
                      </Badge>
                    )}
                    
                    {/* Confidence Score */}
                    {media.confidence_score && (
                      <Badge 
                        className="absolute top-2 right-2"
                        variant="outline"
                      >
                        {Math.round(media.confidence_score * 100)}%
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {media.ai_category ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                        )}
                        <span className="text-sm font-medium truncate">
                          {media.title || 'Untitled'}
                        </span>
                      </div>
                      
                      <div className="flex gap-1">
                        {!media.ai_category && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => categorizationMutation.mutate(media.url)}
                            disabled={categorizationMutation.isPending || isProcessing}
                          >
                            <Brain className="w-3 h-3" />
                          </Button>
                        )}
                        
                        {categorization && (
                          <Select
                            value={categorization.final_category || ''}
                            onValueChange={(value) => 
                              updateCategoryMutation.mutate({
                                categorizationId: categorization.id,
                                category: value as ImageCategory
                              })
                            }
                          >
                            <SelectTrigger className="w-8 h-8 p-0">
                              <Tag className="w-3 h-3" />
                            </SelectTrigger>
                            <SelectContent>
                              {IMAGE_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <div className="space-y-6">
            {Object.entries(groupedMedia).map(([category, images]) => {
              const categoryInfo = IMAGE_CATEGORIES.find(cat => cat.value === category);
              
              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      {categoryInfo?.label || 'Uncategorized'} ({images.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {images.map((media) => (
                        <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden">
                          <img 
                            src={media.url} 
                            alt={media.title || 'Property image'}
                            className="w-full h-full object-cover"
                          />
                          {media.confidence_score && (
                            <Badge className="absolute bottom-1 right-1 text-xs">
                              {Math.round(media.confidence_score * 100)}%
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {auditTrail?.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <FileImage className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {entry.original_filename || 'Unknown file'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Source: {entry.source_type} • {new Date(entry.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="outline">{entry.source_type}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MediaIntelligenceEngine;