import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Image, FileImage } from 'lucide-react';
import { aiListingService, PropertyData } from '@/services/aiListingService';
import { toast } from 'sonner';

interface MediaItem {
  id: string;
  url: string;
  title?: string;
  category?: string;
  media_type: 'image' | 'video' | 'document';
}

interface AIMediaAltTextGeneratorProps {
  property: PropertyData;
  mediaItems: MediaItem[];
  onAltTextUpdate: (mediaId: string, altText: string) => void;
}

export const AIMediaAltTextGenerator: React.FC<AIMediaAltTextGeneratorProps> = ({
  property,
  mediaItems,
  onAltTextUpdate,
}) => {
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [generatedAltTexts, setGeneratedAltTexts] = useState<Record<string, string>>({});

  const generateAltText = async (mediaItem: MediaItem) => {
    setGeneratingFor(mediaItem.id);
    try {
      const result = await aiListingService.generateAltText(mediaItem.url, property);
      const altText = result.content.trim();
      
      setGeneratedAltTexts(prev => ({
        ...prev,
        [mediaItem.id]: altText
      }));
      
      toast.success(`Alt text generated for ${mediaItem.media_type}`);
    } catch (error) {
      console.error('Error generating alt text:', error);
      toast.error('Failed to generate alt text');
    } finally {
      setGeneratingFor(null);
    }
  };

  const generateAllAltTexts = async () => {
    const imageItems = mediaItems.filter(item => item.media_type === 'image');
    
    for (const item of imageItems) {
      if (!generatedAltTexts[item.id]) {
        await generateAltText(item);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const handleUseAltText = (mediaId: string, altText: string) => {
    onAltTextUpdate(mediaId, altText);
    toast.success('Alt text applied');
  };

  const imageItems = mediaItems.filter(item => item.media_type === 'image');

  if (imageItems.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No images found to generate alt text for</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Alt Text Generator</h3>
          <p className="text-sm text-muted-foreground">
            Generate SEO-friendly alt text for your property images
          </p>
        </div>
        <Button
          onClick={generateAllAltTexts}
          disabled={generatingFor !== null}
          className="flex items-center gap-2"
        >
          {generatingFor ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileImage className="h-4 w-4" />
          )}
          Generate All
        </Button>
      </div>

      <div className="grid gap-4">
        {imageItems.map((item) => (
          <div key={item.id} className="border rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <img
                  src={item.url}
                  alt={item.title || 'Property image'}
                  className="w-20 h-20 object-cover rounded-md"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium truncate">
                    {item.title || `Image ${item.id.slice(0, 8)}`}
                  </span>
                  {item.category && (
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                  )}
                </div>

                {generatedAltTexts[item.id] ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm">{generatedAltTexts[item.id]}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUseAltText(item.id, generatedAltTexts[item.id])}
                      >
                        Use This Alt Text
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateAltText(item)}
                        disabled={generatingFor === item.id}
                      >
                        Regenerate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => generateAltText(item)}
                    disabled={generatingFor === item.id}
                    className="flex items-center gap-2"
                  >
                    {generatingFor === item.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileImage className="h-4 w-4" />
                        Generate Alt Text
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};