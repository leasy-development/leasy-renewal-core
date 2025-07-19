import { pipeline } from '@huggingface/transformers';
import * as fuzzball from 'fuzzball';
import sharp from 'sharp';
import { supabase } from '@/integrations/supabase/client';

interface PropertyInput {
  id: string;
  title: string;
  description?: string;
  street_name: string;
  street_number?: string;
  city: string;
  zip_code?: string;
  monthly_rent?: number;
  square_meters?: number;
  bedrooms?: number;
  mediaUrls?: string[];
}

interface DuplicateMatch {
  id: string;
  confidence: number;
  fields: {
    title?: string;
    address?: string;
    description?: string;
    rent?: string;
    size?: string;
    media?: string;
  };
}

interface MatchingResult {
  fuzzy_score: number;
  embedding_score: number;
  media_score: number;
  field_scores: Record<string, number>;
}

// Configuration thresholds
const THRESHOLDS = {
  fuzzy: {
    title: 0.85,
    address: 0.80,
    description: 0.85
  },
  embedding: 0.90,
  media: 0.95,
  overall: 0.70
};

// Weights for confidence scoring
const WEIGHTS = {
  fuzzy: 0.25,
  embedding: 0.50,
  media: 0.25
};

let embeddingPipeline: any = null;

// Initialize embedding pipeline (lazy loading)
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    try {
      embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { device: 'cpu' }
      );
    } catch (error) {
      console.error('Failed to load embedding pipeline:', error);
      throw new Error('Embedding pipeline initialization failed');
    }
  }
  return embeddingPipeline;
}

// Normalize text for consistent comparison
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Create address string for comparison
function createAddressString(property: PropertyInput): string {
  const parts = [
    property.street_number,
    property.street_name,
    property.city,
    property.zip_code
  ].filter(Boolean);
  return normalizeText(parts.join(' '));
}

// Fuzzy string matching layer
function calculateFuzzyScores(prop1: PropertyInput, prop2: PropertyInput): Record<string, number> {
  const scores: Record<string, number> = {};

  // Title similarity
  const title1 = normalizeText(prop1.title);
  const title2 = normalizeText(prop2.title);
  scores.title = fuzzball.ratio(title1, title2) / 100;

  // Address similarity
  const address1 = createAddressString(prop1);
  const address2 = createAddressString(prop2);
  scores.address = fuzzball.ratio(address1, address2) / 100;

  // Description similarity
  if (prop1.description && prop2.description) {
    const desc1 = normalizeText(prop1.description);
    const desc2 = normalizeText(prop2.description);
    scores.description = fuzzball.ratio(desc1, desc2) / 100;
  }

  // Rent similarity
  if (prop1.monthly_rent && prop2.monthly_rent) {
    const rentDiff = Math.abs(prop1.monthly_rent - prop2.monthly_rent);
    const avgRent = (prop1.monthly_rent + prop2.monthly_rent) / 2;
    scores.rent = Math.max(0, 1 - (rentDiff / avgRent));
  }

  // Size similarity
  if (prop1.square_meters && prop2.square_meters) {
    const sizeDiff = Math.abs(prop1.square_meters - prop2.square_meters);
    const avgSize = (prop1.square_meters + prop2.square_meters) / 2;
    scores.size = Math.max(0, 1 - (sizeDiff / avgSize));
  }

  return scores;
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

// Generate text embedding
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const pipeline = await getEmbeddingPipeline();
    const result = await pipeline(text, { pooling: 'mean', normalize: true });
    return Array.from(result.data);
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return [];
  }
}

// Sentence embeddings layer
async function calculateEmbeddingScores(prop1: PropertyInput, prop2: PropertyInput): Promise<Record<string, number>> {
  const scores: Record<string, number> = {};

  try {
    // Title embeddings
    const titleEmb1 = await generateEmbedding(prop1.title);
    const titleEmb2 = await generateEmbedding(prop2.title);
    if (titleEmb1.length > 0 && titleEmb2.length > 0) {
      scores.title_embedding = cosineSimilarity(titleEmb1, titleEmb2);
    }

    // Description embeddings
    if (prop1.description && prop2.description) {
      const descEmb1 = await generateEmbedding(prop1.description);
      const descEmb2 = await generateEmbedding(prop2.description);
      if (descEmb1.length > 0 && descEmb2.length > 0) {
        scores.description_embedding = cosineSimilarity(descEmb1, descEmb2);
      }
    }

    // Combined text embedding
    const combinedText1 = `${prop1.title} ${prop1.description || ''} ${createAddressString(prop1)}`;
    const combinedText2 = `${prop2.title} ${prop2.description || ''} ${createAddressString(prop2)}`;
    
    const combinedEmb1 = await generateEmbedding(combinedText1);
    const combinedEmb2 = await generateEmbedding(combinedText2);
    
    if (combinedEmb1.length > 0 && combinedEmb2.length > 0) {
      scores.combined_embedding = cosineSimilarity(combinedEmb1, combinedEmb2);
    }
  } catch (error) {
    console.error('Error calculating embedding scores:', error);
  }

  return scores;
}

