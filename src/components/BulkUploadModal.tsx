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
  Edit3,
  MapPin,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PropertyRow {
  title: string;
  description: string;
  apartment_type: string;
  category: string;
  street_number: string;
  street_name: string;
  city: string;
  region: string;
  zip_code: string;
  country: string;
  monthly_rent: number;
  weekly_rate: number;
  daily_rate: number;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  square_meters: number;
  checkin_time: string;
  checkout_time: string;
  provides_wgsb: boolean;
  house_rules: string;
  [key: string]: any;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
  severity: 'error' | 'warning';
}

interface ValidationSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  missingFields: string[];
  groupedErrors: { [field: string]: number };
}

interface UploadResult {
  success: number;
  failed: number;
  errors: ValidationError[];
}

interface MediaItem {
  url: string;
  type: 'photo' | 'floorplan';
  title?: string;
}

const requiredFields = [
  'title', 'apartment_type', 'category', 'street_name', 'city'
];

const fieldMappings: { [key: string]: string } = {
  'title': 'title',
  'description': 'description',
  'apartment_type': 'apartment_type',
  'category': 'category',
  'street_number': 'street_number',
  'street_name': 'street_name',
  'city': 'city',
  'region': 'region',
  'zip_code': 'zip_code',
  'country': 'country',
  'monthly_rent': 'monthly_rent',
  'weekly_rate': 'weekly_rate',
  'daily_rate': 'daily_rate',
  'bedrooms': 'bedrooms',
  'bathrooms': 'bathrooms',
  'max_guests': 'max_guests',
  'square_meters': 'square_meters',
  'checkin_time': 'checkin_time',
  'checkout_time': 'checkout_time',
  'provides_wgsb': 'provides_wgsb',
  'house_rules': 'house_rules'
};

