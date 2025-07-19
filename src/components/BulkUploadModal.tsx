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

interface ColumnMapping {
  csvHeader: string;
  dbField: string;
  isRequired: boolean;
  mapped: boolean;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: ValidationError[];
}

const requiredFields = [
  'title', 'apartment_type', 'category', 'street_name', 'city'
];

// Enhanced field mappings with common aliases
const fieldMappings = {
  'Property Title': 'title',
  'Title': 'title',
  'Name': 'title',
  'Property Name': 'title',
  'Description': 'description',
  'Property Description': 'description',
  'Details': 'description',
  'Apartment Type': 'apartment_type',
  'Type': 'apartment_type',
  'Property Type': 'apartment_type',
  'Unit Type': 'apartment_type',
  'Category': 'category',
  'Rental Category': 'category',
  'Listing Type': 'category',
  'Street Number': 'street_number',
  'House Number': 'street_number',
  'Number': 'street_number',
  'Street Name': 'street_name',
  'Street': 'street_name',
  'Address': 'street_name',
  'Road': 'street_name',
  'City': 'city',
  'Location': 'city',
  'Town': 'city',
  'Region/State': 'region',
  'Region': 'region',
  'State': 'region',
  'Province': 'region',
  'ZIP Code': 'zip_code',
  'Postal Code': 'zip_code',
  'Postcode': 'zip_code',
  'ZIP': 'zip_code',
  'Country': 'country',
  'Monthly Rent': 'monthly_rent',
  'Rent': 'monthly_rent',
  'Monthly Rate': 'monthly_rent',
  'Price': 'monthly_rent',
  'Weekly Rate': 'weekly_rate',
  'Weekly Rent': 'weekly_rate',
  'Weekly Price': 'weekly_rate',
  'Daily Rate': 'daily_rate',
  'Daily Rent': 'daily_rate',
  'Daily Price': 'daily_rate',
  'Bedrooms': 'bedrooms',
  'Beds': 'bedrooms',
  'Bedroom Count': 'bedrooms',
  'Bathrooms': 'bathrooms',
  'Baths': 'bathrooms',
  'Bathroom Count': 'bathrooms',
  'Max Guests': 'max_guests',
  'Guests': 'max_guests',
  'Capacity': 'max_guests',
  'Maximum Guests': 'max_guests',
  'Square Meters': 'square_meters',
  'Size': 'square_meters',
  'Area': 'square_meters',
  'Square Metres': 'square_meters',
  'Check-in Time': 'checkin_time',
  'Checkin': 'checkin_time',
  'Check In': 'checkin_time',
  'Check-out Time': 'checkout_time',
  'Checkout': 'checkout_time',
  'Check Out': 'checkout_time',
  'Provides WGSB': 'provides_wgsb',
  'WGSB': 'provides_wgsb',
  'House Rules': 'house_rules',
  'Rules': 'house_rules',
  'Property Rules': 'house_rules'
};