// Generate perceptual hash for image (simplified implementation)
async function generateImageHash(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    
    const buffer = await response.arrayBuffer();
    const image = sharp(Buffer.from(buffer));
    
    // Resize to standard size for consistent hashing
    const resized = await image
      .resize(16, 16)
      .greyscale()
      .raw()
      .toBuffer();

    // Simple difference hash implementation
    let hash = '';
    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 15; j++) { // 15 to compare with next pixel
        const currentPixel = resized[i * 16 + j];
        const nextPixel = resized[i * 16 + j + 1];
        hash += currentPixel > nextPixel ? '1' : '0';
      }
    }

    return hash;
  } catch (error) {
    console.error('Failed to generate image hash for:', imageUrl, error);
    return null;
  }
}

// Calculate Hamming distance between two hashes
function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return Infinity;
  
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}

// Media/image matching layer
async function calculateMediaScores(prop1: PropertyInput, prop2: PropertyInput): Promise<number> {
  if (!prop1.mediaUrls?.length || !prop2.mediaUrls?.length) {
    return 0;
  }

  try {
    // Get existing hashes from database
    const { data: existingHashes } = await supabase
      .from('property_media_hashes')
      .select('media_url, hash_value')
      .in('property_id', [prop1.id, prop2.id]);

    const hashMap = new Map<string, string>();
    existingHashes?.forEach(h => hashMap.set(h.media_url, h.hash_value));

    // Generate missing hashes
    const hashes1: string[] = [];
    const hashes2: string[] = [];

    for (const url of prop1.mediaUrls) {
      let hash = hashMap.get(url);
      if (!hash) {
        hash = await generateImageHash(url);
        if (hash) {
          // Store hash for future use
          await supabase
            .from('property_media_hashes')
            .upsert({
              property_id: prop1.id,
              media_url: url,
              hash_value: hash
            });
        }
      }
      if (hash) hashes1.push(hash);
    }

    for (const url of prop2.mediaUrls) {
      let hash = hashMap.get(url);
      if (!hash) {
        hash = await generateImageHash(url);
        if (hash) {
          // Store hash for future use
          await supabase
            .from('property_media_hashes')
            .upsert({
              property_id: prop2.id,
              media_url: url,
              hash_value: hash
            });
        }
      }
      if (hash) hashes2.push(hash);
    }

    // Compare hashes
    let bestSimilarity = 0;
    for (const hash1 of hashes1) {
      for (const hash2 of hashes2) {
        const distance = hammingDistance(hash1, hash2);
        const similarity = 1 - (distance / (hash1.length * 4)); // Normalize by hash length
        bestSimilarity = Math.max(bestSimilarity, similarity);
      }
    }

    return bestSimilarity;
  } catch (error) {
    console.error('Error calculating media scores:', error);
    return 0;
  }
}

// Store property embedding in database
async function storePropertyEmbedding(propertyId: string, property: PropertyInput): Promise<void> {
  try {
    const combinedText = `${property.title} ${property.description || ''} ${createAddressString(property)}`;
    const embedding = await generateEmbedding(combinedText);
    
    if (embedding.length > 0) {
      await supabase
        .from('properties')
        .update({ embedding_vector: `[${embedding.join(',')}]` })
        .eq('id', propertyId);
    }
  } catch (error) {
    console.error('Failed to store property embedding:', error);
  }
}

// Check if properties are marked as false positive
async function isFalsePositive(prop1Id: string, prop2Id: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('duplicate_false_positives')
      .select('id')
      .or(`and(property_id_1.eq.${prop1Id},property_id_2.eq.${prop2Id}),and(property_id_1.eq.${prop2Id},property_id_2.eq.${prop1Id})`)
      .single();
    
    return !!data;
  } catch {
    return false;
  }
}

