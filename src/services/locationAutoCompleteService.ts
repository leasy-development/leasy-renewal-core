import { supabase } from '@/integrations/supabase/client';

// Auto-completion service for German cities and postcodes
export interface PostcodeData {
  postcode: string;
  city: string;
  district?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

export interface CityAutoCompleteResult {
  city: string;
  postcode: string;
  district?: string;
  state?: string;
  confidence: number;
}

class LocationAutoCompleteService {
  private static postcodeCache = new Map<string, PostcodeData[]>();
  private static cityCache = new Map<string, PostcodeData[]>();

  /**
   * Auto-complete city based on postcode
   */
  async getCityByPostcode(postcode: string): Promise<CityAutoCompleteResult[]> {
    if (!postcode || postcode.length < 3) return [];

    // Check cache first
    const cacheKey = postcode.replace(/\s/g, '');
    if (LocationAutoCompleteService.postcodeCache.has(cacheKey)) {
      const cached = LocationAutoCompleteService.postcodeCache.get(cacheKey) || [];
      return this.formatCityResults(cached);
    }

    try {
      // Temporary fallback until DB migration is executed
      // For now, return German city suggestions without database lookup
      return this.getFallbackCityByPostcode(postcode);
      
      /* TODO: Uncomment after migration execution
      const { data, error } = await supabase
        .from('german_postcodes')
        .select('*')
        .ilike('postcode', `${cacheKey}%`)
        .order('city')
        .limit(10);

      if (error) throw error;

      // Cache results
      LocationAutoCompleteService.postcodeCache.set(cacheKey, data || []);
      
      return this.formatCityResults(data || []);
      */
    } catch (error) {
      console.error('Error getting city by postcode:', error);
      
      // Fallback: Try to extract city from known German postcodes pattern
      return this.getFallbackCityByPostcode(postcode);
    }
  }

  /**
   * Auto-complete postcode based on city
   */
  async getPostcodeByCity(city: string): Promise<CityAutoCompleteResult[]> {
    if (!city || city.length < 2) return [];

    const normalizedCity = city.toLowerCase().trim();
    
    // Check cache first
    if (LocationAutoCompleteService.cityCache.has(normalizedCity)) {
      const cached = LocationAutoCompleteService.cityCache.get(normalizedCity) || [];
      return this.formatCityResults(cached);
    }

    try {
      // Temporary fallback until DB migration is executed
      return [];
      
      /* TODO: Uncomment after migration execution
      const { data, error } = await supabase
        .from('german_postcodes')
        .select('*')
        .ilike('city', `%${city}%`)
        .order('postcode')
        .limit(15);

      if (error) throw error;

      // Cache results
      LocationAutoCompleteService.cityCache.set(normalizedCity, data || []);
      
      return this.formatCityResults(data || []);
      */
    } catch (error) {
      console.error('Error getting postcode by city:', error);
      return [];
    }
  }

  /**
   * Auto-complete both city and postcode with fuzzy matching
   */
  async searchLocation(query: string): Promise<CityAutoCompleteResult[]> {
    if (!query || query.length < 2) return [];

    const trimmedQuery = query.trim();
    
    // If query looks like a postcode (starts with digits)
    if (/^\d/.test(trimmedQuery)) {
      return this.getCityByPostcode(trimmedQuery);
    }
    
    // If query looks like a city name
    return this.getPostcodeByCity(trimmedQuery);
  }

  /**
   * Get district information for a city
   */
  async getDistrictsByCity(city: string): Promise<string[]> {
    if (!city) return [];

    try {
      // Temporary fallback until DB migration is executed
      return [];
      
      /* TODO: Uncomment after migration execution
      const { data, error } = await supabase
        .from('german_postcodes')
        .select('district')
        .ilike('city', city)
        .not('district', 'is', null)
        .order('district');

      if (error) throw error;

      // Remove duplicates and filter out nulls
      const districts = [...new Set(
        (data || [])
          .map(item => item.district)
          .filter(district => district && district.trim() !== '')
      )];

      return districts;
      */
    } catch (error) {
      console.error('Error getting districts by city:', error);
      return [];
    }
  }

  /**
   * Validate German postcode format
   */
  isValidGermanPostcode(postcode: string): boolean {
    if (!postcode) return false;
    
    const cleaned = postcode.replace(/\s/g, '');
    return /^\d{5}$/.test(cleaned);
  }