export const BulkUploadModal = ({ isOpen, onClose, onSuccess }: BulkUploadModalProps) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedData, setUploadedData] = useState<PropertyRow[]>([]);
  const [originalHeaders, setOriginalHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [manualProperties, setManualProperties] = useState<Partial<PropertyRow>[]>([{}]);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const downloadTemplate = () => {
    const templateData = [{
      'Property Title': 'Stylish Studio in Mitte',
      'Description': 'Beautiful modern studio apartment in the heart of Berlin',
      'Apartment Type': 'studio',
      'Category': 'short_term',
      'Street Number': '15',
      'Street Name': 'Weinbergsweg',
      'City': 'Berlin',
      'Region/State': 'Berlin',
      'ZIP Code': '10119',
      'Country': 'Germany',
      'Monthly Rent': 1200,
      'Weekly Rate': 350,
      'Daily Rate': 80,
      'Bedrooms': 0,
      'Bathrooms': 1,
      'Max Guests': 2,
      'Square Meters': 35,
      'Check-in Time': '15:00',
      'Check-out Time': '11:00',
      'Provides WGSB': 'false',
      'House Rules': 'No smoking, no pets'
    }];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Properties Template");
    XLSX.writeFile(wb, "leasy_properties_template.xlsx");
    
    toast({
      title: "Template Downloaded",
      description: "Use this template to ensure your data is formatted correctly.",
    });
  };

  const autoMapHeaders = (headers: string[]): ColumnMapping[] => {
    return headers.map(header => {
      const dbField = fieldMappings[header as keyof typeof fieldMappings];
      return {
        csvHeader: header,
        dbField: dbField || '',
        isRequired: requiredFields.includes(dbField || ''),
        mapped: !!dbField
      };
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Extract headers from first row
        const rawHeaders = Object.keys(jsonData[0] || {});

        // Auto-map headers using fuzzy matching
        const autoMappedHeaders = autoMapHeaders(rawHeaders);
        
        // Map the data to our property structure with auto-mapping
        const mappedData = jsonData.map((row: any) => {
          const mappedRow: Partial<PropertyRow> = {};
          
          // Use auto-mapped headers to find correct fields
          autoMappedHeaders.forEach((mapping) => {
            const { csvHeader, dbField, mapped } = mapping;
            if (row[csvHeader] !== undefined && mapped && dbField) {
              let value = row[csvHeader];
              
              // Handle boolean fields
              if (dbField === 'provides_wgsb') {
                value = value === 'true' || value === true || value === 1;
              }
              
              // Handle numeric fields
              if (['monthly_rent', 'weekly_rate', 'daily_rate', 'bedrooms', 'bathrooms', 'max_guests', 'square_meters'].includes(dbField)) {
                value = Number(value) || 0;
              }
              
              (mappedRow as any)[dbField] = value;
            }
          });
          
          // Set defaults
          mappedRow.country = mappedRow.country || 'Germany';
          mappedRow.provides_wgsb = mappedRow.provides_wgsb || false;
          
          return mappedRow as PropertyRow;
        });

        setUploadedData(mappedData);
        setOriginalHeaders(rawHeaders);
        setColumnMappings(autoMappedHeaders);
        validateData(mappedData);
        setActiveTab("review");
        
        // Show success message if auto-mapping worked
        const mappedCount = autoMappedHeaders.filter(mapping => mapping.mapped).length;
        const totalHeaders = rawHeaders.length;
        
        if (mappedCount > 0) {
          toast({
            title: "Auto-fix Applied",
            description: `Automatically mapped ${mappedCount}/${totalHeaders} columns. Check the preview to verify.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Headers not recognized",
            description: `Could not auto-map your headers: ${rawHeaders.join(', ')}. Download template for correct format.`,
            variant: "destructive",
          });
        }
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
      requiredFields.forEach(field => {
        if (!row[field as keyof PropertyRow] || row[field as keyof PropertyRow] === '') {
          errors.push({
            row: index + 1,
            field,
            message: `${field.replace('_', ' ')} is required`,
            severity: 'error'
          });
          missingFields.add(field);
          groupedErrors[field] = (groupedErrors[field] || 0) + 1;
        }
      });

      // Additional validations
      if (row.monthly_rent && row.monthly_rent < 0) {
        errors.push({
          row: index + 1,
          field: 'monthly_rent',
          message: 'Monthly rent cannot be negative',
          severity: 'error'
        });
        groupedErrors['monthly_rent'] = (groupedErrors['monthly_rent'] || 0) + 1;
      }

      if (row.bedrooms && row.bedrooms < 0) {
        errors.push({
          row: index + 1,
          field: 'bedrooms',
          message: 'Bedrooms cannot be negative',
          severity: 'error'
        });
        groupedErrors['bedrooms'] = (groupedErrors['bedrooms'] || 0) + 1;
      }

      if (row.bathrooms && row.bathrooms < 0) {
        errors.push({
          row: index + 1,
          field: 'bathrooms',
          message: 'Bathrooms cannot be negative',
          severity: 'error'
        });
        groupedErrors['bathrooms'] = (groupedErrors['bathrooms'] || 0) + 1;
      }

      // Add warnings for common issues
      if (!row.description || row.description.length < 10) {
        errors.push({
          row: index + 1,
          field: 'description',
          message: 'Consider adding a more detailed description',
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

  const updatePropertyField = (rowIndex: number, field: string, value: any) => {
    const updatedData = [...uploadedData];
    (updatedData[rowIndex] as any)[field] = value;
    setUploadedData(updatedData);
    
    // Re-validate after change
    validateData(updatedData);
  };

  const handleBulkUpload = async () => {
    if (!user) return;
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix all validation errors before uploading.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const results: UploadResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      for (let i = 0; i < uploadedData.length; i++) {
        const property = uploadedData[i];
        
        try {
          const { error } = await supabase
            .from('properties')
            .insert({
              ...property,
              user_id: user.id,
              status: 'draft'
            });

          if (error) throw error;
          results.success++;
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
        toast({
          title: "Upload Complete",
          description: `Successfully uploaded ${results.success} properties${results.failed > 0 ? ` (${results.failed} failed)` : ''}.`,
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

  const handleManualUpload = async () => {
    if (!user) return;

    const validProperties = manualProperties.filter(p => 
      p.title && p.apartment_type && p.category && p.street_name && p.city
    );

    if (validProperties.length === 0) {
      toast({
        title: "No Valid Properties",
        description: "Please fill in at least one complete property.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const propertiesToInsert = validProperties.map(property => ({
        title: property.title!,
        description: property.description || '',
        apartment_type: property.apartment_type || '',
        category: property.category || '',
        street_number: property.street_number || '',
        street_name: property.street_name!,
        city: property.city!,
        region: property.region || '',
        zip_code: property.zip_code || '',
        country: property.country || 'Germany',
        monthly_rent: property.monthly_rent || 0,
        weekly_rate: property.weekly_rate || 0,
        daily_rate: property.daily_rate || 0,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        max_guests: property.max_guests || 0,
        square_meters: property.square_meters || 0,
        checkin_time: property.checkin_time || '',
        checkout_time: property.checkout_time || '',
        provides_wgsb: property.provides_wgsb || false,
        house_rules: property.house_rules || '',
        user_id: user.id,
        status: 'draft'
      }));

      const { error } = await supabase
        .from('properties')
        .insert(propertiesToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully created ${validProperties.length} properties.`,
      });

      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to create properties.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
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
              <CardContent className="space-y-6">
                {manualProperties.map((property, index) => (
                  <Card key={index} className="relative">
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

                <div className="flex justify-end">
                  <Button 
                    onClick={handleManualUpload} 
                    disabled={isUploading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {isUploading ? 'Creating Properties...' : 'Create Properties'}
                  </Button>
                </div>
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
                {/* Enhanced Validation Summary */}
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
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{validationSummary.warningRows}</div>
                        <div className="text-xs text-muted-foreground">Warnings</div>
                      </div>
                    </div>

                    {validationSummary.missingFields.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Missing required fields in {validationSummary.errorRows} rows:</strong>
                          <br />
                          {validationSummary.missingFields.map(field => (
                            <Badge key={field} variant="destructive" className="mr-1 mt-1">
                              {field.replace('_', ' ')} ({validationSummary.groupedErrors[field]} rows)
                            </Badge>
                          ))}
                          <br />
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={downloadTemplate}
                            className="p-0 h-auto mt-2"
                          >
                            Download template to fix format issues
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p>Found {uploadedData.length} properties to upload</p>
                    {validationErrors.filter(e => e.severity === 'error').length === 0 && (
                      <Button onClick={handleBulkUpload} disabled={isUploading}>
                        {isUploading ? 'Uploading...' : `Upload ${validationSummary?.validRows || uploadedData.length} Valid Properties`}
                      </Button>
                    )}
                  </div>

                  {isUploading && (
                    <div>
                      <Progress value={uploadProgress} className="mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Uploading properties... {Math.round(uploadProgress)}%
                      </p>
                    </div>
                  )}

                  {/* Enhanced Error Display with Inline Editing */}
                  {validationErrors.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 p-3 border-b">
                        <h4 className="font-medium flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Validation Issues ({validationErrors.length})
                        </h4>
                      </div>
                      <ScrollArea className="h-60">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row</TableHead>
                              <TableHead>Field</TableHead>
                              <TableHead>Issue</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {validationErrors.slice(0, 50).map((error, index) => (
                              <TableRow key={index}>
                                <TableCell>{error.row}</TableCell>
                                <TableCell>
                                  <Badge variant={error.severity === 'error' ? 'destructive' : 'secondary'}>
                                    {error.field.replace('_', ' ')}
                                  </Badge>
                                </TableCell>
                                <TableCell className={error.severity === 'error' ? 'text-destructive' : 'text-yellow-600'}>
                                  {error.message}
                                </TableCell>
                                <TableCell>
                                   {editingRowIndex === error.row - 1 ? (
                                     <Input
                                       className="h-8 text-sm"
                                       value={(() => {
                                         const val = uploadedData[error.row - 1]?.[error.field as keyof PropertyRow];
                                         return val === null || val === undefined ? '' : String(val);
                                       })()}
                                       onChange={(e) => {
                                         let value: any = e.target.value;
                                         
                                         // Convert values based on field type
                                         if (error.field === 'provides_wgsb') {
                                           value = value === 'true' || value === '1' || value === 'yes';
                                         } else if (['monthly_rent', 'weekly_rate', 'daily_rate', 'bedrooms', 'bathrooms', 'max_guests', 'square_meters'].includes(error.field)) {
                                           value = value === '' ? 0 : Number(value);
                                         }
                                         
                                         updatePropertyField(error.row - 1, error.field, value);
                                       }}
                                       onBlur={() => setEditingRowIndex(null)}
                                       autoFocus
                                     />
                                  ) : (
                                    <span className="text-muted-foreground">
                                      {String(uploadedData[error.row - 1]?.[error.field as keyof PropertyRow] || 'empty')}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                   {error.severity === 'error' && (
                                     <Button
                                       className="h-8 w-8 p-0"
                                       variant="ghost"
                                       onClick={() => setEditingRowIndex(error.row - 1)}
                                     >
                                      <Edit3 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                      {validationErrors.length > 50 && (
                        <div className="p-3 bg-muted/50 text-sm text-muted-foreground text-center">
                          Showing first 50 of {validationErrors.length} issues
                        </div>
                      )}
                    </div>
                  )}

                  {/* Property Preview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {uploadedData.slice(0, 10).map((property, index) => {
                      const hasErrors = validationErrors.some(e => e.row === index + 1 && e.severity === 'error');
                      return (
                        <Card key={index} className={`p-4 ${hasErrors ? 'border-destructive' : ''}`}>
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium">{property.title || 'Untitled Property'}</h4>
                              {hasErrors && <XCircle className="h-4 w-4 text-destructive mt-1" />}
                            </div>
                            <p className="text-sm text-muted-foreground">{property.city || 'No city'}</p>
                            <div className="flex gap-1">
                              <Badge variant="outline">{property.category || 'No category'}</Badge>
                              {property.apartment_type && (
                                <Badge variant="secondary">{property.apartment_type}</Badge>
                              )}
                            </div>
                            {property.monthly_rent && (
                              <p className="text-sm font-medium">€{property.monthly_rent}/month</p>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {uploadedData.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center">
                      And {uploadedData.length - 10} more properties...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {uploadResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Upload Complete
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{uploadResult.success}</div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{uploadResult.failed}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                  </div>

                  {uploadResult.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Failed Properties:</h4>
                      <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                        {uploadResult.errors.map((error, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-destructive mb-1">
                            <XCircle className="h-4 w-4" />
                            Row {error.row}: {error.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-6">
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