// Main duplicate detection function
export async function detectDuplicates(property: PropertyInput): Promise<DuplicateMatch[]> {
  try {
    // Store embedding for the input property
    await storePropertyEmbedding(property.id, property);

    // Get potential candidates from database (exclude same user properties for now)
    const { data: candidates } = await supabase
      .from('properties')
      .select(`
        id, title, description, street_name, street_number, city, zip_code,
        monthly_rent, square_meters, bedrooms, user_id, embedding_vector
      `)
      .neq('id', property.id)
      .limit(500); // Limit for performance

    if (!candidates?.length) return [];

    const matches: DuplicateMatch[] = [];

    for (const candidate of candidates) {
      // Skip if marked as false positive
      if (await isFalsePositive(property.id, candidate.id)) {
        continue;
      }

      // Get media URLs for candidate
      const { data: candidateMedia } = await supabase
        .from('property_media')
        .select('url')
        .eq('property_id', candidate.id);

      const candidateProperty: PropertyInput = {
        ...candidate,
        mediaUrls: candidateMedia?.map(m => m.url) || []
      };

      // Calculate all similarity scores
      const fuzzyScores = calculateFuzzyScores(property, candidateProperty);
      const embeddingScores = await calculateEmbeddingScores(property, candidateProperty);
      const mediaScore = await calculateMediaScores(property, candidateProperty);

      // Calculate overall fuzzy score
      const fuzzyWeights = { title: 0.4, address: 0.3, description: 0.2, rent: 0.05, size: 0.05 };
      const fuzzyScore = Object.entries(fuzzyWeights).reduce((sum, [key, weight]) => {
        return sum + (fuzzyScores[key] || 0) * weight;
      }, 0);

      // Calculate overall embedding score
      const embeddingScore = Math.max(
        embeddingScores.combined_embedding || 0,
        (embeddingScores.title_embedding || 0) * 0.6 + (embeddingScores.description_embedding || 0) * 0.4
      );

      // Calculate final confidence using weighted formula
      const confidence = 
        (WEIGHTS.fuzzy * fuzzyScore) +
        (WEIGHTS.embedding * embeddingScore) +
        (WEIGHTS.media * mediaScore);

      // Only include if confidence meets threshold
      if (confidence >= THRESHOLDS.overall) {
        const fields: Record<string, string> = {};

        // Add field-specific scores
        if (fuzzyScores.title >= THRESHOLDS.fuzzy.title) {
          fields.title = `${Math.round(fuzzyScores.title * 100)}%`;
        }
        if (fuzzyScores.address >= THRESHOLDS.fuzzy.address) {
          fields.address = `${Math.round(fuzzyScores.address * 100)}%`;
        }
        if (fuzzyScores.description && fuzzyScores.description >= THRESHOLDS.fuzzy.description) {
          fields.description = `${Math.round(fuzzyScores.description * 100)}%`;
        }
        if (fuzzyScores.rent && fuzzyScores.rent > 0.9) {
          fields.rent = fuzzyScores.rent === 1 ? 'exact' : 'similar';
        }
        if (fuzzyScores.size && fuzzyScores.size > 0.9) {
          fields.size = fuzzyScores.size === 1 ? 'exact' : 'similar';
        }
        if (mediaScore >= THRESHOLDS.media) {
          fields.media = 'match';
        }

        matches.push({
          id: candidate.id,
          confidence: Math.round(confidence * 100) / 100,
          fields
        });
      }
    }

    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);

  } catch (error) {
    console.error('Error in detectDuplicates:', error);
    return [];
  }
}

// Batch update embeddings for existing properties
export async function updatePropertyEmbeddings(limit = 100): Promise<void> {
  try {
    const { data: properties } = await supabase
      .from('properties')
      .select('id, title, description, street_name, street_number, city, zip_code')
      .is('embedding_vector', null)
      .limit(limit);

    if (!properties?.length) return;

    for (const property of properties) {
      await storePropertyEmbedding(property.id, property as PropertyInput);
    }

    console.log(`Updated embeddings for ${properties.length} properties`);
  } catch (error) {
    console.error('Error updating property embeddings:', error);
  }
}