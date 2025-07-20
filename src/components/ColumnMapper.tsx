import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Wand2, RotateCcw, Database, Loader, Lightbulb, AlertTriangle } from 'lucide-react';
import * as fuzzball from 'fuzzball';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MappingTrainingLog, ColumnMapping, MappingSuggestion } from '@/types/mapping';

// Standard field mappings for property data
const STANDARD_FIELDS = [
  { key: 'title', label: 'Property Title', required: true, isLeasyField: true },
  { key: 'description', label: 'Description', required: false, isLeasyField: true },
  { key: 'apartment_type', label: 'Apartment Type', required: false, isLeasyField: true }, // Made optional - can auto-categorize
  { key: 'category', label: 'Category', required: false, isLeasyField: true }, // Made optional - can auto-categorize
  { key: 'street_name', label: 'Street Name', required: true, isLeasyField: true },
  { key: 'street_number', label: 'Street Number', required: false, isLeasyField: true },
  { key: 'city', label: 'City', required: false, isLeasyField: true }, // Made optional - can be inferred from ZIP
  { key: 'city_district', label: 'City District', required: false, isLeasyField: true }, // Renamed from address_city_part
  { key: 'zip_code', label: 'ZIP Code', required: false, isLeasyField: true },
  { key: 'region', label: 'Region/State', required: false, isLeasyField: true },
  { key: 'country', label: 'Country', required: false, isLeasyField: true },
  { key: 'monthly_rent', label: 'Monthly Rent', required: false, isLeasyField: true },
  { key: 'weekly_rate', label: 'Weekly Rate', required: false, isLeasyField: true },
  { key: 'daily_rate', label: 'Daily Rate', required: false, isLeasyField: true },
  { key: 'bedrooms', label: 'Bedrooms', required: false, isLeasyField: true },
  { key: 'bathrooms', label: 'Bathrooms', required: false, isLeasyField: true },
  { key: 'total_rooms', label: 'Total Rooms', required: false, isLeasyField: true }, // New field
  { key: 'max_guests', label: 'Max Guests', required: false, isLeasyField: true },
  { key: 'square_meters', label: 'Square Meters', required: false, isLeasyField: true },
  { key: 'checkin_time', label: 'Check-in Time', required: false, isLeasyField: true },
  { key: 'checkout_time', label: 'Check-out Time', required: false, isLeasyField: true },
  { key: 'provides_wgsb', label: 'Provides WGSB', required: false, isLeasyField: true },
  { key: 'house_rules', label: 'House Rules', required: false, isLeasyField: true },
  { key: 'image_urls', label: 'Image URLs', required: false, isLeasyField: true },
  { key: 'floorplan_urls', label: 'Floorplan URLs', required: false, isLeasyField: true }
];

// Standardized category values
export const STANDARD_CATEGORIES = [
  'Furnished apartment',
  'Furnished house', 
  'Serviced apartment',
  'Apartment for rent',
  'House for rent',
  'Apartment for sale',
  'House for sale'
] as const;

// Common header variations for automatic detection
const HEADER_PATTERNS: Record<string, string[]> = {
  title: ['title', 'property_title', 'name', 'property_name', 'listing_title'],
  description: ['description', 'desc', 'details', 'property_description'],
  apartment_type: ['apartment_type', 'type', 'property_type', 'unit_type'],
  category: ['category', 'rental_type', 'listing_category'],
  street_name: ['street_name', 'street', 'address', 'street_address'],
  street_number: ['street_number', 'house_number', 'number'],
  city: ['city', 'location', 'town'],
  city_district: ['city_district', 'district', 'neighborhood', 'quarter', 'bezirk', 'stadtteil'], // Added city_district patterns
  zip_code: ['zip_code', 'postal_code', 'zipcode', 'zip', 'postcode'],
  region: ['region', 'state', 'province'],
  country: ['country', 'nation'],
  monthly_rent: ['monthly_rent', 'rent', 'price', 'monthly_price'],
  weekly_rate: ['weekly_rate', 'weekly_rent', 'weekly_price'],
  daily_rate: ['daily_rate', 'daily_rent', 'daily_price', 'nightly_rate'],
  bedrooms: ['bedrooms', 'beds', 'bedroom_count'],
  bathrooms: ['bathrooms', 'baths', 'bathroom_count'],
  total_rooms: ['total_rooms', 'rooms', 'room_count', 'anzahl_zimmer'], // Added total_rooms patterns
  max_guests: ['max_guests', 'capacity', 'guests', 'occupancy'],
  square_meters: ['square_meters', 'area', 'size', 'sqm', 'square_feet'],
  checkin_time: ['checkin_time', 'check_in', 'checkin', 'arrival_time'],
  checkout_time: ['checkout_time', 'check_out', 'checkout', 'departure_time'],
  provides_wgsb: ['provides_wgsb', 'wgsb', 'housing_benefit'],
  house_rules: ['house_rules', 'rules', 'policies'],
  image_urls: ['image_urls', 'images', 'photos', 'photo_urls', 'pictures'],
  floorplan_urls: ['floorplan_urls', 'floorplan', 'layout', 'plan']
};

