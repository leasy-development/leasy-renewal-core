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
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Trash2
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
}

interface UploadResult {
  success: number;
  failed: number;
  errors: ValidationError[];
}

const requiredFields = [
  'title', 'apartment_type', 'category', 'street_name', 'city'
];

const fieldMappings = {
  'Property Title': 'title',
  'Description': 'description',
  'Apartment Type': 'apartment_type',
  'Category': 'category',
  'Street Number': 'street_number',
  'Street Name': 'street_name',
  'City': 'city',
  'Region/State': 'region',
  'ZIP Code': 'zip_code',
  'Country': 'country',
  'Monthly Rent': 'monthly_rent',
  'Weekly Rate': 'weekly_rate',
  'Daily Rate': 'daily_rate',
  'Bedrooms': 'bedrooms',
  'Bathrooms': 'bathrooms',
  'Max Guests': 'max_guests',
  'Square Meters': 'square_meters',
  'Check-in Time': 'checkin_time',
  'Check-out Time': 'checkout_time',
  'Provides WGSB': 'provides_wgsb',
  'House Rules': 'house_rules'
};

export const BulkUploadModal = ({ isOpen, onClose, onSuccess }: BulkUploadModalProps) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedData, setUploadedData] = useState<PropertyRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [manualProperties, setManualProperties] = useState<Partial<PropertyRow>[]>([{}]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const downloadTemplate = () => {
    const templateData = [{
      'Property Title': 'Sample Apartment',
      'Description': 'Beautiful apartment in city center',
      'Apartment Type': 'apartment',
      'Category': 'long_term',
      'Street Number': '123',
      'Street Name': 'Main Street',
      'City': 'Berlin',
      'Region/State': 'Berlin',
      'ZIP Code': '10115',
      'Country': 'Germany',
      'Monthly Rent': 1200,
      'Weekly Rate': 350,
      'Daily Rate': 80,
      'Bedrooms': 2,
      'Bathrooms': 1,
      'Max Guests': 4,
      'Square Meters': 75,
      'Check-in Time': '15:00',
      'Check-out Time': '11:00',
      'Provides WGSB': 'false',
      'House Rules': 'No smoking, no pets'
    }];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Properties Template");
    XLSX.writeFile(wb, "properties_template.xlsx");
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

        // Map the data to our property structure
        const mappedData = jsonData.map((row: any) => {
          const mappedRow: Partial<PropertyRow> = {};
          Object.entries(fieldMappings).forEach(([excelField, dbField]) => {
            if (row[excelField] !== undefined) {
              let value = row[excelField];
              
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
        validateData(mappedData);
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
    
    data.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field as keyof PropertyRow] || row[field as keyof PropertyRow] === '') {
          errors.push({
            row: index + 1,
            field,
            message: `${field} is required`
          });
        }
      });

      // Additional validations
      if (row.monthly_rent && row.monthly_rent < 0) {
        errors.push({
          row: index + 1,
          field: 'monthly_rent',
          message: 'Monthly rent cannot be negative'
        });
      }

      if (row.bedrooms && row.bedrooms < 0) {
        errors.push({
          row: index + 1,
          field: 'bedrooms',
          message: 'Bedrooms cannot be negative'
        });
      }

      if (row.bathrooms && row.bathrooms < 0) {
        errors.push({
          row: index + 1,
          field: 'bathrooms',
          message: 'Bathrooms cannot be negative'
        });
      }
    });

    setValidationErrors(errors);
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
            message: error.message || 'Failed to create property'
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
                {validationErrors.length > 0 && (
                  <Alert className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Found {validationErrors.length} validation errors. Please fix these issues before uploading.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p>Found {uploadedData.length} properties to upload</p>
                    {validationErrors.length === 0 && (
                      <Button onClick={handleBulkUpload} disabled={isUploading}>
                        {isUploading ? 'Uploading...' : 'Upload All Properties'}
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

                  {validationErrors.length > 0 && (
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                      <h4 className="font-medium mb-2">Validation Errors:</h4>
                      {validationErrors.map((error, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-destructive mb-1">
                          <XCircle className="h-4 w-4" />
                          Row {error.row}: {error.message}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {uploadedData.slice(0, 10).map((property, index) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">{property.title}</h4>
                          <p className="text-sm text-muted-foreground">{property.city}</p>
                          <Badge variant="outline">{property.category}</Badge>
                        </div>
                      </Card>
                    ))}
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