import { franc } from 'franc-min';

// Language code mappings
const LANGUAGE_MAP: Record<string, string> = {
  'deu': 'de',
  'eng': 'en',
  'ger': 'de', // Alternative German code
};

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  detectedFrom: string[];
}

export function detectLanguage(texts: (string | null | undefined)[]): LanguageDetectionResult {
  // Filter out empty or null texts
  const validTexts = texts.filter(text => text && text.trim().length > 10);
  
  if (validTexts.length === 0) {
    return {
      language: 'unknown',
      confidence: 0,
      detectedFrom: []
    };
  }

  // Combine all texts for better detection accuracy
  const combinedText = validTexts.join(' ').trim();
  
  if (combinedText.length < 20) {
    return {
      language: 'unknown',
      confidence: 0,
      detectedFrom: validTexts
    };
  }

  try {
    // Use franc to detect language
    const detectedCode = franc(combinedText);
    const language = LANGUAGE_MAP[detectedCode] || 'unknown';
    
    // Calculate confidence based on text length and detection result
    const confidence = detectedCode !== 'und' && language !== 'unknown' 
      ? Math.min(0.9, combinedText.length / 100) 
      : 0;

    return {
      language,
      confidence,
      detectedFrom: validTexts
    };
  } catch (error) {
    console.error('Language detection error:', error);
    return {
      language: 'unknown',
      confidence: 0,
      detectedFrom: validTexts
    };
  }
}

export interface TranslationStatus {
  hasGerman: boolean;
  hasEnglish: boolean;
  missingLanguages: string[];
  detectedLanguage?: string;
}

export function getTranslationStatus(property: {
  title?: string;
  description?: string;
  title_de?: string;
  title_en?: string;
  description_de?: string;
  description_en?: string;
  language_detected?: string;
}): TranslationStatus {
  const hasGerman = !!(property.title_de || property.description_de);
  const hasEnglish = !!(property.title_en || property.description_en);
  
  // If no explicit translations, check main fields based on detected language
  const detectedLang = property.language_detected;
  const hasMainContent = !!(property.title || property.description);
  
  const finalHasGerman = hasGerman || (detectedLang === 'de' && hasMainContent);
  const finalHasEnglish = hasEnglish || (detectedLang === 'en' && hasMainContent);
  
  const missingLanguages: string[] = [];
  if (!finalHasGerman) missingLanguages.push('de');
  if (!finalHasEnglish) missingLanguages.push('en');
  
  return {
    hasGerman: finalHasGerman,
    hasEnglish: finalHasEnglish,
    missingLanguages,
    detectedLanguage: detectedLang
  };
}

export function shouldGenerateTranslation(
  property: any,
  targetLanguage: 'de' | 'en'
): boolean {
  const status = getTranslationStatus(property);
  
  // Only generate if target language is missing
  if (targetLanguage === 'de' && status.hasGerman) return false;
  if (targetLanguage === 'en' && status.hasEnglish) return false;
  
  // And if we have content in the other language
  if (targetLanguage === 'de' && !status.hasEnglish) return false;
  if (targetLanguage === 'en' && !status.hasGerman) return false;
  
  return true;
}

export function getSourceContentForTranslation(
  property: any,
  targetLanguage: 'de' | 'en'
): { title?: string; description?: string; metaDescription?: string } {
  const detectedLang = property.language_detected;
  
  if (targetLanguage === 'en') {
    // Generate English from German content
    return {
      title: property.title_de || (detectedLang === 'de' ? property.title : undefined),
      description: property.description_de || (detectedLang === 'de' ? property.description : undefined),
      metaDescription: property.meta_description_de
    };
  } else {
    // Generate German from English content
    return {
      title: property.title_en || (detectedLang === 'en' ? property.title : undefined),
      description: property.description_en || (detectedLang === 'en' ? property.description : undefined),
      metaDescription: property.meta_description_en
    };
  }
}