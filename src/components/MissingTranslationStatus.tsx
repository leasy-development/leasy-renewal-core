import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Languages, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles,
  Loader2 
} from 'lucide-react';
import { getTranslationStatus, TranslationStatus } from '@/lib/languageDetection';

interface MissingTranslationStatusProps {
  property: {
    title?: string;
    description?: string;
    title_de?: string;
    title_en?: string;
    description_de?: string;
    description_en?: string;
    language_detected?: string;
  };
  onGenerateMissing?: (targetLanguage: 'de' | 'en') => Promise<void>;
  isGenerating?: boolean;
}

export const MissingTranslationStatus: React.FC<MissingTranslationStatusProps> = ({
  property,
  onGenerateMissing,
  isGenerating = false
}) => {
  const status = getTranslationStatus(property);

  const LanguageStatusBadge: React.FC<{ 
    language: string; 
    hasContent: boolean; 
    isDetected?: boolean;
  }> = ({ language, hasContent, isDetected }) => {
    const languageName = language === 'de' ? 'German' : 'English';
    const flag = language === 'de' ? '🇩🇪' : '🇬🇧';
    
    if (hasContent) {
      return (
        <Badge variant="secondary" className="gap-2">
          <CheckCircle className="h-3 w-3 text-green-600" />
          {flag} {languageName}
          {isDetected && (
            <span className="text-xs text-muted-foreground">(detected)</span>
          )}
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="gap-2 border-amber-200 text-amber-700">
        <AlertTriangle className="h-3 w-3" />
        {flag} {languageName} Missing
      </Badge>
    );
  };

  const GenerateButton: React.FC<{ targetLanguage: 'de' | 'en' }> = ({ targetLanguage }) => {
    const languageName = targetLanguage === 'de' ? 'German' : 'English';
    const flag = targetLanguage === 'de' ? '🇩🇪' : '🇬🇧';
    
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => onGenerateMissing?.(targetLanguage)}
        disabled={isGenerating || !onGenerateMissing}
        className="gap-2"
      >
        {isGenerating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        Generate {flag} {languageName}
      </Button>
    );
  };

  if (status.hasGerman && status.hasEnglish) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Languages className="h-4 w-4 text-green-600" />
            Translation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <LanguageStatusBadge 
              language="de" 
              hasContent={status.hasGerman}
              isDetected={status.detectedLanguage === 'de'}
            />
            <LanguageStatusBadge 
              language="en" 
              hasContent={status.hasEnglish}
              isDetected={status.detectedLanguage === 'en'}
            />
          </div>
          <p className="text-xs text-green-700 mt-2">
            ✅ All languages available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Languages className="h-4 w-4 text-amber-600" />
          Translation Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <LanguageStatusBadge 
            language="de" 
            hasContent={status.hasGerman}
            isDetected={status.detectedLanguage === 'de'}
          />
          <LanguageStatusBadge 
            language="en" 
            hasContent={status.hasEnglish}
            isDetected={status.detectedLanguage === 'en'}
          />
        </div>
        
        {status.detectedLanguage && (
          <p className="text-xs text-muted-foreground">
            🤖 Detected language: {status.detectedLanguage === 'de' ? 'German' : 'English'}
          </p>
        )}
        
        {status.missingLanguages.length > 0 && onGenerateMissing && (
          <div className="flex gap-2 flex-wrap">
            {status.missingLanguages.map((lang) => (
              <GenerateButton 
                key={lang} 
                targetLanguage={lang as 'de' | 'en'} 
              />
            ))}
          </div>
        )}
        
        {status.missingLanguages.length > 0 && (
          <p className="text-xs text-amber-700">
            ⚠️ Generate missing translations to improve reach
          </p>
        )}
      </CardContent>
    </Card>
  );
};