// Interface moved to types/mapping.ts

interface ColumnMapperProps {
  csvHeaders: string[];
  onMappingComplete: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

export function ColumnMapper({ csvHeaders, onMappingComplete, onCancel }: ColumnMapperProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [autoMapped, setAutoMapped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved mappings from database for the current user
  const loadUserMappings = async (): Promise<Record<string, MappingSuggestion>> => {
    try {
      const { data, error } = await supabase
        .from('mapping_training_log')
        .select('source_field, target_field, match_confidence, mapping_type')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to load user mappings:', error);
        return {};
      }

      const mappingDict: Record<string, MappingSuggestion> = {};
      data?.forEach(row => {
        const normalizedSource = row.source_field.toLowerCase().replace(/[^a-z0-9]/g, '_');
        mappingDict[normalizedSource] = {
          field: row.target_field,
          confidence: row.match_confidence / 100, // Convert to decimal
          isSuggestion: true,
          mappingType: row.mapping_type as any
        };
      });

      return mappingDict;
    } catch (error) {
      console.warn('Error loading user mappings:', error);
      return {};
    }
  };

  // Save mapping to database for future learning
  const saveMappingToDatabase = async (documentField: string, mappedField: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Check if mapping already exists
      const { data: existing, error: checkError } = await supabase
        .from('mapping_training_log')
        .select('id, match_confidence')
        .eq('source_field', documentField)
        .eq('target_field', mappedField)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        // Update existing mapping confidence
        await supabase
          .from('mapping_training_log')
          .update({ 
            match_confidence: Math.min(existing.match_confidence + 10, 100) // Increment by 10%
          })
          .eq('id', existing.id);
      } else {
        // Create new mapping
        await supabase
          .from('mapping_training_log')
          .insert({
            user_id: user.id,
            source_field: documentField,
            target_field: mappedField,
            match_confidence: 100,
            mapping_type: 'manual'
          });
      }
    } catch (error) {
      console.warn('Failed to save mapping to database:', error);
    }
  };

  // Auto-detect mappings using database learning + patterns
  const autoDetectMappings = async (headers: string[]): Promise<ColumnMapping[]> => {
    setIsLoading(true);
    
    try {
      const userMappings = await loadUserMappings();
      
      return headers.map(header => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        // Check user's learned mappings first (highest priority)
        if (userMappings[normalizedHeader]) {
          return {
            csvHeader: header,
            mappedField: userMappings[normalizedHeader].field,
            confidence: userMappings[normalizedHeader].confidence,
            isAutoMapped: true,
            isSuggestion: userMappings[normalizedHeader].isSuggestion
          };
        }

        // Check localStorage as fallback
        const localStorageKey = csvHeaders.slice(0, 5).join(',');
        const savedMappings = localStorage.getItem(`csv_mapping_${localStorageKey}`);
        if (savedMappings) {
          const parsed = JSON.parse(savedMappings);
          if (parsed[header]) {
            return {
              csvHeader: header,
              mappedField: parsed[header],
              confidence: 0.9,
              isAutoMapped: true
            };
          }
        }

        // Find best match using fuzzy string matching against patterns
        let bestMatch = '';
        let bestScore = 0;

        Object.entries(HEADER_PATTERNS).forEach(([fieldKey, patterns]) => {
          patterns.forEach(pattern => {
            const score = fuzzball.ratio(normalizedHeader, pattern) / 100;
            if (score > bestScore && score > 0.7) { // 70% similarity threshold
              bestMatch = fieldKey;
              bestScore = score;
            }
          });
        });

        return {
          csvHeader: header,
          mappedField: bestMatch || null,
          confidence: bestScore,
          isAutoMapped: bestScore > 0
        };
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-detect mappings on component mount
  useEffect(() => {
    autoDetectMappings(csvHeaders).then(detectedMappings => {
      setMappings(detectedMappings);
      setAutoMapped(true);
    });
  }, [csvHeaders]);

  const handleMappingChange = (csvHeader: string, mappedField: string | null) => {
    setMappings(prev => prev.map(mapping => 
      mapping.csvHeader === csvHeader 
        ? { ...mapping, mappedField, confidence: mappedField ? 1.0 : 0, isAutoMapped: false }
        : mapping
    ));
  };

  const handleAutoMap = async () => {
    const autoDetectedMappings = await autoDetectMappings(csvHeaders);
    setMappings(autoDetectedMappings);
    setAutoMapped(true);
  };

  const handleReset = () => {
    setMappings(csvHeaders.map(header => ({
      csvHeader: header,
      mappedField: null,
      confidence: 0,
      isAutoMapped: false
    })));
    setAutoMapped(false);
  };

  const handleComplete = async () => {
    const finalMapping: Record<string, string> = {};
    const userMappings: Array<{ docField: string; mappedField: string }> = [];

    mappings.forEach(mapping => {
      if (mapping.mappedField) {
        finalMapping[mapping.csvHeader] = mapping.mappedField;
        
        // Track manual mappings for learning
        if (!mapping.isAutoMapped) {
          userMappings.push({
            docField: mapping.csvHeader,
            mappedField: mapping.mappedField
          });
        }
      }
    });

    // Save manual mappings to database for learning
    for (const userMapping of userMappings) {
      await saveMappingToDatabase(userMapping.docField, userMapping.mappedField);
    }

    // Save to localStorage as backup
    const mappingKey = csvHeaders.slice(0, 5).join(',');
    localStorage.setItem(`csv_mapping_${mappingKey}`, JSON.stringify(finalMapping));

    // Show success message for learning
    if (userMappings.length > 0) {
      toast({
        title: "Mapping Learned",
        description: `Saved ${userMappings.length} manual mapping(s) for future use.`,
      });
    }

    onMappingComplete(finalMapping);
  };

  // Helper functions for dropdown state
  const isFieldAlreadyMapped = (fieldKey: string, currentMapping: ColumnMapping) => {
    return mappings.some(m => m.mappedField === fieldKey && m.csvHeader !== currentMapping.csvHeader);
  };

  const getAvailableFields = (currentMapping: ColumnMapping) => {
    return STANDARD_FIELDS.filter(field => 
      !isFieldAlreadyMapped(field.key, currentMapping)
    );
  };

  // Validation
  const requiredFields = STANDARD_FIELDS.filter(f => f.required);
  const mappedRequiredFields = requiredFields.filter(field => 
    mappings.some(m => m.mappedField === field.key)
  );
  const missingRequiredFields = requiredFields.filter(field => 
    !mappings.some(m => m.mappedField === field.key)
  );

  const canProceed = missingRequiredFields.length === 0;
  const mappedCount = mappings.filter(m => m.mappedField).length;

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader className="h-4 w-4 animate-spin" />
            <span>Loading intelligent mappings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Smart Column Mapping
        </CardTitle>
        <CardDescription>
          Map your CSV columns to Leasy database fields. The system learns from your mappings to improve future suggestions.
          Required fields are marked with *.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              {mappedCount}/{csvHeaders.length} columns mapped
            </Badge>
            {autoMapped && (
              <Badge variant="secondary">
                AI-detected with {Math.round(mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length * 100)}% confidence
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAutoMap}>
              <Wand2 className="h-3 w-3 mr-1" />
              Smart Auto-Map
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        {/* Missing Required Fields Alert */}
        {missingRequiredFields.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Missing required fields: {missingRequiredFields.map(f => f.label).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* Optional Fields Warning - Non-blocking */}
        {!mappings.some(m => m.mappedField === 'category') && !mappings.some(m => m.mappedField === 'apartment_type') && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Optional:</strong> No category or apartment type mapping detected. 
              The system will attempt auto-categorization during import using AI analysis.
            </AlertDescription>
          </Alert>
        )}

        {/* Mapping Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {mappings.map((mapping, index) => {
            const availableFields = getAvailableFields(mapping);
            const isCurrentlyMapped = mapping.mappedField !== null;
            
            return (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-sm font-medium">{mapping.csvHeader}</Label>
                  {mapping.confidence > 0 && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      {mapping.isSuggestion && <Lightbulb className="h-3 w-3 text-amber-500" />}
                      {Math.round(mapping.confidence * 100)}% match
                      {mapping.isSuggestion && ' (💡 Suggested from past)'}
                      {mapping.isAutoMapped && !mapping.isSuggestion && ' (auto)'}
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <Select
                    value={mapping.mappedField || 'unmapped'}
                    onValueChange={(value) => 
                      handleMappingChange(mapping.csvHeader, value === 'unmapped' ? null : value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select field..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      <SelectItem value="unmapped">
                        <span className="text-muted-foreground">🚫 Don't Map</span>
                      </SelectItem>
                      {availableFields.map(field => (
                        <SelectItem key={field.key} value={field.key}>
                          <div className="flex items-center gap-2">
                            <Database className="h-3 w-3 text-blue-500" />
                            <span>{field.label}</span>
                            {field.required && <span className="text-red-500">*</span>}
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Leasy
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                      {/* Show already mapped fields as disabled */}
                      {STANDARD_FIELDS.filter(field => 
                        isFieldAlreadyMapped(field.key, mapping) && field.key !== mapping.mappedField
                      ).map(field => (
                        <SelectItem key={`disabled-${field.key}`} value={field.key} disabled>
                          <div className="flex items-center gap-2 opacity-50">
                            <Database className="h-3 w-3 text-gray-400" />
                            <span>{field.label}</span>
                            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">
                              Already selected
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isCurrentlyMapped && (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Required Fields Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-green-600">Mapped Required Fields</Label>
            <div className="mt-1 space-y-1">
              {mappedRequiredFields.map(field => (
                <div key={field.key} className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {field.label}
                </div>
              ))}
            </div>
          </div>
          
          {missingRequiredFields.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-red-600">Missing Required Fields</Label>
              <div className="mt-1 space-y-1">
                {missingRequiredFields.map(field => (
                  <div key={field.key} className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {field.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          
          <Button 
            onClick={handleComplete}
            disabled={!canProceed}
            className="min-w-32"
          >
            {canProceed ? 'Continue with Mapping' : 'Complete Required Fields'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}