import { STANDARD_CATEGORIES } from '@/components/ColumnMapper';

interface CategoryMapping {
  category: string;
  keywords: string[];
  confidence: number;
}

// AI-powered category detection patterns
const CATEGORY_PATTERNS: CategoryMapping[] = [
  {
    category: 'Furnished apartment',
    keywords: ['furnished', 'apartment', 'flat', 'fully furnished', 'möbliert', 'wohnung', 'eingerichtet'],
    confidence: 0.9
  },
  {
    category: 'Furnished house',
    keywords: ['furnished', 'house', 'villa', 'townhouse', 'fully furnished', 'möbliert', 'haus', 'eingerichtet'],
    confidence: 0.9
  },
  {
    category: 'Serviced apartment',
    keywords: ['serviced', 'apartment', 'service', 'hotel', 'aparthotel', 'boarding', 'temporary'],
    confidence: 0.95
  },
  {
    category: 'Apartment for rent',
    keywords: ['apartment', 'flat', 'rent', 'rental', 'miete', 'wohnung', 'zu vermieten'],
    confidence: 0.8
  },
  {
    category: 'House for rent',
    keywords: ['house', 'villa', 'townhouse', 'rent', 'rental', 'miete', 'haus', 'zu vermieten'],
    confidence: 0.8
  },
  {
    category: 'Apartment for sale',
    keywords: ['apartment', 'flat', 'sale', 'buy', 'purchase', 'verkauf', 'wohnung', 'zu verkaufen'],
    confidence: 0.85
  },
  {
    category: 'House for sale',
    keywords: ['house', 'villa', 'townhouse', 'sale', 'buy', 'purchase', 'verkauf', 'haus', 'zu verkaufen'],
    confidence: 0.85
  }
];

/**
 * Auto-categorizes a property based on its title and description
 * @param title Property title
 * @param description Property description
 * @returns Predicted category with confidence score
 */
export function autoCategorizeProperty(title = '', description = ''): {
  category: string | null;
  confidence: number;
  reasoning: string;
} {
  const combinedText = `${title} ${description}`.toLowerCase();
  
  if (!combinedText.trim()) {
    return {
      category: null,
      confidence: 0,
      reasoning: 'No text provided for categorization'
    };
  }

  let bestMatch: CategoryMapping | null = null;
  let highestScore = 0;
  let matchedKeywords: string[] = [];

  // Calculate scores for each category
  for (const pattern of CATEGORY_PATTERNS) {
    const foundKeywords = pattern.keywords.filter(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );
    
    if (foundKeywords.length > 0) {
      // Score based on keyword matches and base confidence
      const keywordScore = foundKeywords.length / pattern.keywords.length;
      const totalScore = keywordScore * pattern.confidence;
      
      if (totalScore > highestScore) {
        highestScore = totalScore;
        bestMatch = pattern;
        matchedKeywords = foundKeywords;
      }
    }
  }

  // Require minimum confidence threshold
  const minConfidence = 0.3;
  if (highestScore < minConfidence || !bestMatch) {
    return {
      category: null,
      confidence: 0,
      reasoning: 'No clear category pattern detected'
    };
  }

  return {
    category: bestMatch.category,
    confidence: Math.min(highestScore, 0.95), // Cap at 95%
    reasoning: `Detected "${bestMatch.category}" based on keywords: ${matchedKeywords.join(', ')}`
  };
}

/**
 * Auto-detect apartment type based on text content
 * @param title Property title
 * @param description Property description
 * @returns Predicted apartment type
 */
export function autoDetectApartmentType(title = '', description = ''): {
  type: string | null;
  confidence: number;
  reasoning: string;
} {
  const combinedText = `${title} ${description}`.toLowerCase();
  
  const typePatterns = [
    { type: 'Studio', keywords: ['studio', 'bachelor', 'efficiency', 'einzimmer'], confidence: 0.9 },
    { type: '1-Bedroom', keywords: ['1 bedroom', '1-bedroom', '1 bed', 'one bedroom'], confidence: 0.85 },
    { type: '2-Bedroom', keywords: ['2 bedroom', '2-bedroom', '2 bed', 'two bedroom'], confidence: 0.85 },
    { type: '3-Bedroom', keywords: ['3 bedroom', '3-bedroom', '3 bed', 'three bedroom'], confidence: 0.85 },
    { type: 'Penthouse', keywords: ['penthouse', 'rooftop', 'top floor'], confidence: 0.95 },
    { type: 'Loft', keywords: ['loft', 'industrial', 'converted'], confidence: 0.9 },
    { type: 'Duplex', keywords: ['duplex', 'two level', 'split level'], confidence: 0.9 }
  ];

  for (const pattern of typePatterns) {
    const foundKeywords = pattern.keywords.filter(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );
    
    if (foundKeywords.length > 0) {
      return {
        type: pattern.type,
        confidence: pattern.confidence,
        reasoning: `Detected based on keywords: ${foundKeywords.join(', ')}`
      };
    }
  }

  return {
    type: null,
    confidence: 0,
    reasoning: 'No apartment type pattern detected'
  };
}