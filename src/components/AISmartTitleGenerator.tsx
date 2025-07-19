import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { aiListingService, PropertyData } from '@/services/aiListingService';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AISmartTitleGeneratorProps {
  property: PropertyData;
  currentTitle: string;
  onTitleUpdate: (title: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AISmartTitleGenerator: React.FC<AISmartTitleGeneratorProps> = ({
  property,
  currentTitle,
  onTitleUpdate,
  isOpen,
  onClose,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');

  const generateTitles = async (prompt?: string) => {
    setIsGenerating(true);
    try {
      // Generate multiple title variations
      const promises = [
        aiListingService.generateTitle(property, prompt || 'Create a compelling, SEO-optimized title'),
        aiListingService.generateTitle(property, prompt || 'Create a short, catchy title emphasizing location'),
        aiListingService.generateTitle(property, prompt || 'Create a detailed title including key features'),
      ];

      const results = await Promise.all(promises);
      const titles = results.map(result => result.content.trim());
      setGeneratedTitles(titles);
      
      toast.success('Smart titles generated!');
    } catch (error) {
      console.error('Error generating titles:', error);
      toast.error('Failed to generate titles');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseTitle = (title: string) => {
    onTitleUpdate(title);
    toast.success('Title updated!');
    onClose();
  };

  const handleCustomGenerate = () => {
    if (!customPrompt.trim()) {
      toast.error('Please enter a custom prompt');
      return;
    }
    generateTitles(customPrompt);
  };

  React.useEffect(() => {
    if (isOpen && generatedTitles.length === 0) {
      generateTitles();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart Title Generator
          </DialogTitle>
          <DialogDescription>
            Generate optimized property titles using AI based on your listing details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium">Current Title</Label>
            <div className="p-3 bg-muted rounded-md text-sm">
              {currentTitle || 'No title set'}
            </div>
          </div>

          {isGenerating ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Generating smart titles...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Generated Titles</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateTitles()}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </Button>
              </div>

              {generatedTitles.length > 0 && (
                <div className="space-y-3">
                  {generatedTitles.map((title, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1">Option {index + 1}</p>
                          <p className="text-sm text-muted-foreground">{title}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUseTitle(title)}
                          className="ml-3"
                        >
                          Use This
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-medium">Custom Prompt</Label>
            <Textarea
              placeholder="e.g., 'Add neighborhood name and highlight the view' or 'Make it more luxury-focused'"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleCustomGenerate}
              disabled={isGenerating || !customPrompt.trim()}
              className="w-full"
            >
              Generate with Custom Prompt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};