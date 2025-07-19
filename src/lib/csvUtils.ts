// CSV processing utilities with enhanced validation and conversion

interface PropertyRow {
  title: string;
  description?: string;
  apartment_type: string;
  category: string;
  street_number?: string;
  street_name: string;
  city: string;
  region?: string;
  zip_code?: string;
  country?: string;
  monthly_rent?: number;
  weekly_rate?: number;
  daily_rate?: number;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
  square_meters?: number;
  checkin_time?: string;
  checkout_time?: string;
  provides_wgsb?: boolean;
  house_rules?: string;
  [key: string]: any;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
  severity: 'error' | 'warning';
}

interface ProcessingResult {
  validRows: PropertyRow[];
  errors: ValidationError[];
  warnings: ValidationError[];
  skippedRows: number[];
}

// Enhanced data processing with graceful fallback
export function processRowsWithFallback(
  rawRows: any[], 
  columnMapping: Record<string, string>
): ProcessingResult {
  const validRows: PropertyRow[] = [];
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const skippedRows: number[] = [];

  rawRows.forEach((rawRow, index) => {
    const rowNumber = index + 1;
    const rowErrors: ValidationError[] = [];
    const rowWarnings: ValidationError[] = [];

    try {
      // Apply column mapping and convert data
      const mappedRow = applyColumnMapping(rawRow, columnMapping);
      const processedRow = validateAndConvertRow(mappedRow, rowNumber, rowErrors, rowWarnings);

      // Decide whether to include this row
      const criticalErrors = rowErrors.filter(e => e.severity === 'error');
      
      if (criticalErrors.length === 0) {
        validRows.push(processedRow);
        warnings.push(...rowWarnings);
      } else {
        skippedRows.push(rowNumber);
        errors.push(...rowErrors);
        warnings.push(...rowWarnings);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      errors.push({
        row: rowNumber,
        field: 'general',
        message: errorMessage,
        severity: 'error'
      });
      skippedRows.push(rowNumber);
    }
  });

  return {
    validRows,
    errors,
    warnings,
    skippedRows
  };
}

// Apply column mapping to raw row data
function applyColumnMapping(rawRow: any, mapping: Record<string, string>): any {
  const mappedRow: any = {};

  Object.entries(rawRow).forEach(([originalHeader, value]) => {
    const mappedField = mapping[originalHeader];
    if (mappedField) {
      mappedRow[mappedField] = value;
    } else {
      // Keep unmapped fields for potential media detection
      mappedRow[originalHeader] = value;
    }
  });

  return mappedRow;
}

// Enhanced row validation with graceful fallbacks
function validateAndConvertRow(
  row: any, 
  rowNumber: number, 
  errors: ValidationError[], 
  warnings: ValidationError[]
): PropertyRow {
  const processedRow: Partial<PropertyRow> = {};

  // Required fields validation
  const requiredFields = ['title', 'apartment_type', 'category', 'street_name', 'city'];
  
  requiredFields.forEach(field => {
    const value = row[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push({
        row: rowNumber,
        field,
        message: `Required field '${field}' is missing or empty`,
        value,
        severity: 'error'
      });
    } else {
      processedRow[field as keyof PropertyRow] = sanitizeString(value);
    }
  });

  // Optional string fields
  const stringFields = ['description', 'street_number', 'region', 'zip_code', 'country', 'house_rules'];
  stringFields.forEach(field => {
    const value = row[field];
    if (value !== undefined && value !== null && value !== '') {
      processedRow[field as keyof PropertyRow] = sanitizeString(value);
    }
  });

  // Numeric fields with validation and conversion
  const numericFields = [
    { field: 'monthly_rent', min: 0, max: 50000 },
    { field: 'weekly_rate', min: 0, max: 15000 },
    { field: 'daily_rate', min: 0, max: 2000 },
    { field: 'bedrooms', min: 0, max: 20, integer: true },
    { field: 'bathrooms', min: 0, max: 10, integer: true },
    { field: 'max_guests', min: 1, max: 50, integer: true },
    { field: 'square_meters', min: 1, max: 2000 }
  ];

  numericFields.forEach(({ field, min, max, integer }) => {
    const value = row[field];
    if (value !== undefined && value !== null && value !== '') {
      const converted = convertToNumber(value, field, rowNumber, errors, warnings);
      if (converted !== null) {
        if (converted < min || converted > max) {
          warnings.push({
            row: rowNumber,
            field,
            message: `Value ${converted} is outside expected range (${min}-${max})`,
            value: converted,
            severity: 'warning'
          });
        }
        processedRow[field as keyof PropertyRow] = integer ? Math.round(converted) : converted;
      }
    }
  });

  // Time fields
  ['checkin_time', 'checkout_time'].forEach(field => {
    const value = row[field];
    if (value) {
      const timeValue = validateTimeFormat(value, field, rowNumber, warnings);
      if (timeValue) {
        processedRow[field as keyof PropertyRow] = timeValue;
      }
    }
  });

  // Boolean field
  if (row.provides_wgsb !== undefined) {
    processedRow.provides_wgsb = convertToBoolean(row.provides_wgsb);
  }

  // Handle square feet conversion
  if (row.square_feet && !processedRow.square_meters) {
    const sqft = convertToNumber(row.square_feet, 'square_feet', rowNumber, errors, warnings);
    if (sqft) {
      processedRow.square_meters = Math.round(sqft * 0.092903); // Convert sq ft to sq m
      warnings.push({
        row: rowNumber,
        field: 'square_meters',
        message: `Converted ${sqft} sq ft to ${processedRow.square_meters} sq m`,
        severity: 'warning'
      });
    }
  }

  return processedRow as PropertyRow;
}

// Utility functions
function sanitizeString(value: any): string {
  if (typeof value !== 'string') {
    value = String(value);
  }
  return value.trim().replace(/\s+/g, ' '); // Normalize whitespace
}

function convertToNumber(
  value: any, 
  field: string, 
  row: number, 
  errors: ValidationError[], 
  warnings: ValidationError[]
): number | null {
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }

  if (typeof value === 'string') {
    // Remove currency symbols and separators
    const cleaned = value
      .replace(/[€$£¥]/g, '') // Currency symbols
      .replace(/[,\\s]/g, '') // Thousand separators
      .replace(/[^\\d.-]/g, ''); // Keep only digits, dots, minus

    const parsed = parseFloat(cleaned);
    
    if (isNaN(parsed)) {
      errors.push({
        row,
        field,
        message: `Cannot convert '${value}' to number`,
        value,
        severity: 'error'
      });
      return null;
    }

    return parsed;
  }

  return null;
}

function convertToBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return ['true', 'yes', 'y', '1', 'ja', 'oui', 'sí'].includes(lower);
  }
  if (typeof value === 'number') return value !== 0;
  return false;
}

function validateTimeFormat(
  value: any, 
  field: string, 
  row: number, 
  warnings: ValidationError[]
): string | null {
  if (typeof value !== 'string') {
    value = String(value);
  }

  // Try to parse time in various formats
  const timePatterns = [
    /^(\d{1,2}):(\d{2})$/, // HH:MM
    /^(\d{1,2})\.(\d{2})$/, // HH.MM
    /^(\d{1,2}):(\d{2}):(\d{2})$/, // HH:MM:SS
    /^(\d{1,2})$/ // Just hour
  ];

  for (const pattern of timePatterns) {
    const match = value.match(pattern);
    if (match) {
      const hour = parseInt(match[1]);
      const minute = parseInt(match[2] || '0');
      
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        const formatted = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        if (value !== formatted) {
          warnings.push({
            row,
            field,
            message: `Time format '${value}' converted to '${formatted}'`,
            value,
            severity: 'warning'
          });
        }
        
        return formatted;
      }
    }
  }

  warnings.push({
    row,
    field,
    message: `Invalid time format: '${value}'`,
    value,
    severity: 'warning'
  });

  return null;
}

// Auto-detect media URLs in any column
export function detectMediaColumns(row: any): { photos: string[], floorplans: string[] } {
  const photos: string[] = [];
  const floorplans: string[] = [];

  Object.entries(row).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const urls = extractUrlsFromString(value);
      urls.forEach(url => {
        if (isImageUrl(url)) {
          if (isFloorplanUrl(key, url)) {
            floorplans.push(url);
          } else {
            photos.push(url);
          }
        }
      });
    }
  });

  return { photos, floorplans };
}

function extractUrlsFromString(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s,;|]+/g;
  const matches = text.match(urlPattern) || [];
  return matches.map(url => url.trim().replace(/[,;|]+$/, '')); // Remove trailing separators
}

function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.includes(ext)) || 
         isImageHostUrl(url);
}

function isImageHostUrl(url: string): boolean {
  const imageHosts = [
    'imgur.com', 'flickr.com', 'cloudinary.com', 'unsplash.com', 
    'pexels.com', 'amazonaws.com', 'googleusercontent.com',
    'dropbox.com', 'onedrive.com', 'googledrive.com'
  ];
  return imageHosts.some(host => url.toLowerCase().includes(host));
}

function isFloorplanUrl(columnName: string, url: string): boolean {
  const floorplanKeywords = ['floorplan', 'floor_plan', 'layout', 'blueprint', 'plan', 'grundriss'];
  const lowerKey = columnName.toLowerCase();
  const lowerUrl = url.toLowerCase();
  
  return floorplanKeywords.some(keyword => 
    lowerKey.includes(keyword) || lowerUrl.includes(keyword)
  );
}
