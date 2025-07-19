import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Wand2, RotateCcw } from 'lucide-react';
import * as fuzzball from 'fuzzball';

// Standard field mappings for property data
const STANDARD_FIELDS = [
  { key: 'title', label: 'Property Title', required: true },
  { key: 'description', label: 'Description', required: false },
  { key: 'apartment_type', label: 'Apartment Type', required: true },
  { key: 'category', label: 'Category', required: true },
  { key: 'street_name', label: 'Street Name', required: true },
  { key: 'street_number', label: 'Street Number', required: false },
  { key: 'city', label: 'City', required: true },
  { key: 'zip_code', label: 'ZIP Code', required: false },
  { key: 'region', label: 'Region/State', required: false },
  { key: 'country', label: 'Country', required: false },
  { key: 'monthly_rent', label: 'Monthly Rent', required: false },
  { key: 'weekly_rate', label: 'Weekly Rate', required: false },
  { key: 'daily_rate', label: 'Daily Rate', required: false },
  { key: 'bedrooms', label: 'Bedrooms', required: false },
  { key: 'bathrooms', label: 'Bathrooms', required: false },
  { key: 'max_guests', label: 'Max Guests', required: false },
  { key: 'square_meters', label: 'Square Meters', required: false },
  { key: 'checkin_time', label: 'Check-in Time', required: false },
  { key: 'checkout_time', label: 'Check-out Time', required: false },
  { key: 'provides_wgsb', label: 'Provides WGSB', required: false },
  { key: 'house_rules', label: 'House Rules', required: false },
  { key: 'image_urls', label: 'Image URLs', required: false },
  { key: 'floorplan_urls', label: 'Floorplan URLs', required: false }
];

// Common header variations for automatic detection
const HEADER_PATTERNS: Record<string, string[]> = {
  title: ['title', 'property_title', 'name', 'property_name', 'listing_title'],
  description: ['description', 'desc', 'details', 'property_description'],
  apartment_type: ['apartment_type', 'type', 'property_type', 'unit_type'],
  category: ['category', 'rental_type', 'listing_category'],
  street_name: ['street_name', 'street', 'address', 'street_address'],
  street_number: ['street_number', 'house_number', 'number'],
  city: ['city', 'location', 'town'],
  zip_code: ['zip_code', 'postal_code', 'zipcode', 'zip', 'postcode'],
  region: ['region', 'state', 'province'],
  country: ['country', 'nation'],
  monthly_rent: ['monthly_rent', 'rent', 'price', 'monthly_price'],
  weekly_rate: ['weekly_rate', 'weekly_rent', 'weekly_price'],
  daily_rate: ['daily_rate', 'daily_rent', 'daily_price', 'nightly_rate'],
  bedrooms: ['bedrooms', 'beds', 'rooms', 'bedroom_count'],
  bathrooms: ['bathrooms', 'baths', 'bathroom_count'],
  max_guests: ['max_guests', 'capacity', 'guests', 'occupancy'],
  square_meters: ['square_meters', 'area', 'size', 'sqm', 'square_feet'],
  checkin_time: ['checkin_time', 'check_in', 'checkin', 'arrival_time'],
  checkout_time: ['checkout_time', 'check_out', 'checkout', 'departure_time'],
  provides_wgsb: ['provides_wgsb', 'wgsb', 'housing_benefit'],
  house_rules: ['house_rules', 'rules', 'policies'],
  image_urls: ['image_urls', 'images', 'photos', 'photo_urls', 'pictures'],
  floorplan_urls: ['floorplan_urls', 'floorplan', 'layout', 'plan']
};

interface ColumnMapping {
  csvHeader: string;
  mappedField: string | null;
  confidence: number;
}

interface ColumnMapperProps {
  csvHeaders: string[];
  onMappingComplete: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

export function ColumnMapper({ csvHeaders, onMappingComplete, onCancel }: ColumnMapperProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [autoMapped, setAutoMapped] = useState(false);

  // Auto-detect mappings on component mount
  useEffect(() => {
    const autoDetectedMappings = autoDetectMappings(csvHeaders);
    setMappings(autoDetectedMappings);
    setAutoMapped(true);
  }, [csvHeaders]);

  // Save mappings to localStorage for future use
  const saveMappingsToStorage = (finalMappings: Record<string, string>) => {
    try {
      const mappingKey = csvHeaders.slice(0, 5).join(','); // Use first 5 headers as key
      localStorage.setItem(`csv_mapping_${mappingKey}`, JSON.stringify(finalMappings));
    } catch (error) {
      console.warn('Failed to save mappings to localStorage:', error);
    }
  };

  // Load previous mappings from localStorage
  const loadMappingsFromStorage = (): Record<string, string> | null => {
    try {
      const mappingKey = csvHeaders.slice(0, 5).join(',');
      const saved = localStorage.getItem(`csv_mapping_${mappingKey}`);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('Failed to load mappings from localStorage:', error);
      return null;
    }
  };

  // Auto-detect mappings based on header similarity
  function autoDetectMappings(headers: string[]): ColumnMapping[] {
    const savedMappings = loadMappingsFromStorage();
    
    return headers.map(header => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      // Check saved mappings first
      if (savedMappings && savedMappings[header]) {
        return {
          csvHeader: header,
          mappedField: savedMappings[header],
          confidence: 1.0
        };
      }

      // Find best match using fuzzy string matching
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
        confidence: bestScore
      };
    });
  }

  const handleMappingChange = (csvHeader: string, mappedField: string | null) => {
    setMappings(prev => prev.map(mapping => 
      mapping.csvHeader === csvHeader 
        ? { ...mapping, mappedField, confidence: mappedField ? 1.0 : 0 }
        : mapping
    ));
  };

  const handleAutoMap = () => {
    const autoDetectedMappings = autoDetectMappings(csvHeaders);
    setMappings(autoDetectedMappings);
    setAutoMapped(true);
  };

  const handleReset = () => {
    setMappings(csvHeaders.map(header => ({
      csvHeader: header,
      mappedField: null,
      confidence: 0
    })));
    setAutoMapped(false);
  };

  const handleComplete = () => {
    const finalMapping: Record<string, string> = {};
    mappings.forEach(mapping => {
      if (mapping.mappedField) {
        finalMapping[mapping.csvHeader] = mapping.mappedField;
      }
    });

    saveMappingsToStorage(finalMapping);
    onMappingComplete(finalMapping);
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Column Mapping
        </CardTitle>
        <CardDescription>
          Map your CSV columns to the expected property fields. Required fields are marked with *.
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
                Auto-detected with {Math.round(mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length * 100)}% confidence
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleAutoMap}>
              <Wand2 className="h-3 w-3 mr-1" />
              Auto-Map
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

        {/* Mapping Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {mappings.map((mapping, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex-1">
                <Label className="text-sm font-medium">{mapping.csvHeader}</Label>
                {mapping.confidence > 0 && mapping.confidence < 1 && (
                  <div className="text-xs text-muted-foreground">
                    {Math.round(mapping.confidence * 100)}% match
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
                  <SelectContent>
                    <SelectItem value="unmapped">
                      <span className="text-muted-foreground">Don't map</span>
                    </SelectItem>
                    {STANDARD_FIELDS.map(field => (
                      <SelectItem key={field.key} value={field.key}>
                        <div className="flex items-center gap-2">
                          <span>{field.label}</span>
                          {field.required && <span className="text-red-500">*</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {mapping.mappedField && (
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              )}
            </div>
          ))}
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