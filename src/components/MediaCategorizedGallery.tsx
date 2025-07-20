import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Camera, 
  Eye, 
  Tag, 
  Bot, 
  User, 
  Filter, 
  ExternalLink,
  Maximize2,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { mediaIntelligenceService, IMAGE_CATEGORIES, ImageCategory, ImageCategorization } from '@/services/mediaIntelligenceService';
import { useToast } from '@/hooks/use-toast';

interface MediaCategorizedGalleryProps {
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

type FilterMode = 'all' | 'auto' | 'manual';

const MediaCategorizedGallery: React.FC<MediaCategorizedGalleryProps> = ({ propertyId }) => {
  const { toast } = useToast();
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedImage, setSelectedImage] = useState<PropertyMedia | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Fetch property media
  const { data: mediaData, isLoading, refetch } = useQuery({
    queryKey: ['property-media-gallery', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_media')
        .select('*')
        .eq('property_id', propertyId)
        .eq('media_type', 'photo')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as PropertyMedia[];
    }
  });

  // Fetch categorization data
  const { data: categorizations } = useQuery({
    queryKey: ['image-categorizations-gallery', propertyId],
    queryFn: () => mediaIntelligenceService.getImageCategorizations(propertyId)
  });

  // Filter and group media
  const filteredMedia = useMemo(() => {
    if (!mediaData) return [];
    
    return mediaData.filter(media => {
      const categorization = categorizations?.find(c => c.image_url === media.url);
      
      switch (filterMode) {
        case 'auto':
          return categorization?.is_auto_assigned === true;
        case 'manual':
          return categorization?.is_auto_assigned === false;
        default:
          return true;
      }
    });
  }, [mediaData, categorizations, filterMode]);

  const groupedMedia = useMemo(() => {
    const groups: Record<string, PropertyMedia[]> = {};
    
    filteredMedia.forEach(media => {
      const category = media.ai_category || 'uncategorized';
      if (!groups[category]) groups[category] = [];
      groups[category].push(media);
    });
    
    return groups;
  }, [filteredMedia]);

  // Get categorization info for an image
  const getCategorization = (imageUrl: string) => {
    return categorizations?.find(c => c.image_url === imageUrl);
  };

  // Handle category reassignment
  const handleCategoryChange = async (mediaId: string, newCategory: ImageCategory) => {
    try {
      const media = mediaData?.find(m => m.id === mediaId);
      if (!media) return;

      const categorization = getCategorization(media.url);
      if (categorization) {
        await mediaIntelligenceService.updateCategorization(categorization.id, newCategory);
      }

      await mediaIntelligenceService.updatePropertyMediaCategorization(mediaId, newCategory, 1.0);
      
      refetch();
      toast({
        title: "Category Updated",
        description: "Image category has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update image category.",
        variant: "destructive",
      });
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredMedia.length;
    const autoCategorized = filteredMedia.filter(m => {
      const cat = getCategorization(m.url);
      return cat?.is_auto_assigned === true;
    }).length;
    const manuallyLabeled = filteredMedia.filter(m => {
      const cat = getCategorization(m.url);
      return cat?.is_auto_assigned === false;
    }).length;
    
    return { total, autoCategorized, manuallyLabeled };
  }, [filteredMedia, categorizations]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Media Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Media Gallery ({stats.total} images)
            </CardTitle>
            
            <div className="flex items-center gap-4">
              {/* Filter toggle */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <ToggleGroup 
                  type="single" 
                  value={filterMode} 
                  onValueChange={(value) => value && setFilterMode(value as FilterMode)}
                  className="border rounded-lg"
                >
                  <ToggleGroupItem value="all" className="text-xs">
                    All ({stats.total})
                  </ToggleGroupItem>
                  <ToggleGroupItem value="auto" className="text-xs">
                    <Bot className="w-3 h-3 mr-1" />
                    Auto ({stats.autoCategorized})
                  </ToggleGroupItem>
                  <ToggleGroupItem value="manual" className="text-xs">
                    <User className="w-3 h-3 mr-1" />
                    Manual ({stats.manuallyLabeled})
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Categorized Gallery */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-6">
          <TabsTrigger value="all" className="text-xs">
            All ({filteredMedia.length})
          </TabsTrigger>
          {IMAGE_CATEGORIES.slice(0, 6).map(category => {
            const count = groupedMedia[category.value]?.length || 0;
            return (
              <TabsTrigger key={category.value} value={category.value} className="text-xs">
                {category.label} ({count})
              </TabsTrigger>
            );
          })}
          <TabsTrigger value="uncategorized" className="text-xs">
            Other ({groupedMedia.uncategorized?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredMedia.map((media) => (
              <MediaCard 
                key={media.id} 
                media={media} 
                categorization={getCategorization(media.url)}
                onCategoryChange={handleCategoryChange}
                onImageClick={setSelectedImage}
              />
            ))}
          </div>
        </TabsContent>

        {Object.entries(groupedMedia).map(([category, images]) => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map((media) => (
                <MediaCard 
                  key={media.id} 
                  media={media} 
                  categorization={getCategorization(media.url)}
                  onCategoryChange={handleCategoryChange}
                  onImageClick={setSelectedImage}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {selectedImage?.title || 'Image Preview'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.title || 'Property image'}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedImage.ai_category && (
                    <Badge variant="outline">
                      {IMAGE_CATEGORIES.find(cat => cat.value === selectedImage.ai_category)?.label}
                    </Badge>
                  )}
                  {selectedImage.confidence_score && (
                    <Badge variant="secondary">
                      {Math.round(selectedImage.confidence_score * 100)}% confidence
                    </Badge>
                  )}
                </div>
                
                <Button variant="outline" size="sm" asChild>
                  <a href={selectedImage.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Original
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Media Card Component
interface MediaCardProps {
  media: PropertyMedia;
  categorization?: ImageCategorization;
  onCategoryChange: (mediaId: string, category: ImageCategory) => void;
  onImageClick: (media: PropertyMedia) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ 
  media, 
  categorization, 
  onCategoryChange, 
  onImageClick 
}) => {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 hover-scale">
      <div className="relative aspect-square bg-muted">
        <img 
          src={media.url} 
          alt={media.title || 'Property image'}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => onImageClick(media)}
        />
        
        {/* Overlay with expand icon */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Maximize2 className="w-6 h-6 text-white" />
        </div>
        
        {/* Category badge */}
        {media.ai_category && (
          <Badge 
            className="absolute top-2 left-2"
            variant={categorization?.is_auto_assigned ? "default" : "secondary"}
          >
            <div className="flex items-center gap-1">
              {categorization?.is_auto_assigned ? 
                <Bot className="w-3 h-3" /> : 
                <User className="w-3 h-3" />
              }
              {IMAGE_CATEGORIES.find(cat => cat.value === media.ai_category)?.label}
            </div>
          </Badge>
        )}
        
        {/* Confidence score */}
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
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate flex-1">
            {media.title || 'Untitled'}
          </span>
          
          {/* Category reassignment dropdown */}
          <Select
            value={media.ai_category || ''}
            onValueChange={(value) => onCategoryChange(media.id, value as ImageCategory)}
          >
            <SelectTrigger className="w-8 h-8 p-0 border-none hover:bg-muted">
              <Tag className="w-3 h-3" />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <span>{cat.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaCategorizedGallery;