import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/lib/stores/userStore';
import DOMPurify from 'dompurify';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AILanguageSelector } from '@/components/AILanguageSelector';
import { 
  Wand2, 
  RefreshCw, 
  Save, 
  Edit3, 
  Eye, 
  Copy,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Globe
} from 'lucide-react';

interface PropertyData {
  id: string;
  title: string;
  description?: string;
  street_name?: string;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_meters?: number;
  monthly_rent?: number;
  weekly_rate?: number;
  daily_rate?: number;
  apartment_type?: string;
  category?: string;
}

interface AIDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyData;
  onSave: (description: string) => void;
}

const TONE_PRESETS = [
  { value: 'professional and premium', label: '🏙️ Professional & Premium', description: 'Sophisticated and upscale' },
  { value: 'warm and family-friendly', label: '🏡 Family-Friendly', description: 'Welcoming and homey' },
  { value: 'minimal and modern', label: '✨ Minimal & Modern', description: 'Clean and contemporary' },
  { value: 'luxurious and exclusive', label: '💎 Luxurious', description: 'High-end and exclusive' },
  { value: 'corporate and investor-focused', label: '📈 Corporate', description: 'Business-oriented' },
  { value: 'cozy and intimate', label: '🕯️ Cozy & Intimate', description: 'Comfortable and personal' }
];

// Remove the LANGUAGE_OPTIONS since we're using AILanguageSelector now

export function AIDescriptionModal({ isOpen, onClose, property, onSave }: AIDescriptionModalProps) {
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [customTone, setCustomTone] = useState('');
  const [selectedTone, setSelectedTone] = useState('professional and premium');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'de' | 'auto'>('auto');
  const [format, setFormat] = useState<'html' | 'markdown'>('html');
  const [maxLength, setMaxLength] = useState(500);
  const [includeFeatures, setIncludeFeatures] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [generationMetadata, setGenerationMetadata] = useState<any>(null);
  const { toast } = useToast();
  const { t } = useTranslation('common');
  const { profile } = useUserStore();

  useEffect(() => {
    if (isOpen && property.description) {
      setEditedDescription(property.description);
      setGeneratedDescription(property.description);
    }
  }, [isOpen, property.description]);

  const generateDescription = async () => {
    setIsGenerating(true);
    
    try {
      const tone = customTone.trim() || selectedTone;
      
      // Determine the actual language to use
      let targetLanguage = selectedLanguage;
      if (selectedLanguage === 'auto') {
        targetLanguage = profile?.preferred_language || 'en';
      }
      
      const { data, error } = await supabase.functions.invoke('generate-property-description', {
        body: {
          property: {
            title: property.title,
            street_name: property.street_name,
            city: property.city,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            square_meters: property.square_meters,
            monthly_rent: property.monthly_rent,
            weekly_rate: property.weekly_rate,
            daily_rate: property.daily_rate,
            apartment_type: property.apartment_type,
            category: property.category,
            description: property.description
          },
          tone,
          format,
          language: targetLanguage,
          maxLength,
          includeFeatures
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.description) {
        setGeneratedDescription(data.description);
        setEditedDescription(data.description);
        setGenerationMetadata(data.metadata);
        setIsPreviewMode(true);
        
        toast({
          title: "✨ Description Generated!",
          description: `Created ${data.metadata?.characterCount || 'new'} character description`,
        });
      } else if (data?.fallback) {
        setGeneratedDescription(data.fallback);
        setEditedDescription(data.fallback);
        
        toast({
          title: "⚠️ Fallback Used",
          description: "AI generation failed, using fallback description",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Failed to generate description:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    const finalDescription = editedDescription.trim();
    
    if (!finalDescription) {
      toast({
        title: "Empty Description",
        description: "Please enter a description before saving",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update the property in the database
      const { error } = await supabase
        .from('properties')
        .update({ description: finalDescription })
        .eq('id', property.id);

      if (error) throw error;

      onSave(finalDescription);
      onClose();
      
      toast({
        title: "✅ Description Saved",
        description: "Property description updated successfully",
      });

    } catch (error) {
      console.error('Failed to save description:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editedDescription);
      toast({
        title: "📋 Copied!",
        description: "Description copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const renderPreview = () => {
    if (format === 'markdown') {
      // Safe markdown to HTML conversion for preview
      const html = editedDescription
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\n/g, '<br>');
      
      // Sanitize HTML to prevent XSS
      const sanitizedHtml = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['strong', 'em', 'h1', 'h2', 'h3', 'br', 'p'],
        ALLOWED_ATTR: []
      });
      
      return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} className="prose prose-sm max-w-none" />;
    } else {
      // Sanitize HTML content to prevent XSS
      const sanitizedHtml = DOMPurify.sanitize(editedDescription, {
        ALLOWED_TAGS: ['strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: []
      });
      return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} className="prose prose-sm max-w-none" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            AI Property Description Assistant
          </DialogTitle>
          <DialogDescription>
            Generate compelling property descriptions using AI for "{property.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Generation Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <Label>Tone & Style</Label>
              <Select value={selectedTone} onValueChange={setSelectedTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  {TONE_PRESETS.map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      <div>
                        <div className="font-medium">{preset.label}</div>
                        <div className="text-xs text-muted-foreground">{preset.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Or enter custom tone..."
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <AILanguageSelector
                    value={selectedLanguage}
                    onChange={(lang) => setSelectedLanguage(lang as 'en' | 'de' | 'auto')}
                    label={t('ai.generation_language')}
                    description="Choose the language for AI-generated content"
                    showAutoOption={true}
                  />
                </div>

                <div className="flex-1">
                  <Label>Format</Label>
                  <Select value={format} onValueChange={(value: 'html' | 'markdown') => setFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="markdown">Markdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-features"
                    checked={includeFeatures}
                    onCheckedChange={setIncludeFeatures}
                  />
                  <Label htmlFor="include-features" className="text-sm">Include features</Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Max length:</Label>
                  <Input
                    type="number"
                    value={maxLength}
                    onChange={(e) => setMaxLength(Number(e.target.value))}
                    className="w-20 h-8 text-sm"
                    min={100}
                    max={1000}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex gap-2">
            <Button 
              onClick={generateDescription}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {generatedDescription ? 'Regenerate' : 'Generate'} Description
                </>
              )}
            </Button>
          </div>

          {/* Description Editor/Preview */}
          {generatedDescription && (
            <div className="space-y-4">
              {generationMetadata && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Generated {generationMetadata.characterCount} characters in {generationMetadata.format.toUpperCase()} format
                    {generationMetadata.tone && ` with ${generationMetadata.tone} tone`}
                  </AlertDescription>
                </Alert>
              )}

              <Tabs value={isPreviewMode ? 'preview' : 'edit'} onValueChange={(value) => setIsPreviewMode(value === 'preview')}>
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="preview" className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="edit" className="flex items-center gap-1">
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    
                    <Badge variant="secondary" className="text-xs">
                      {editedDescription.length} chars
                    </Badge>
                  </div>
                </div>

                <TabsContent value="preview" className="mt-4">
                  <div className="border rounded-lg p-4 bg-background min-h-[200px]">
                    {renderPreview()}
                  </div>
                </TabsContent>

                <TabsContent value="edit" className="mt-4">
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Edit the generated description..."
                    className="min-h-[200px] font-mono text-sm"
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            {generatedDescription && (
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Description
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}