  /**
   * Smart auto-fill for property addresses
   */
  async autoFillPropertyAddress(
    postcode?: string, 
    city?: string
  ): Promise<{ 
    suggestedCity?: string; 
    suggestedPostcode?: string; 
    suggestedDistrict?: string;
    confidence: number;
  }> {
    let result: { 
      suggestedCity?: string; 
      suggestedPostcode?: string; 
      suggestedDistrict?: string;
      confidence: number;
    } = { confidence: 0 };

    try {
      // If postcode is provided but city is missing
      if (postcode && !city) {
        const cityResults = await this.getCityByPostcode(postcode);
        if (cityResults.length > 0) {
          const bestMatch = cityResults[0];
          result.suggestedCity = bestMatch.city;
          result.suggestedDistrict = bestMatch.district;
          result.confidence = bestMatch.confidence;
        }
      }
      
      // If city is provided but postcode is missing
      else if (city && !postcode) {
        const postcodeResults = await this.getPostcodeByCity(city);
        if (postcodeResults.length > 0) {
          const bestMatch = postcodeResults[0];
          result.suggestedPostcode = bestMatch.postcode;
          result.suggestedDistrict = bestMatch.district;
          result.confidence = bestMatch.confidence;
        }
      }
      
      // If both are provided, validate they match
      else if (postcode && city) {
        const validation = await this.validateCityPostcodeMatch(city, postcode);
        if (!validation.isValid && validation.suggestions.length > 0) {
          const suggestion = validation.suggestions[0];
          result.suggestedCity = suggestion.city;
          result.suggestedPostcode = suggestion.postcode;
          result.suggestedDistrict = suggestion.district;
          result.confidence = 0.8; // Lower confidence for corrections
        } else if (validation.isValid) {
          // Get district for valid combination
          const districts = await this.getDistrictsByCity(city);
          if (districts.length > 0) {
            result.suggestedDistrict = districts[0];
            result.confidence = 1.0;
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error in auto-fill property address:', error);
      return { confidence: 0 };
    }
  }

  /**
   * Validate if city and postcode match
   */
  async validateCityPostcodeMatch(
    city: string, 
    postcode: string
  ): Promise<{ 
    isValid: boolean; 
    suggestions: CityAutoCompleteResult[];
  }> {
    try {
      // Temporary fallback until DB migration is executed
      // Basic validation based on German postcode patterns
      const isValidFormat = this.isValidGermanPostcode(postcode);
      
      if (!isValidFormat) {
        return { isValid: false, suggestions: [] };
      }

      // Use fallback city suggestion
      const fallbackSuggestions = this.getFallbackCityByPostcode(postcode);
      const cityMatch = fallbackSuggestions.some(s => 
        s.city.toLowerCase().includes(city.toLowerCase()) ||
        city.toLowerCase().includes(s.city.toLowerCase())
      );

      return { 
        isValid: cityMatch, 
        suggestions: cityMatch ? [] : fallbackSuggestions 
      };
      
      /* TODO: Uncomment after migration execution
      const { data, error } = await supabase
        .from('german_postcodes')
        .select('*')
        .eq('postcode', postcode.replace(/\s/g, ''))
        .ilike('city', city);

      if (error) throw error;

      const isValid = (data || []).length > 0;
      
      if (!isValid) {
        // Get suggestions for the postcode
        const suggestions = await this.getCityByPostcode(postcode);
        return { isValid: false, suggestions };
      }

      return { isValid: true, suggestions: [] };
      */
    } catch (error) {
      console.error('Error validating city-postcode match:', error);
      return { isValid: false, suggestions: [] };
    }
  }

  /**
   * Import/seed German postcode data (Admin function)
   */
  async importPostcodeData(postcodeData: PostcodeData[]): Promise<{ 
    imported: number; 
    errors: number; 
  }> {
    try {
      // This will be enabled after migration execution
      console.log('Postcode import will be available after database migration');
      return { imported: 0, errors: 0 };
      
      /* TODO: Uncomment after migration execution
      const chunks = this.chunkArray(postcodeData, 1000);
      let imported = 0;
      let errors = 0;

      for (const chunk of chunks) {
        try {
          const { error } = await supabase
            .from('german_postcodes')
            .upsert(chunk, { 
              onConflict: 'postcode,city',
              ignoreDuplicates: true 
            });

          if (error) throw error;
          imported += chunk.length;
        } catch (error) {
          console.error('Error importing chunk:', error);
          errors += chunk.length;
        }
      }

      return { imported, errors };
      */
    } catch (error) {
      console.error('Error importing postcode data:', error);
      return { imported: 0, errors: postcodeData.length };
    }
  }

  // Private helper methods
  private formatCityResults(data: PostcodeData[]): CityAutoCompleteResult[] {
    return data.map(item => ({
      city: item.city,
      postcode: item.postcode,
      district: item.district || undefined,
      state: item.state || undefined,
      confidence: 1.0
    }));
  }

  private getFallbackCityByPostcode(postcode: string): CityAutoCompleteResult[] {
    // Basic fallback for major German cities based on postcode ranges
    const postcodeRanges: { [key: string]: string } = {
      '1': 'Berlin',
      '2': 'Hamburg',
      '3': 'Hannover',
      '4': 'Düsseldorf',
      '5': 'Köln',
      '6': 'Frankfurt am Main',
      '7': 'Stuttgart',
      '8': 'München',
      '9': 'Nürnberg'
    };

    const firstDigit = postcode.charAt(0);
    const city = postcodeRanges[firstDigit];
    
    if (city) {
      return [{
        city,
        postcode: postcode,
        confidence: 0.5 // Lower confidence for fallback
      }];
    }

    return [];
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

export const locationAutoCompleteService = new LocationAutoCompleteService();