import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  AlertTriangle,
  Image,
  FileImage
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { logger, logAsyncError } from "@/lib/logger";
import { duplicateDetectionService } from "@/lib/duplicateDetection";
import stringSimilarity from "string-similarity";
import * as XLSX from 'xlsx';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

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

interface MediaItem {
  url: string;
  originalUrl: string; // Store the original URL for reference
  type: 'photo' | 'floorplan';
  title: string;
  columnName: string;
}

interface PropertyWithMedia {
  propertyIndex: number;
  property: PropertyRow;
  mediaItems: MediaItem[];
  duplicateScore?: number;
  isDuplicate?: boolean;
}

interface UploadStepStatus {
  step: 'validation' | 'duplicate_check' | 'property_creation' | 'media_download' | 'complete';
  current: number;
  total: number;
  message: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'warning';
}

interface MediaDownloadResult {
  success: number;
  failed: number;
  errors: Array<{ url: string; error: string }>;
}

interface UploadResult {
  properties: {
    success: number;
    failed: number;
    skipped: number; // duplicates
  };
  media: MediaDownloadResult;
  errors: ValidationError[];
  duplicatesDetected: number;
}

const requiredFields = ['title', 'apartment_type', 'category', 'street_name', 'city'];

// Enhanced field mappings with more variations
const fieldMappings: { [key: string]: string } = {
  'title': 'title',
  'property_title': 'title',
  'name': 'title',
  'description': 'description',
  'apartment_type': 'apartment_type',
  'type': 'apartment_type',
  'property_type': 'apartment_type',
  'category': 'category',
  'rental_type': 'category',
  'street_number': 'street_number',
  'house_number': 'street_number',
  'street_name': 'street_name',
  'street': 'street_name',
  'address': 'street_name',
  'city': 'city',
  'region': 'region',
  'state': 'region',
  'zip_code': 'zip_code',
  'postal_code': 'zip_code',
  'zipcode': 'zip_code',
  'country': 'country',
  'monthly_rent': 'monthly_rent',
  'rent': 'monthly_rent',
  'price': 'monthly_rent',
  'weekly_rate': 'weekly_rate',
  'daily_rate': 'daily_rate',
  'bedrooms': 'bedrooms',
  'beds': 'bedrooms',
  'rooms': 'bedrooms',
  'bathrooms': 'bathrooms',
  'baths': 'bathrooms',
  'max_guests': 'max_guests',
  'capacity': 'max_guests',
  'guests': 'max_guests',
  'square_meters': 'square_meters',
  'area': 'square_meters',
  'size': 'square_meters',
  'sqm': 'square_meters',
  'checkin_time': 'checkin_time',
  'check_in': 'checkin_time',
  'checkout_time': 'checkout_time',
  'check_out': 'checkout_time',
  'provides_wgsb': 'provides_wgsb',
  'wgsb': 'provides_wgsb',
  'house_rules': 'house_rules',
  'rules': 'house_rules'
};

