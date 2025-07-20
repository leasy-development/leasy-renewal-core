// Service for auto-inferring missing property data
import { supabase } from '@/integrations/supabase/client';

export interface PropertyData {
  title?: string;
  description?: string;
  apartment_type?: string;
  category?: string;
  street_name?: string;
  street_number?: string;
  city?: string;
  city_district?: string;
  zip_code?: string;
  region?: string;
  country?: string;
  monthly_rent?: number;
  weekly_rate?: number;
  daily_rate?: number;
  bedrooms?: number;
  bathrooms?: number;
  total_rooms?: number;
  max_guests?: number;
  square_meters?: number;
  checkin_time?: string;
  checkout_time?: string;
  provides_wgsb?: boolean;
  house_rules?: string;
  image_urls?: string;
  floorplan_urls?: string;
}

// Standardized categories for validation
export const STANDARD_CATEGORIES = [
  'Furnished apartment',
  'Furnished house', 
  'Serviced apartment',
  'Apartment for rent',
  'House for rent',
  'Apartment for sale',
  'House for sale'
] as const;

export type StandardCategory = typeof STANDARD_CATEGORIES[number];

/**
 * Auto-infer missing city from ZIP code using our city database
 */
export async function inferCityFromZipCode(zipCode: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('city_districts')
      .select('city')
      .eq('zip_code', zipCode)
      .limit(1)
      .single();

    if (error) {
      console.warn('Could not infer city from ZIP code:', zipCode, error);
      return null;
    }

    return data?.city || null;
  } catch (error) {
    console.warn('Error inferring city from ZIP code:', error);
    return null;
  }
}

/**
 * Auto-infer missing city district from city and ZIP code
 */
export async function inferCityDistrictFromLocation(city: string, zipCode: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('city_districts')
      .select('district')
      .eq('city', city)
      .eq('zip_code', zipCode)
      .limit(1)
      .single();

    if (error) {
      console.warn('Could not infer city district:', { city, zipCode }, error);
      return null;
    }

    return data?.district || null;
  } catch (error) {
    console.warn('Error inferring city district:', error);
    return null;
  }
}

/**
 * Validate and normalize category to standardized values
 */
export function validateAndNormalizeCategory(category: string | undefined): StandardCategory | undefined {
  if (!category) return undefined;

  const normalizedInput = category.toLowerCase().trim();

  // Direct match
  for (const standardCategory of STANDARD_CATEGORIES) {
    if (standardCategory.toLowerCase() === normalizedInput) {
      return standardCategory;
    }
  }

  // Fuzzy matching for common variations
  const categoryMappings: Record<string, StandardCategory> = {
    'furnished apt': 'Furnished apartment',
    'furnished flat': 'Furnished apartment',
    'möblierte wohnung': 'Furnished apartment',
    'furnished home': 'Furnished house',
    'möbliertes haus': 'Furnished house',
    'serviced apt': 'Serviced apartment',
    'serviced flat': 'Serviced apartment',
    'rental apartment': 'Apartment for rent',
    'rental flat': 'Apartment for rent',
    'mietwohnung': 'Apartment for rent',
    'rental house': 'House for rent',
    'rental home': 'House for rent',
    'miethaus': 'House for rent',
    'for sale apartment': 'Apartment for sale',
    'for sale flat': 'Apartment for sale',
    'kaufwohnung': 'Apartment for sale',
    'for sale house': 'House for sale',
    'for sale home': 'House for sale',
    'kaufhaus': 'House for sale'
  };

  return categoryMappings[normalizedInput] || undefined;
}

/**
 * Auto-infer and enhance property data with missing information
 */
export async function autoInferPropertyData(data: PropertyData): Promise<PropertyData> {
  const enhanced = { ...data };

  try {
    // Auto-infer city from ZIP code if missing
    if (!enhanced.city && enhanced.zip_code) {
      const inferredCity = await inferCityFromZipCode(enhanced.zip_code);
      if (inferredCity) {
        enhanced.city = inferredCity;
        console.log(`Auto-inferred city: ${inferredCity} from ZIP: ${enhanced.zip_code}`);
      }
    }

    // Auto-infer city district if missing but we have city and ZIP
    if (!enhanced.city_district && enhanced.city && enhanced.zip_code) {
      const inferredDistrict = await inferCityDistrictFromLocation(enhanced.city, enhanced.zip_code);
      if (inferredDistrict) {
        enhanced.city_district = inferredDistrict;
        console.log(`Auto-inferred district: ${inferredDistrict} for ${enhanced.city}, ${enhanced.zip_code}`);
      }
    }

    // Validate and normalize category
    if (enhanced.category) {
      const normalizedCategory = validateAndNormalizeCategory(enhanced.category);
      if (normalizedCategory) {
        enhanced.category = normalizedCategory;
      } else {
        console.warn(`Category "${enhanced.category}" is not in standardized list. Available: ${STANDARD_CATEGORIES.join(', ')}`);
      }
    }

    // Set default country if missing
    if (!enhanced.country) {
      enhanced.country = 'Germany';
    }

  } catch (error) {
    console.error('Error during auto-inference:', error);
  }

  return enhanced;
}

/**
 * Process multiple property records with auto-inference
 */
export async function autoInferPropertyDataBatch(properties: PropertyData[]): Promise<PropertyData[]> {
  const results: PropertyData[] = [];
  
  for (const property of properties) {
    const enhanced = await autoInferPropertyData(property);
    results.push(enhanced);
  }

  return results;
}

/**
 * Get available cities for a ZIP code
 */
export async function getCitiesForZipCode(zipCode: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('city_districts')
      .select('city')
      .eq('zip_code', zipCode);

    if (error) {
      console.warn('Could not get cities for ZIP code:', zipCode, error);
      return [];
    }

    // Return unique cities
    const uniqueCities = [...new Set(data?.map(row => row.city) || [])];
    return uniqueCities;
  } catch (error) {
    console.warn('Error getting cities for ZIP code:', error);
    return [];
  }
}

/**
 * Get available districts for a city and ZIP code combination
 */
export async function getDistrictsForLocation(city: string, zipCode?: string): Promise<string[]> {
  try {
    let query = supabase
      .from('city_districts')
      .select('district')
      .eq('city', city);

    if (zipCode) {
      query = query.eq('zip_code', zipCode);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Could not get districts for location:', { city, zipCode }, error);
      return [];
    }

    // Return unique districts
    const uniqueDistricts = [...new Set(data?.map(row => row.district) || [])];
    return uniqueDistricts;
  } catch (error) {
    console.warn('Error getting districts for location:', error);
    return [];
  }
}