export const BulkUploadModal = ({ isOpen, onClose, onSuccess }: BulkUploadModalProps) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedData, setUploadedData] = useState<PropertyRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [manualProperties, setManualProperties] = useState<Partial<PropertyRow>[]>([{}]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const detectMediaUrls = (data: PropertyRow[]): { propertyIndex: number; mediaItems: MediaItem[] }[] => {
    const results: { propertyIndex: number; mediaItems: MediaItem[] }[] = [];
    
    console.log('🔍 Detecting media URLs in CSV data:', data.length, 'rows');
    
    data.forEach((row, propertyIndex) => {
      const mediaItems: MediaItem[] = [];
      
      Object.entries(row).forEach(([key, value]) => {
        console.log(`Checking field "${key}":`, value);
        if (typeof value === 'string' && isValidUrl(value)) {
          console.log(`Found URL in "${key}":`, value);
          const mediaType = detectMediaType(key, value);
          if (mediaType) {
            console.log(`Detected media type: ${mediaType}`);
            mediaItems.push({
              url: value,
              type: mediaType,
              title: generateMediaTitle(key, mediaType, mediaItems.filter(m => m.type === mediaType).length)
            });
          }
        }
      });
      
      if (mediaItems.length > 0) {
        console.log(`Property ${propertyIndex} has ${mediaItems.length} media items:`, mediaItems);
        results.push({ propertyIndex, mediaItems });
      }
    });
    
    console.log('📊 Media detection results:', results.length, 'properties with media');
    return results;
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
    
    console.log(`🔍 Analyzing column "${columnName}" with URL: ${url}`);
    
    // More comprehensive floorplan detection
    if (lowerKey.includes('floorplan') || lowerKey.includes('floor_plan') || 
        lowerKey.includes('layout') || lowerKey.includes('blueprint') ||
        lowerKey.includes('plan') || lowerKey.includes('floor') ||
        lowerUrl.includes('floorplan') || lowerUrl.includes('floor_plan') ||
        lowerUrl.includes('layout') || lowerUrl.includes('blueprint') ||
        lowerUrl.includes('plan')) {
      console.log('✅ Detected as floorplan');
      return 'floorplan';
    }
    
    // More comprehensive photo detection
    if (lowerKey.includes('photo') || lowerKey.includes('image') || 
        lowerKey.includes('picture') || lowerKey.includes('img') ||
        lowerKey.includes('pic') || lowerKey.includes('jpeg') ||
        lowerKey.includes('jpg') || lowerKey.includes('png') ||
        lowerKey.includes('url') || lowerKey.includes('link') ||
        isImageUrl(url)) {
      console.log('✅ Detected as photo');
      return 'photo';
    }
    
    console.log('❌ No media type detected');
    return null;
  };

  const isImageUrl = (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif'];
    const lowerUrl = url.toLowerCase();
    
    // Check file extensions
    const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));
    
    // Check for common image hosting patterns
    const imageHostPatterns = [
      'imgur.com', 'flickr.com', 'photobucket.com', 'tinypic.com',
      'imageshack.us', 'postimage.org', 'imagehosting', 'cloudinary.com',
      'unsplash.com', 'pexels.com', 'pixabay.com', 'shutterstock.com',
      'amazonaws.com', 'cloudfront.net', 'googleusercontent.com'
    ];
    
    const hasImageHost = imageHostPatterns.some(pattern => lowerUrl.includes(pattern));
    
    console.log(`Image URL check for ${url}: extension=${hasImageExtension}, host=${hasImageHost}`);
    
    return hasImageExtension || hasImageHost;
  };

  const generateMediaTitle = (columnName: string, type: 'photo' | 'floorplan', index: number): string => {
    const cleanName = columnName.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
    return `${cleanName} ${index + 1}`.replace(/\s+/g, ' ');
  };

  const downloadAndSaveMedia = async (propertyId: string, mediaItems: MediaItem[]): Promise<{ success: number; failed: number; errors: string[] }> => {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    for (const media of mediaItems) {
      try {
        // Download the file
        const response = await fetch(media.url);
        if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);
        
        const blob = await response.blob();
        const fileName = `${Date.now()}-${media.title?.replace(/[^a-zA-Z0-9]/g, '_')}.${getFileExtension(media.url)}`;
        const filePath = `${propertyId}/${media.type === 'floorplan' ? 'floorplans' : 'photos'}/${fileName}`;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('property-photos')
          .upload(filePath, blob);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('property-photos')
          .getPublicUrl(filePath);
        
        // Save to property_media table
        const { error: dbError } = await supabase
          .from('property_media')
          .insert({
            property_id: propertyId,
            url: publicUrl,
            media_type: media.type,
            title: media.title,
            sort_order: results.success,
          });
        
        if (dbError) throw dbError;
        
        results.success++;
        
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${media.title}: ${error.message}`);
      }
    }
    
    return results;
  };

  const getFileExtension = (url: string): string => {
    const path = new URL(url).pathname;
    const extension = path.split('.').pop()?.toLowerCase();
    return extension || 'jpg';
  };

  const downloadTemplate = () => {
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
      'House Rules': 'No smoking, no pets'
    }];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Properties Template");
    XLSX.writeFile(wb, "leasy_properties_template.xlsx");
    
    toast({
      title: "✨ Template Downloaded",
      description: "Use this template to ensure your data is formatted correctly.",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          toast({
            title: "File Error",
            description: "The file appears to be empty or has no data rows.",
            variant: "destructive",
          });
          return;
        }

        // Process headers and data
        const rawHeaders = jsonData[0] as string[];
        const dataRows = jsonData.slice(1) as any[][];
        
        // Map headers to our field names
        const mappedData = dataRows.map(row => {
          const mappedRow: Partial<PropertyRow> = {};
          
          rawHeaders.forEach((header, index) => {
            const normalizedHeader = header.toLowerCase().replace(/\s+/g, '_');
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

        setUploadedData(mappedData);
        validateData(mappedData);
        
        // Detect media URLs and show summary
        const mediaDetection = detectMediaUrls(mappedData);
        const totalPhotos = mediaDetection.reduce((sum, item) => sum + item.mediaItems.filter(m => m.type === 'photo').length, 0);
        const totalFloorplans = mediaDetection.reduce((sum, item) => sum + item.mediaItems.filter(m => m.type === 'floorplan').length, 0);
        
        if (totalPhotos > 0 || totalFloorplans > 0) {
          toast({
            title: "📸 Media URLs Detected",
            description: `Found ${totalPhotos} photo URLs and ${totalFloorplans} floorplan URLs. These will be automatically downloaded during upload!`,
            variant: "default",
          });
        }
        
        setActiveTab("review");
        
      } catch (error) {
        toast({
          title: "File Error",
          description: "Failed to read the uploaded file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateData = (data: PropertyRow[]) => {
    const errors: ValidationError[] = [];
    const missingFields = new Set<string>();
    const groupedErrors: { [field: string]: number } = {};

    data.forEach((row, index) => {
      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field as keyof PropertyRow] || row[field as keyof PropertyRow] === '') {
          missingFields.add(field);
          errors.push({
            row: index + 1,
            field,
            message: `${field} is required`,
            value: row[field as keyof PropertyRow],
            severity: 'error'
          });
          groupedErrors[field] = (groupedErrors[field] || 0) + 1;
        }
      });

      // Check description
      if (!row.description || row.description.trim() === '') {
        errors.push({
          row: index + 1,
          field: 'description',
          message: 'This property has no description - will import anyway',
          severity: 'warning'
        });
      }
    });

    const errorCount = errors.filter(e => e.severity === 'error').length;
    const warningCount = errors.filter(e => e.severity === 'warning').length;
    
    setValidationSummary({
      totalRows: data.length,
      validRows: data.length - errors.filter(e => e.severity === 'error').map(e => e.row).filter((row, index, arr) => arr.indexOf(row) === index).length,
      errorRows: errors.filter(e => e.severity === 'error').map(e => e.row).filter((row, index, arr) => arr.indexOf(row) === index).length,
      warningRows: errors.filter(e => e.severity === 'warning').map(e => e.row).filter((row, index, arr) => arr.indexOf(row) === index).length,
      missingFields: Array.from(missingFields),
      groupedErrors
    });

    setValidationErrors(errors);
  };

  const handleBulkUpload = async () => {
    if (!user) return;
    
    const errorCount = validationErrors.filter(e => e.severity === 'error').length;
    if (errorCount > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix all validation errors before uploading. Warnings are okay and won't block the upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const mediaDetection = detectMediaUrls(uploadedData);
    const results: UploadResult = { success: 0, failed: 0, errors: [] };
    let mediaResults = { photos: 0, floorplans: 0, failed: 0 };

    try {
      for (let i = 0; i < uploadedData.length; i++) {
        const property = uploadedData[i];
        
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
          
          const propertyId = insertedProperty.id;
          results.success++;
          
          // Download and save media for this property
          const propertyMedia = mediaDetection.find(m => m.propertyIndex === i);
          if (propertyMedia && propertyMedia.mediaItems.length > 0) {
            const downloadResults = await downloadAndSaveMedia(propertyId, propertyMedia.mediaItems);
            
            propertyMedia.mediaItems.forEach(item => {
              if (item.type === 'photo') mediaResults.photos++;
              if (item.type === 'floorplan') mediaResults.floorplans++;
            });
            
            mediaResults.failed += downloadResults.failed;
          }
          
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            field: 'general',
            message: error.message || 'Failed to create property',
            severity: 'error'
          });
        }

        setUploadProgress(((i + 1) / uploadedData.length) * 100);
      }

      setUploadResult(results);
      
      if (results.success > 0) {
        const mediaMessage = mediaResults.photos > 0 || mediaResults.floorplans > 0
          ? ` • Downloaded ${mediaResults.photos} photos and ${mediaResults.floorplans} floorplans${mediaResults.failed > 0 ? ` (${mediaResults.failed} media failed)` : ''}`
          : '';
        
        toast({
          title: "🎉 Upload Complete",
          description: `Successfully uploaded ${results.success} properties${results.failed > 0 ? ` (${results.failed} failed)` : ''}${mediaMessage}`,
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }

      setActiveTab("results");
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "An unexpected error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

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
    setUploadProgress(0);
    setManualProperties([{}]);
    setActiveTab("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetModal(); } }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Properties</DialogTitle>
          <DialogDescription>
            Upload multiple properties at once using CSV/Excel files or manual entry.
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
                  Upload a CSV or Excel file containing property data. Download the template to see the required format.
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
                    <p className="text-muted-foreground mt-2">Supports CSV, XLS, and XLSX files</p>
                  </Label>
                  <Input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
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
                  Review the uploaded data before creating properties.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {validationSummary && (
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{validationSummary.totalRows}</div>
                        <div className="text-xs text-muted-foreground">Total Rows</div>
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
                    </div>

                    {validationErrors.filter(e => e.severity === 'error').length === 0 && (
                      <Button onClick={handleBulkUpload} disabled={isUploading}>
                        {isUploading ? 'Uploading...' : `Upload ${validationSummary?.validRows || uploadedData.length} Valid Properties`}
                      </Button>
                    )}
                  </div>
                )}

                {isUploading && (
                  <div>
                    <Progress value={uploadProgress} className="mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Uploading properties... {Math.round(uploadProgress)}%
                    </p>
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
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{uploadResult.success}</div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{uploadResult.failed}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                  </div>
                  
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