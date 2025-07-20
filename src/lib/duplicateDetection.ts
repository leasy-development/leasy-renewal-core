import { supabase } from "@/integrations/supabase/client";

export interface DuplicateDetectionConfig {
  titleWeight: number;
  addressWeight: number;
  locationWeight: number;
  priceWeight: number;
  roomsWeight: number;
  areaWeight: number;
  sourceWeight: number;
  photoWeight: number;
  duplicateThreshold: number;
  potentialThreshold: number;
  priceTolerancePercent: number;
  areaTolerancePercent: number;
  locationToleranceMeters: number;
}

export const DEFAULT_CONFIG: DuplicateDetectionConfig = {
  titleWeight: 10,
  addressWeight: 35,
  locationWeight: 10,
  priceWeight: 10,
  roomsWeight: 10,
  areaWeight: 10,
  sourceWeight: 5,
  photoWeight: 10,
  duplicateThreshold: 85,
  potentialThreshold: 70,
  priceTolerancePercent: 5,
  areaTolerancePercent: 5,
  locationToleranceMeters: 50
};

export interface PropertyForDetection {
  title: string;
  street_name?: string;
  street_number?: string;
  zip_code?: string;
  city?: string;
  monthly_rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_meters?: number;
  source?: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
}

export interface ExistingProperty extends PropertyForDetection {
  id: string;
  created_at: string;
}

export interface DuplicateMatch {
  existingProperty: ExistingProperty;
  matchScore: number;
  matchReasons: MatchReason[];
  status: 'duplicate' | 'potential' | 'unique';
  aiSuggestion?: string;
}

export interface MatchReason {
  parameter: string;
  score: number;
  weight: number;
  details: string;
}

export class DuplicateDetectionService {
  private config: DuplicateDetectionConfig;

  constructor(config: DuplicateDetectionConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  async detectDuplicates(
    newProperty: PropertyForDetection,
    userId: string
  ): Promise<DuplicateMatch[]> {
    // Fetch existing properties for the user
    const { data: existingProperties, error } = await supabase
      .from('properties')
      .select(`
        id,
        title,
        street_name,
        street_number,
        zip_code,
        city,
        monthly_rent,
        bedrooms,
        bathrooms,
        square_meters,
        created_at,
        property_media(url, media_type)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching existing properties:', error);
      return [];
    }

    const matches: DuplicateMatch[] = [];

    for (const existing of existingProperties || []) {
      const existingFormatted: ExistingProperty = {
        id: existing.id,
        title: existing.title || '',
        street_name: existing.street_name || '',
        street_number: existing.street_number || '',
        zip_code: existing.zip_code || '',
        city: existing.city || '',
        monthly_rent: existing.monthly_rent || 0,
        bedrooms: existing.bedrooms || 0,
        bathrooms: existing.bathrooms || 0,
        square_meters: existing.square_meters || 0,
        created_at: existing.created_at,
        photos: existing.property_media
          ?.filter((m: any) => m.media_type === 'photo')
          .map((m: any) => m.url) || []
      };

      const match = this.calculateMatch(newProperty, existingFormatted);
      if (match.matchScore >= this.config.potentialThreshold) {
        matches.push(match);
      }
    }

    // Sort by match score (highest first)
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  private calculateMatch(
    newProperty: PropertyForDetection,
    existing: ExistingProperty
  ): DuplicateMatch {
    const reasons: MatchReason[] = [];
    let totalScore = 0;

    // Title similarity
    const titleScore = this.calculateTitleSimilarity(newProperty.title, existing.title);
    reasons.push({
      parameter: 'Title',
      score: titleScore,
      weight: this.config.titleWeight,
      details: `"${newProperty.title}" vs "${existing.title}"`
    });
    totalScore += titleScore * (this.config.titleWeight / 100);

    // Address match
    const addressScore = this.calculateAddressMatch(newProperty, existing);
    reasons.push({
      parameter: 'Address',
      score: addressScore,
      weight: this.config.addressWeight,
      details: this.formatAddress(newProperty) + ' vs ' + this.formatAddress(existing)
    });
    totalScore += addressScore * (this.config.addressWeight / 100);

    // Price match
    const priceScore = this.calculatePriceMatch(newProperty.monthly_rent, existing.monthly_rent);
    reasons.push({
      parameter: 'Monthly Rent',
      score: priceScore,
      weight: this.config.priceWeight,
      details: `€${newProperty.monthly_rent || 0} vs €${existing.monthly_rent || 0}`
    });
    totalScore += priceScore * (this.config.priceWeight / 100);

    // Rooms match
    const roomsScore = this.calculateRoomsMatch(newProperty, existing);
    reasons.push({
      parameter: 'Bedrooms',
      score: roomsScore,
      weight: this.config.roomsWeight,
      details: `${newProperty.bedrooms || 0} vs ${existing.bedrooms || 0} bedrooms`
    });
    totalScore += roomsScore * (this.config.roomsWeight / 100);

    // Area match
    const areaScore = this.calculateAreaMatch(newProperty.square_meters, existing.square_meters);
    reasons.push({
      parameter: 'Area',
      score: areaScore,
      weight: this.config.areaWeight,
      details: `${newProperty.square_meters || 0}m² vs ${existing.square_meters || 0}m²`
    });
    totalScore += areaScore * (this.config.areaWeight / 100);

    // Location proximity (if coordinates available)
    if (newProperty.latitude && newProperty.longitude && existing.latitude && existing.longitude) {
      const locationScore = this.calculateLocationProximity(
        newProperty.latitude,
        newProperty.longitude,
        existing.latitude,
        existing.longitude
      );
      reasons.push({
        parameter: 'Location',
        score: locationScore,
        weight: this.config.locationWeight,
        details: "GPS coordinates proximity"
      });
      totalScore += locationScore * (this.config.locationWeight / 100);
    }

    // Determine status
    let status: 'duplicate' | 'potential' | 'unique';
    if (totalScore >= this.config.duplicateThreshold) {
      status = 'duplicate';
    } else if (totalScore >= this.config.potentialThreshold) {
      status = 'potential';
    } else {
      status = 'unique';
    }

    // Generate AI suggestion
    const aiSuggestion = this.generateAISuggestion(totalScore, reasons, status);

    return {
      existingProperty: existing,
      matchScore: Math.round(totalScore),
      matchReasons: reasons,
      status,
      aiSuggestion
    };
  }

  private calculateTitleSimilarity(title1: string, title2: string): number {
    if (!title1 || !title2) return 0;
    
    const normalized1 = title1.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const normalized2 = title2.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    if (normalized1 === normalized2) return 100;
    
    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;
    
    return Math.max(0, similarity);
  }

  private calculateAddressMatch(prop1: PropertyForDetection, prop2: PropertyForDetection): number {
    // Exact match on street + zip + city
    const address1 = this.normalizeAddress(prop1);
    const address2 = this.normalizeAddress(prop2);
    
    if (address1 === address2 && address1 !== '') return 100;
    
    // Partial matches
    let score = 0;
    if (prop1.zip_code && prop2.zip_code && prop1.zip_code === prop2.zip_code) score += 40;
    if (prop1.city && prop2.city && prop1.city.toLowerCase() === prop2.city.toLowerCase()) score += 30;
    if (prop1.street_name && prop2.street_name && 
        prop1.street_name.toLowerCase() === prop2.street_name.toLowerCase()) score += 30;
    
    return Math.min(score, 100);
  }

  private calculatePriceMatch(price1?: number, price2?: number): number {
    if (!price1 || !price2) return 0;
    
    const tolerance = (this.config.priceTolerancePercent / 100) * Math.max(price1, price2);
    const difference = Math.abs(price1 - price2);
    
    if (difference <= tolerance) return 100;
    
    // Gradual scoring based on difference
    const maxDifference = Math.max(price1, price2) * 0.5; // 50% difference = 0 score
    const score = Math.max(0, 100 - (difference / maxDifference) * 100);
    
    return score;
  }

  private calculateRoomsMatch(prop1: PropertyForDetection, prop2: PropertyForDetection): number {
    if (prop1.bedrooms === prop2.bedrooms) return 100;
    if (!prop1.bedrooms || !prop2.bedrooms) return 0;
    
    const difference = Math.abs(prop1.bedrooms - prop2.bedrooms);
    return Math.max(0, 100 - (difference * 25)); // Each room difference = -25 points
  }

  private calculateAreaMatch(area1?: number, area2?: number): number {
    if (!area1 || !area2) return 0;
    
    const tolerance = (this.config.areaTolerancePercent / 100) * Math.max(area1, area2);
    const difference = Math.abs(area1 - area2);
    
    if (difference <= tolerance) return 100;
    
    // Gradual scoring
    const maxDifference = Math.max(area1, area2) * 0.5;
    const score = Math.max(0, 100 - (difference / maxDifference) * 100);
    
    return score;
  }

  private calculateLocationProximity(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    
    if (distance <= this.config.locationToleranceMeters) return 100;
    
    // Gradual scoring - 1km = 0 points
    const maxDistance = 1000;
    const score = Math.max(0, 100 - (distance / maxDistance) * 100);
    
    return score;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private normalizeAddress(property: PropertyForDetection): string {
    const parts = [
      property.street_name,
      property.street_number,
      property.zip_code,
      property.city
    ].filter(Boolean).map(part => part?.toLowerCase().trim());
    
    return parts.join(' ');
  }

  private formatAddress(property: PropertyForDetection): string {
    const parts = [
      property.street_name,
      property.street_number,
      property.zip_code,
      property.city
    ].filter(Boolean);
    
    return parts.join(', ') || 'Address not specified';
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private generateAISuggestion(score: number, reasons: MatchReason[], status: string): string {
    const topReasons = reasons
      .filter(r => r.score > 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    if (status === 'duplicate') {
      return `🚫 High confidence duplicate (${score}% match). ${topReasons.map(r => r.parameter).join(' and ')} are very similar. Strongly recommend skipping this import.`;
    } else if (status === 'potential') {
      return `⚠️ Potential duplicate detected (${score}% match). ${topReasons.map(r => r.parameter).join(' and ')} show similarities. Review carefully before importing.`;
    }
    
    return `✅ Appears to be a unique listing (${score}% match). Safe to import.`;
  }

  updateConfig(newConfig: Partial<DuplicateDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): DuplicateDetectionConfig {
    return { ...this.config };
  }
}

export const duplicateDetectionService = new DuplicateDetectionService();