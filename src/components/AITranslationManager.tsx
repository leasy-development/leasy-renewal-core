import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Languages, Copy, Check } from 'lucide-react';
import { aiListingService, PropertyData } from '@/services/aiListingService';
import { toast } from 'sonner';

interface Translation {
  language: string;
  title: string;
  description: string;
}

interface AITranslationManagerProps {
  property: PropertyData;
  onTranslationUpdate: (translations: Translation[]) => void;
}

const LANGUAGES = [
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
];

export const AITranslationManager: React.FC<AITranslationManagerProps> = ({
  property,
  onTranslationUpdate,
}) => {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('de');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const translateToLanguage = async (targetLanguage: string) => {
    if (!property.title && !property.description) {
      toast.error('No content to translate');
      return;
    }

    setIsTranslating(true);
    try {
      const promises = [];
      
      if (property.title) {
        promises.push(
          aiListingService.translateContent(property.title, targetLanguage, property)
        );
      }
      
      if (property.description) {
        promises.push(
          aiListingService.translateContent(property.description, targetLanguage, property)
        );
      }

      const results = await Promise.all(promises);
      
      const newTranslation: Translation = {
        language: targetLanguage,
        title: property.title ? results[0]?.content || property.title : property.title || '',
        description: property.description ? results[property.title ? 1 : 0]?.content || property.description : property.description || '',
      };

      setTranslations(prev => {
        const updated = prev.filter(t => t.language !== targetLanguage);
        return [...updated, newTranslation];
      });

      toast.success(`Translated to ${LANGUAGES.find(l => l.code === targetLanguage)?.name}`);
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate content');
    } finally {
      setIsTranslating(false);
    }
  };

  const translateAll = async () => {
    const targetLanguages = LANGUAGES.map(l => l.code).filter(code => code !== 'en'); // Assume source is English
    
    for (const lang of targetLanguages) {
      await translateToLanguage(lang);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const copyToClipboard = async (content: string, field: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleSaveTranslations = () => {
    onTranslationUpdate(translations);
    toast.success('Translations saved');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            AI Translation Manager
          </h3>
          <p className="text-sm text-muted-foreground">
            Generate translations for your property listing in multiple languages
          </p>
        </div>
        <Button
          onClick={translateAll}
          disabled={isTranslating}
          className="flex items-center gap-2"
        >
          {isTranslating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Languages className="h-4 w-4" />
          )}
          Translate All
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Translation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="language-select">Target Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => translateToLanguage(selectedLanguage)}
                disabled={isTranslating}
              >
                Translate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {translations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Generated Translations</h4>
            <Button onClick={handleSaveTranslations} size="sm">
              Save All Translations
            </Button>
          </div>

          <Tabs defaultValue={translations[0]?.language}>
            <TabsList className="grid w-full grid-cols-auto">
              {translations.map((translation) => {
                const lang = LANGUAGES.find(l => l.code === translation.language);
                return (
                  <TabsTrigger key={translation.language} value={translation.language}>
                    {lang?.flag} {lang?.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {translations.map((translation) => (
              <TabsContent key={translation.language} value={translation.language}>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Title</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(translation.title, `title-${translation.language}`)}
                      >
                        {copiedField === `title-${translation.language}` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm">{translation.title}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Description</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(translation.description, `desc-${translation.language}`)}
                      >
                        {copiedField === `desc-${translation.language}` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Textarea
                      value={translation.description}
                      onChange={(e) => {
                        setTranslations(prev =>
                          prev.map(t =>
                            t.language === translation.language
                              ? { ...t, description: e.target.value }
                              : t
                          )
                        );
                      }}
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
};