export const BulkUploadModal = ({ isOpen, onClose, onSuccess }: BulkUploadModalProps) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedData, setUploadedData] = useState<PropertyWithMedia[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStepStatus | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [manualProperties, setManualProperties] = useState<Partial<PropertyRow>[]>([{}]);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Media URL detection helpers
  const detectMediaUrls = (data: PropertyRow[]): PropertyWithMedia[] => {
    logger.debug('Starting media URL detection', { rowCount: data.length });
    
    return data.map((row, propertyIndex) => {
      const mediaItems: MediaItem[] = [];
      
      Object.entries(row).forEach(([columnName, value]) => {
        if (typeof value === 'string' && isValidUrl(value)) {
          const mediaType = detectMediaType(columnName, value);
          if (mediaType) {
            mediaItems.push({
              url: value,
              originalUrl: value,
              type: mediaType,
              title: generateMediaTitle(columnName, mediaType, mediaItems.filter(m => m.type === mediaType).length),
              columnName
            });
            logger.debug('Detected media URL', { columnName, url: value, type: mediaType });
          }
        }
      });
      
      return {
        propertyIndex,
        property: row,
        mediaItems
      };
    });
  };

  const isValidUrl = (str: string): boolean => {
    try {
      const url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const detectMediaType = (columnName: string, url: string): 'photo' | 'floorplan' | null => {
    const lowerKey = columnName.toLowerCase();
    const lowerUrl = url.toLowerCase();
    
    // Floorplan patterns (check first as they're more specific)
    const floorplanPatterns = [
      'floorplan', 'floor_plan', 'layout', 'blueprint', 'plan', 'grundriss'
    ];
    
    if (floorplanPatterns.some(pattern => lowerKey.includes(pattern) || lowerUrl.includes(pattern))) {
      return 'floorplan';
    }
    
    // Photo patterns
    const photoPatterns = [
      'photo', 'image', 'picture', 'img', 'pic', 'bild'
    ];
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));
    
    if (photoPatterns.some(pattern => lowerKey.includes(pattern)) || hasImageExtension || isImageHostUrl(url)) {
      return 'photo';
    }
    
    return null;
  };

  const isImageHostUrl = (url: string): boolean => {
    const imageHosts = [
      'imgur.com', 'flickr.com', 'cloudinary.com', 'unsplash.com', 
      'pexels.com', 'amazonaws.com', 'googleusercontent.com'
    ];
    return imageHosts.some(host => url.toLowerCase().includes(host));
  };

  const generateMediaTitle = (columnName: string, type: 'photo' | 'floorplan', index: number): string => {
    const cleanName = columnName.replace(/[_-]/g, ' ').replace(/([A-Z])/g, ' $1').trim();
    return `${cleanName} ${index + 1}`.replace(/\s+/g, ' ');
  };

  // File handling
  const downloadTemplate = async () => {
    try {
      const templateData = [{
        'Property Title': 'Modern Apartment in Berlin',
        'Description': 'Beautiful 2-bedroom apartment in the heart of Berlin',
        'Apartment Type': 'apartment',
        'Category': 'long_term',
        'Street Name': 'Alexanderplatz',
        'Street Number': '1',
        'City': 'Berlin',
        'Region': 'Berlin',
        'ZIP Code': '10178',
        'Country': 'Germany',
        'Monthly Rent': '1200',
        'Weekly Rate': '300',
        'Daily Rate': '50',
        'Bedrooms': '2',
        'Bathrooms': '1',
        'Max Guests': '4',
        'Square Meters': '75',
        'Check-in Time': '15:00',
        'Check-out Time': '11:00',
        'Provides WGSB': 'true',
        'House Rules': 'No smoking, no pets',
        'Photo URL 1': 'https://example.com/photo1.jpg',
        'Photo URL 2': 'https://example.com/photo2.jpg',
        'Floorplan URL': 'https://example.com/floorplan.pdf'
      }];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Properties Template");
      XLSX.writeFile(wb, "leasy_properties_template.xlsx");
      
      toast({
        title: "✅ Template Downloaded",
        description: "Use this template to format your property data correctly.",
      });
    } catch (error) {
      logAsyncError('Template download', error);
      toast({
        title: "Download Failed",
        description: "Failed to download template. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCurrentFileName(file.name);
    setIsProcessing(true);
    setUploadStep({
      step: 'validation',
      current: 0,
      total: 100,
      message: 'Reading file...',
      status: 'in_progress'
    });

    try {
      const data = await readFileAsync(file);
      const processedData = await processFileData(data);
      
      if (processedData.length === 0) {
        throw new Error('No valid data found in file');
      }

      // Detect media and validate
      const propertiesWithMedia = detectMediaUrls(processedData);
      await validateAndCheckDuplicates(propertiesWithMedia);
      
      setUploadedData(propertiesWithMedia);
      setActiveTab("review");
      
      const totalMedia = propertiesWithMedia.reduce((sum, item) => sum + item.mediaItems.length, 0);
      const totalPhotos = propertiesWithMedia.reduce((sum, item) => 
        sum + item.mediaItems.filter(m => m.type === 'photo').length, 0);
      const totalFloorplans = propertiesWithMedia.reduce((sum, item) => 
        sum + item.mediaItems.filter(m => m.type === 'floorplan').length, 0);
      
      if (totalMedia > 0) {
        toast({
          title: "📸 Media URLs Detected",
          description: `Found ${totalPhotos} photos and ${totalFloorplans} floorplans to download automatically.`,
        });
      }
      
    } catch (error) {
      logAsyncError('File upload processing', error);
      toast({
        title: "File Processing Error",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadStep(null);
    }
  };

  const readFileAsync = (file: File): Promise<PropertyRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            reject(new Error('File appears to be empty or has no data rows'));
            return;
          }

          const processedData = await processFileData(jsonData);
          resolve(processedData);
        } catch (error) {
          reject(new Error('Failed to read file. Please check the format.'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const processFileData = async (jsonData: any[]): Promise<PropertyRow[]> => {
    const rawHeaders = jsonData[0] as string[];
    const dataRows = jsonData.slice(1) as any[][];
    
    // Validate that rawHeaders is actually an array
    if (!Array.isArray(rawHeaders)) {
      throw new Error('Invalid file format: Unable to read headers');
    }
    
    return dataRows.map(row => {
      const mappedRow: Partial<PropertyRow> = {};
      
      rawHeaders.forEach((header, index) => {
        const normalizedHeader = header.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
        const dbField = fieldMappings[normalizedHeader] || normalizedHeader;
        let value = row[index];
        
        // Skip empty values
        if (value === undefined || value === null || value === '') return;
        
        // Handle boolean fields
        if (dbField === 'provides_wgsb') {
          value = value === 'true' || value === true || value === 1;
        }
        
        // Handle numeric fields
        if (['monthly_rent', 'weekly_rate', 'daily_rate', 'bedrooms', 'bathrooms', 'max_guests', 'square_meters'].includes(dbField)) {
          value = Number(value) || 0;
        }
        
        (mappedRow as any)[dbField] = value;
      });
      
      // Set defaults
      mappedRow.country = mappedRow.country || 'Germany';
      mappedRow.provides_wgsb = mappedRow.provides_wgsb || false;
      
      return mappedRow as PropertyRow;
    });
  };

  const validateAndCheckDuplicates = async (propertiesWithMedia: PropertyWithMedia[]) => {
    if (!user) return;

    setUploadStep({
      step: 'duplicate_check',
      current: 0,
      total: propertiesWithMedia.length,
      message: 'Checking for duplicates...',
      status: 'in_progress'
    });

    const errors: ValidationError[] = [];
    let duplicatesFound = 0;

    // Get existing properties for fuzzy duplicate detection
    const { data: existingProperties } = await supabase
      .from("properties")
      .select("id, title, street_name, city, monthly_rent")
      .eq("user_id", user.id);

    for (let i = 0; i < propertiesWithMedia.length; i++) {
      const { property } = propertiesWithMedia[i];
      
      // Validate required fields
      requiredFields.forEach(field => {
        if (!property[field as keyof PropertyRow] || property[field as keyof PropertyRow] === '') {
          errors.push({
            row: i + 1,
            field,
            message: `${field} is required`,
            value: property[field as keyof PropertyRow],
            severity: 'error'
          });
        }
      });

      // Enhanced duplicate detection with fuzzy matching
      try {
        const key = `${property.title} ${property.street_name} ${property.city}`.toLowerCase();

        // Check for exact duplicates
        const isExactDuplicate = existingProperties?.some(p =>
          p.title === property.title &&
          p.street_name === property.street_name &&
          p.city === property.city
        );

        // Check for fuzzy duplicates
        const isFuzzyDuplicate = existingProperties?.some(p => {
          const compare = `${p.title} ${p.street_name} ${p.city}`.toLowerCase();
          const similarity = stringSimilarity.compareTwoStrings(key, compare);
          return similarity >= 0.87;
        });

        if (isExactDuplicate || isFuzzyDuplicate) {
          propertiesWithMedia[i].isDuplicate = true;
          propertiesWithMedia[i].duplicateScore = isExactDuplicate ? 100 : 87;
          duplicatesFound++;
          
          errors.push({
            row: i + 1,
            field: 'duplicate',
            message: `${isExactDuplicate ? 'Exact' : 'Fuzzy'} duplicate detected`,
            severity: 'warning'
          });
          
          console.info(`⚠️ Skipping duplicate (${isExactDuplicate ? 'exact' : 'fuzzy'}) at row ${i + 1}`);
        }
      } catch (error) {
        logger.warn('Duplicate detection failed for property', { propertyIndex: i, error });
      }

      setUploadStep({
        step: 'duplicate_check',
        current: i + 1,
        total: propertiesWithMedia.length,
        message: `Checked ${i + 1}/${propertiesWithMedia.length} properties...`,
        status: 'in_progress'
      });
    }

    setValidationErrors(errors);
    
    if (duplicatesFound > 0) {
      toast({
        title: "⚠️ Duplicates Detected",
        description: `Found ${duplicatesFound} potential duplicate(s). Review before uploading.`,
        variant: "default"
      });
    }
  };

  /**
   * Extracts media items (photos and floorplans) from a property row
   */
  const extractMediaItemsFromRow = (row: PropertyRow): { url: string; type: 'photo' | 'floorplan' }[] => {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`$]*\.(?:jpg|jpeg|png|gif|webp|bmp|svg|tiff)(?:\?[^\s<>"{}|\\^`\[\]]*)?/gi;
    const items: { url: string; type: 'photo' | 'floorplan' }[] = [];

    Object.entries(row).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (typeof value === "string") {
        const matches = value.match(urlRegex);
        if (matches && (lowerKey.includes("image") || lowerKey.includes("photo") || lowerKey.includes("floor"))) {
          const type = lowerKey.includes("floor") ? "floorplan" : "photo";
          matches.forEach((url) => items.push({ url, type }));
        }
      }
    });

    return items;
  };

  /**
   * Extracts and saves all media from a PropertyRow object, organized by CSV filename.
   * Downloads each image/floorplan, uploads it to Supabase Storage, and links it in `property_media`.
   */
  const saveImagesForPropertyRow = async (
    property: PropertyRow,
    propertyId: string,
    sourceFileName: string
  ) => {
    const mediaItems = extractMediaItemsFromRow(property);
    const folderName = sourceFileName.replace(/[^a-z0-9_\-]/gi, "-").replace(/\.csv$/i, "").toLowerCase();

    for (const item of mediaItems) {
      const { url, type } = item;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Fetch failed for ${url}`);

        const blob = await response.blob();
        const contentType = response.headers.get("content-type");
        if (!contentType?.startsWith("image/")) throw new Error("Invalid image");

        const extension = contentType.split("/")[1] || "jpg";
        const filename = `${folderName}/${propertyId}/${Date.now()}-${Math.floor(Math.random() * 99999)}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("property-photos")
          .upload(filename, blob, { contentType, upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("property-photos")
          .getPublicUrl(filename);

        await supabase.from("property_media").insert({
          property_id: propertyId,
          media_type: type,
          url: publicUrl,
          title: `Auto-uploaded ${type}`,
          sort_order: 0,
        });

        console.info(`✅ ${type} saved: ${publicUrl}`);
      } catch (err) {
        console.warn(`❌ Failed to process ${type} URL: ${url}`, err);
      }
    }
  };

  /**
   * Cleanup function to remove all files and DB entries for a specific CSV folder
   */
  const cleanupByCSVFolder = async (folderName: string) => {
    const prefix = folderName.replace(/[^a-z0-9_\-]/gi, "-").replace(/\.csv$/i, "").toLowerCase();

    const { data: list, error: listError } = await supabase.storage
      .from("property-photos")
      .list(prefix, { limit: 1000 });

    if (listError) {
      console.error("Failed to list files", listError);
      return;
    }

    const filePaths = list?.map((f) => `${prefix}/${f.name}`) || [];

    if (filePaths.length === 0) {
      console.warn("⚠️ No files found to delete.");
      return;
    }

    const { error: deleteError } = await supabase.storage
      .from("property-photos")
      .remove(filePaths);

    if (deleteError) {
      console.error("Failed to delete images", deleteError);
    } else {
      console.log(`✅ Deleted ${filePaths.length} images from ${prefix}`);
    }

    const { error: dbError } = await supabase
      .from("property_media")
      .delete()
      .like("url", `%/${prefix}/%`);

    if (dbError) {
      console.error("Failed to delete DB entries", dbError);
    } else {
      console.log(`✅ Deleted media DB entries for ${prefix}`);
    }
  };

  /**
   * Check if a filename indicates it's a test file
   */
  const isTestFile = (filename: string): boolean => {
    const lowerName = filename.toLowerCase();
    return lowerName.includes('test') || lowerName.includes('demo') || lowerName.includes('sample');
  };

  // Media download functionality
  const downloadAndSaveMedia = async (propertyId: string, mediaItems: MediaItem[]): Promise<MediaDownloadResult> => {
    const result: MediaDownloadResult = { success: 0, failed: 0, errors: [] };
    
    for (const media of mediaItems) {
      try {
        // Download the file
        const response = await fetch(media.url, {
          headers: {
            'User-Agent': 'Leasy Property Management System'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const fileName = generateFileName(media);
        const filePath = `${propertyId}/${media.type === 'floorplan' ? 'floorplans' : 'photos'}/${fileName}`;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('property-photos')
          .upload(filePath, blob, {
            contentType: blob.type,
            cacheControl: '3600'
          });
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('property-photos')
          .getPublicUrl(filePath);
        
        // Save to property_media table with original URL reference
        const { error: dbError } = await supabase
          .from('property_media')
          .insert({
            property_id: propertyId,
            url: publicUrl,
            media_type: media.type,
            title: media.title,
            sort_order: result.success,
            category: media.originalUrl // Store original URL for reference
          });
        
        if (dbError) throw dbError;
        
        result.success++;
        logger.debug('Media downloaded and saved successfully', { 
          propertyId, 
          originalUrl: media.originalUrl, 
          storedUrl: publicUrl 
        });
        
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          url: media.originalUrl,
          error: error.message || 'Unknown error'
        });
        logger.error('Media download failed', { 
          propertyId, 
          originalUrl: media.originalUrl, 
          error: error.message 
        });
      }
    }
    
    return result;
  };

  const generateFileName = (media: MediaItem): string => {
    const timestamp = Date.now();
    const sanitizedTitle = media.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const extension = getFileExtension(media.url);
    return `${timestamp}_${sanitizedTitle}.${extension}`;
  };

  const getFileExtension = (url: string): string => {
    try {
      const path = new URL(url).pathname;
      const extension = path.split('.').pop()?.toLowerCase();
      return extension && ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'pdf'].includes(extension) 
        ? extension 
        : 'jpg';
    } catch {
      return 'jpg';
    }
  };

  // Main upload functionality
  const handleBulkUpload = async () => {
    if (!user) return;
    
    const errorCount = validationErrors.filter(e => e.severity === 'error').length;
    if (errorCount > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix all validation errors before uploading.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    const result: UploadResult = {
      properties: { success: 0, failed: 0, skipped: 0 },
      media: { success: 0, failed: 0, errors: [] },
      errors: [],
      duplicatesDetected: 0
    };

    try {
      const validProperties = uploadedData.filter(item => !item.isDuplicate);
      const duplicateProperties = uploadedData.filter(item => item.isDuplicate);
      result.duplicatesDetected = duplicateProperties.length;

      setUploadStep({
        step: 'property_creation',
        current: 0,
        total: validProperties.length,
        message: 'Creating properties...',
        status: 'in_progress'
      });

      // Create properties
      for (let i = 0; i < validProperties.length; i++) {
        const { property, mediaItems } = validProperties[i];
        
        try {
          const { data: insertedProperty, error } = await supabase
            .from('properties')
            .insert({
              ...property,
              user_id: user.id,
              status: 'draft'
            })
            .select('id')
            .single();

          if (error) throw error;
          
          result.properties.success++;
          
          // Save images using the new helper function
          await saveImagesForPropertyRow(property, insertedProperty.id, currentFileName);
          
          // Download and save media if any (for existing media URL detection)
          if (mediaItems.length > 0) {
            setUploadStep({
              step: 'media_download',
              current: i + 1,
              total: validProperties.length,
              message: `Downloading media for property ${i + 1}...`,
              status: 'in_progress'
            });
            
            const mediaResult = await downloadAndSaveMedia(insertedProperty.id, mediaItems);
            result.media.success += mediaResult.success;
            result.media.failed += mediaResult.failed;
            result.media.errors.push(...(mediaResult.errors || []));
          }
          
          setUploadStep({
            step: 'property_creation',
            current: i + 1,
            total: validProperties.length,
            message: `Created ${i + 1}/${validProperties.length} properties...`,
            status: 'in_progress'
          });
          
        } catch (error: any) {
          result.properties.failed++;
          result.errors.push({
            row: validProperties[i].propertyIndex + 1,
            field: 'general',
            message: error.message || 'Failed to create property',
            severity: 'error'
          });
          logger.error('Property creation failed', { propertyIndex: i, error: error.message });
        }
      }

      result.properties.skipped = duplicateProperties.length;
      setUploadResult(result);
      
      // Show success message
      const mediaMessage = result.media.success > 0 
        ? ` Downloaded ${result.media.success} media files${result.media.failed > 0 ? ` (${result.media.failed} failed)` : ''}.`
        : '';
      
      const duplicateMessage = result.duplicatesDetected > 0 
        ? ` Skipped ${result.duplicatesDetected} duplicate(s).`
        : '';
      
      toast({
        title: "🎉 Upload Complete",
        description: `Created ${result.properties.success} properties.${mediaMessage}${duplicateMessage}`,
      });

      // Schedule automatic cleanup for test uploads
      if (currentFileName && isTestFile(currentFileName)) {
        console.log(`⏰ Scheduling cleanup for test file: ${currentFileName} in 10 minutes`);
        setTimeout(() => {
          cleanupByCSVFolder(currentFileName);
        }, 10 * 60 * 1000); // 10 minutes
        
        toast({
          title: "🧪 Test Upload Detected",
          description: "This test data will be automatically cleaned up in 10 minutes.",
          variant: "default"
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      setActiveTab("results");
      
    } catch (error) {
      logAsyncError('Bulk upload', error);
      toast({
        title: "Upload Error",
        description: "An unexpected error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setUploadStep({
        step: 'complete',
        current: 100,
        total: 100,
        message: 'Upload completed',
        status: 'completed'
      });
    }
  };

  // Manual property management
  const addManualProperty = () => {
    setManualProperties([...manualProperties, {}]);
  };

  const removeManualProperty = (index: number) => {
    setManualProperties(manualProperties.filter((_, i) => i !== index));
  };

  const updateManualProperty = (index: number, field: string, value: any) => {
    const updated = [...manualProperties];
    updated[index] = { ...updated[index], [field]: value };
    setManualProperties(updated);
  };

  const resetModal = () => {
    setUploadedData([]);
    setValidationErrors([]);
    setUploadResult(null);
    setUploadStep(null);
    setManualProperties([{}]);
    setActiveTab("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const validationSummary = {
    totalRows: uploadedData.length,
    validRows: uploadedData.length - validationErrors.filter(e => e.severity === 'error').map(e => e.row).filter((row, index, arr) => arr.indexOf(row) === index).length,
    errorRows: validationErrors.filter(e => e.severity === 'error').map(e => e.row).filter((row, index, arr) => arr.indexOf(row) === index).length,
    warningRows: validationErrors.filter(e => e.severity === 'warning').map(e => e.row).filter((row, index, arr) => arr.indexOf(row) === index).length,
    duplicates: uploadedData.filter(item => item.isDuplicate).length,
    mediaItems: uploadedData.reduce((sum, item) => sum + item.mediaItems.length, 0)
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetModal(); } }}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Properties</DialogTitle>
          <DialogDescription>
            Upload multiple properties at once using CSV/Excel files with automatic media download and duplicate detection.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="review" disabled={uploadedData.length === 0}>
              Review ({uploadedData.length})
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!uploadResult}>
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Upload CSV/Excel File
                </CardTitle>
                <CardDescription>
                  Upload a CSV or Excel file containing property data. Media URLs will be automatically detected and downloaded.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    onClick={downloadTemplate}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>
                </div>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-lg font-medium">Drop your file here or click to browse</span>
                    <p className="text-muted-foreground mt-2">
                      Supports CSV, XLS, and XLSX files. Include photo and floorplan URLs for automatic download.
                    </p>
                  </Label>
                  <Input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </div>

                {isProcessing && uploadStep && (
                  <Alert>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(uploadStep.status)}
                      <AlertDescription>
                        <div className="flex flex-col gap-2">
                          <span>{uploadStep.message}</span>
                          <Progress value={(uploadStep.current / uploadStep.total) * 100} className="w-full" />
                        </div>
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Manual Property Entry</CardTitle>
                    <CardDescription>
                      Add properties manually by filling out the form below.
                    </CardDescription>
                  </div>
                  <Button onClick={addManualProperty} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-6">
                    {manualProperties.map((property, index) => (
                      <Card key={index} className="border-dashed">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Property {index + 1}</CardTitle>
                            {manualProperties.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeManualProperty(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`title-${index}`}>Property Title *</Label>
                            <Input
                              id={`title-${index}`}
                              value={property.title || ''}
                              onChange={(e) => updateManualProperty(index, 'title', e.target.value)}
                              placeholder="Enter property title"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`apartment_type-${index}`}>Apartment Type *</Label>
                            <Select 
                              value={property.apartment_type || ''} 
                              onValueChange={(value) => updateManualProperty(index, 'apartment_type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="apartment">Apartment</SelectItem>
                                <SelectItem value="studio">Studio</SelectItem>
                                <SelectItem value="house">House</SelectItem>
                                <SelectItem value="room">Room</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor={`category-${index}`}>Category *</Label>
                            <Select 
                              value={property.category || ''} 
                              onValueChange={(value) => updateManualProperty(index, 'category', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="short_term">Short Term</SelectItem>
                                <SelectItem value="long_term">Long Term</SelectItem>
                                <SelectItem value="corporate">Corporate</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor={`city-${index}`}>City *</Label>
                            <Input
                              id={`city-${index}`}
                              value={property.city || ''}
                              onChange={(e) => updateManualProperty(index, 'city', e.target.value)}
                              placeholder="Enter city"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`street_name-${index}`}>Street Name *</Label>
                            <Input
                              id={`street_name-${index}`}
                              value={property.street_name || ''}
                              onChange={(e) => updateManualProperty(index, 'street_name', e.target.value)}
                              placeholder="Enter street name"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`monthly_rent-${index}`}>Monthly Rent (€)</Label>
                            <Input
                              id={`monthly_rent-${index}`}
                              type="number"
                              value={property.monthly_rent || ''}
                              onChange={(e) => updateManualProperty(index, 'monthly_rent', Number(e.target.value))}
                              placeholder="Enter monthly rent"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Label htmlFor={`description-${index}`}>Description</Label>
                            <Textarea
                              id={`description-${index}`}
                              value={property.description || ''}
                              onChange={(e) => updateManualProperty(index, 'description', e.target.value)}
                              placeholder="Enter property description"
                              rows={3}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Properties</CardTitle>
                <CardDescription>
                  Review the uploaded data, check for duplicates, and verify media detection before creating properties.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">{validationSummary.totalRows}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{validationSummary.validRows}</div>
                      <div className="text-xs text-muted-foreground">Valid</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{validationSummary.errorRows}</div>
                      <div className="text-xs text-muted-foreground">Errors</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{validationSummary.warningRows}</div>
                      <div className="text-xs text-muted-foreground">Warnings</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{validationSummary.duplicates}</div>
                      <div className="text-xs text-muted-foreground">Duplicates</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{validationSummary.mediaItems}</div>
                      <div className="text-xs text-muted-foreground">Media URLs</div>
                    </div>
                  </div>

                  {validationErrors.filter(e => e.severity === 'error').length === 0 && (
                    <Button 
                      onClick={handleBulkUpload} 
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? 'Processing...' : `Upload ${validationSummary.validRows} Properties`}
                    </Button>
                  )}

                  {validationErrors.filter(e => e.severity === 'error').length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Please fix all validation errors before uploading. Check the table below for details.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {isProcessing && uploadStep && (
                  <Alert className="mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(uploadStep.status)}
                      <AlertDescription>
                        <div className="flex flex-col gap-2">
                          <span>{uploadStep.message}</span>
                          <Progress value={(uploadStep.current / uploadStep.total) * 100} className="w-full" />
                        </div>
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                {uploadedData.length > 0 && (
                  <div className="border rounded-lg">
                    <ScrollArea className="h-96">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Row</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Media</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploadedData.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-medium">{item.property.title}</TableCell>
                              <TableCell>
                                {[item.property.street_name, item.property.city].filter(Boolean).join(', ')}
                              </TableCell>
                               <TableCell>
                                 <div className="flex gap-1">
                                   {item.isDuplicate ? (
                                     <Badge variant="destructive">Duplicate</Badge>
                                   ) : (
                                     <Badge variant="outline">New</Badge>
                                   )}
                                   {validationErrors.filter(e => e.row === index + 1 && e.severity === 'error').length > 0 && (
                                     <Badge variant="destructive">Error</Badge>
                                   )}
                                   {validationErrors.filter(e => e.row === index + 1 && e.severity === 'warning').length > 0 && (
                                     <Badge variant="outline">Warning</Badge>
                                   )}
                                 </div>
                               </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {item.mediaItems.filter(m => m.type === 'photo').length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Image className="h-3 w-3" />
                                      <span className="text-xs">{item.mediaItems.filter(m => m.type === 'photo').length}</span>
                                    </div>
                                  )}
                                  {item.mediaItems.filter(m => m.type === 'floorplan').length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <FileImage className="h-3 w-3" />
                                      <span className="text-xs">{item.mediaItems.filter(m => m.type === 'floorplan').length}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {uploadResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Upload Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{uploadResult.properties.success}</div>
                      <div className="text-sm text-muted-foreground">Properties Created</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{uploadResult.properties.failed}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{uploadResult.properties.skipped}</div>
                      <div className="text-sm text-muted-foreground">Skipped (Duplicates)</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{uploadResult.media.success}</div>
                      <div className="text-sm text-muted-foreground">Media Downloaded</div>
                    </div>
                  </div>

                  {uploadResult.media.failed > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {uploadResult.media.failed} media files failed to download. Check the error details below.
                      </AlertDescription>
                    </Alert>
                  )}

                  {uploadResult.media.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Media Download Errors:</h4>
                      <ScrollArea className="h-32 border rounded p-2">
                        {uploadResult.media.errors.map((error, index) => (
                          <div key={index} className="text-sm mb-1">
                            <span className="font-mono text-xs">{error.url}</span>: {error.error}
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button onClick={() => { onClose(); resetModal(); }}>
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadModal;