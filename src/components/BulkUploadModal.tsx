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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
  AlertTriangle,
  Settings,
  Shield,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { DuplicateDetectionModal } from "@/components/DuplicateDetectionModal";
import { duplicateDetectionService, DuplicateDetectionConfig, PropertyForDetection, DuplicateMatch } from "@/lib/duplicateDetection";
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
  [key: string]: any; // Allow additional properties for media URLs
}

interface MediaItem {
  url: string;
  type: 'photo' | 'floorplan';
  title?: string;
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

interface HeaderFix {
  original: string;
  fixed: string;
  method: 'exact' | 'alias' | 'normalized' | 'fuzzy';
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

// Enhanced header aliases with typo corrections  
const HEADER_ALIASES: Record<string, string> = {
  // Common typos
  'adress_street': 'street_name',
  'adress_postcode': 'zip_code', 
  'adress_street_no': 'street_number',
  'adress_city_part': 'region',
  'living_rooms': 'bedrooms',
  'city_name': 'city',
  'room_count': 'bedrooms',
  'bedroom_count': 'bedrooms',
  'bathroom_count': 'bathrooms',
  'street_no': 'street_number',
  'address_number': 'street_number',
  'appartment_type': 'apartment_type',
  'appartement_type': 'apartment_type',
  'property_titel': 'title',
  'property_tittle': 'title',
  'propery_type': 'apartment_type',
  'descripton': 'description',
  'descriptin': 'description',
  
  // Use existing fieldMappings for common variations
  ...fieldMappings
};

// Normalize and smart-fix headers
const normalizeHeader = (header: string): string => {
  return header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w_]/g, '')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
};

// Simple string similarity calculation
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
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
  const [mediaProgress, setMediaProgress] = useState<{ downloaded: number; total: number; current: string }>({ downloaded: 0, total: 0, current: '' });
  const [downloadingMedia, setDownloadingMedia] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateResults, setDuplicateResults] = useState<{ property: PropertyForDetection; matches: DuplicateMatch[]; index: number }[]>([]);
  const [duplicateSettings, setDuplicateSettings] = useState<DuplicateDetectionConfig>(duplicateDetectionService.getConfig());
  const [enableDuplicateDetection, setEnableDuplicateDetection] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Media detection and auto-download functions
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
        setMediaProgress(prev => ({ ...prev, current: `Downloading ${media.title}...` }));
        
        // Download the file
        const response = await fetch(media.url);
        if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);
        
        const blob = await response.blob();
        const fileName = `${Date.now()}-${media.title.replace(/[^a-zA-Z0-9]/g, '_')}.${getFileExtension(media.url)}`;
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
        setMediaProgress(prev => ({ ...prev, downloaded: prev.downloaded + 1 }));
        
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

  // Enhanced postal code to city mapping (German cities)
  const POSTAL_CODE_CITIES: { [key: string]: string } = {
    // Berlin (expanded coverage)
     '10115': 'Berlin', '10117': 'Berlin', '10119': 'Berlin', '10178': 'Berlin', '10179': 'Berlin',
     '10243': 'Berlin', '10245': 'Berlin', '10247': 'Berlin', '10249': 'Berlin', '10318': 'Berlin',
     '10319': 'Berlin', '10365': 'Berlin', '10367': 'Berlin', '10369': 'Berlin', '10405': 'Berlin',
     '10407': 'Berlin', '10409': 'Berlin', '10435': 'Berlin', '10437': 'Berlin', '10439': 'Berlin',
     '10551': 'Berlin', '10553': 'Berlin', '10555': 'Berlin', '10557': 'Berlin', '10559': 'Berlin',
     '10585': 'Berlin', '10587': 'Berlin', '10589': 'Berlin', '10623': 'Berlin', '10625': 'Berlin',
     '10627': 'Berlin', '10629': 'Berlin', '10707': 'Berlin', '10709': 'Berlin', '10711': 'Berlin',
     '10713': 'Berlin', '10715': 'Berlin', '10717': 'Berlin', '10719': 'Berlin', '10777': 'Berlin',
     '10779': 'Berlin', '10781': 'Berlin', '10783': 'Berlin', '10785': 'Berlin', '10787': 'Berlin',
     '10789': 'Berlin', '10823': 'Berlin', '10825': 'Berlin', '10827': 'Berlin', '10829': 'Berlin',
    '10975': 'Berlin', '10977': 'Berlin', '10999': 'Berlin', '12043': 'Berlin', '12045': 'Berlin',
    '12047': 'Berlin', '12049': 'Berlin', '12051': 'Berlin', '12053': 'Berlin', '12055': 'Berlin',
    '12057': 'Berlin', '12059': 'Berlin', '12099': 'Berlin', '12101': 'Berlin', '12103': 'Berlin',
    '12105': 'Berlin', '12107': 'Berlin', '12109': 'Berlin', '12157': 'Berlin', '12159': 'Berlin',
    '12161': 'Berlin', '12163': 'Berlin', '12165': 'Berlin', '12167': 'Berlin', '12169': 'Berlin',
    '12203': 'Berlin', '12205': 'Berlin', '12207': 'Berlin', '12209': 'Berlin', '12247': 'Berlin',
    '12249': 'Berlin', '12277': 'Berlin', '12279': 'Berlin', '12305': 'Berlin', '12307': 'Berlin',
    '12309': 'Berlin', '12347': 'Berlin', '12349': 'Berlin', '12351': 'Berlin', '12353': 'Berlin',
    '12355': 'Berlin', '12357': 'Berlin', '12359': 'Berlin', '12435': 'Berlin', '12437': 'Berlin',
    '12439': 'Berlin', '12459': 'Berlin', '12487': 'Berlin', '12489': 'Berlin', '12524': 'Berlin',
    '12526': 'Berlin', '12527': 'Berlin', '12555': 'Berlin', '12557': 'Berlin', '12559': 'Berlin',
    '12587': 'Berlin', '12589': 'Berlin', '12619': 'Berlin', '12621': 'Berlin', '12623': 'Berlin',
    '12625': 'Berlin', '12627': 'Berlin', '12629': 'Berlin', '12679': 'Berlin', '12681': 'Berlin',
    '12683': 'Berlin', '12685': 'Berlin', '12687': 'Berlin', '12689': 'Berlin', '13051': 'Berlin',
    '13053': 'Berlin', '13055': 'Berlin', '13057': 'Berlin', '13059': 'Berlin', '13086': 'Berlin',
    '13088': 'Berlin', '13089': 'Berlin', '13125': 'Berlin', '13127': 'Berlin', '13129': 'Berlin',
    '13156': 'Berlin', '13158': 'Berlin', '13159': 'Berlin', '13187': 'Berlin', '13189': 'Berlin',
    '13347': 'Berlin', '13349': 'Berlin', '13351': 'Berlin', '13353': 'Berlin', '13355': 'Berlin',
    '13357': 'Berlin', '13359': 'Berlin', '13403': 'Berlin', '13405': 'Berlin', '13407': 'Berlin',
    '13409': 'Berlin', '13435': 'Berlin', '13437': 'Berlin', '13439': 'Berlin', '13465': 'Berlin',
    '13467': 'Berlin', '13469': 'Berlin', '13503': 'Berlin', '13505': 'Berlin', '13507': 'Berlin',
    '13509': 'Berlin', '13581': 'Berlin', '13583': 'Berlin', '13585': 'Berlin', '13587': 'Berlin',
    '13589': 'Berlin', '13591': 'Berlin', '13593': 'Berlin', '13595': 'Berlin', '13597': 'Berlin',
    '13599': 'Berlin', '13627': 'Berlin', '13629': 'Berlin', '13707': 'Berlin', '13709': 'Berlin',
    '14050': 'Berlin', '14052': 'Berlin', '14053': 'Berlin', '14055': 'Berlin',
    '14057': 'Berlin', '14059': 'Berlin', '14109': 'Berlin', '14129': 'Berlin', '14163': 'Berlin',
    '14165': 'Berlin', '14167': 'Berlin', '14169': 'Berlin', '14193': 'Berlin', '14195': 'Berlin',
    '14197': 'Berlin', '14199': 'Berlin',
    
     // Munich (complete coverage 80331-85540)
     '80331': 'Munich', '80333': 'Munich', '80335': 'Munich', '80336': 'Munich', '80337': 'Munich',
     '80339': 'Munich', '80469': 'Munich', '80538': 'Munich', '80539': 'Munich', '80634': 'Munich',
     '80636': 'Munich', '80637': 'Munich', '80638': 'Munich', '80639': 'Munich', '80686': 'Munich',
     '80687': 'Munich', '80689': 'Munich', '80796': 'Munich', '80797': 'Munich', '80798': 'Munich',
     '80799': 'Munich', '80801': 'Munich', '80802': 'Munich', '80803': 'Munich', '80804': 'Munich',
     '80805': 'Munich', '80807': 'Munich', '80809': 'Munich', '80992': 'Munich', '80993': 'Munich',
     '80995': 'Munich', '80997': 'Munich', '80999': 'Munich', '81241': 'Munich', '81243': 'Munich',
     '81245': 'Munich', '81247': 'Munich', '81249': 'Munich', '81369': 'Munich', '81371': 'Munich',
     '81373': 'Munich', '81375': 'Munich', '81377': 'Munich', '81379': 'Munich', '81475': 'Munich',
     '81476': 'Munich', '81477': 'Munich', '81479': 'Munich', '81539': 'Munich', '81541': 'Munich',
     '81543': 'Munich', '81545': 'Munich', '81547': 'Munich', '81549': 'Munich', '81667': 'Munich',
     '81669': 'Munich', '81671': 'Munich', '81673': 'Munich', '81675': 'Munich', '81677': 'Munich',
     '81679': 'Munich', '81735': 'Munich', '81737': 'Munich', '81739': 'Munich', '81825': 'Munich',
     '81827': 'Munich', '81829': 'Munich', '81925': 'Munich', '81927': 'Munich', '81929': 'Munich',
     '85356': 'Munich', '85540': 'Munich',
    
    // Hamburg
    '20095': 'Hamburg', '20097': 'Hamburg', '20099': 'Hamburg', '20144': 'Hamburg', '20146': 'Hamburg',
    '20148': 'Hamburg', '20149': 'Hamburg', '20251': 'Hamburg', '20253': 'Hamburg', '20255': 'Hamburg',
    '20257': 'Hamburg', '20259': 'Hamburg', '20354': 'Hamburg', '20355': 'Hamburg', '20357': 'Hamburg',
    '20359': 'Hamburg', '20457': 'Hamburg', '20459': 'Hamburg', '20535': 'Hamburg', '20537': 'Hamburg',
    '20539': 'Hamburg', '21029': 'Hamburg', '21031': 'Hamburg', '21033': 'Hamburg', '21035': 'Hamburg',
    '21037': 'Hamburg', '21039': 'Hamburg', '21073': 'Hamburg', '21075': 'Hamburg', '21077': 'Hamburg',
    '21079': 'Hamburg', '21107': 'Hamburg', '21109': 'Hamburg', '21111': 'Hamburg', '21113': 'Hamburg',
    '21115': 'Hamburg', '21117': 'Hamburg', '21119': 'Hamburg', '21129': 'Hamburg', '21131': 'Hamburg',
    '21133': 'Hamburg', '21135': 'Hamburg', '21137': 'Hamburg', '21139': 'Hamburg', '21141': 'Hamburg',
    '21143': 'Hamburg', '21145': 'Hamburg', '21147': 'Hamburg', '21149': 'Hamburg',
    
    // Cologne
    '50667': 'Cologne', '50668': 'Cologne', '50670': 'Cologne', '50672': 'Cologne', '50674': 'Cologne',
    '50676': 'Cologne', '50677': 'Cologne', '50678': 'Cologne', '50679': 'Cologne', '50733': 'Cologne',
    '50735': 'Cologne', '50737': 'Cologne', '50739': 'Cologne', '50823': 'Cologne', '50825': 'Cologne',
    '50827': 'Cologne', '50829': 'Cologne', '50859': 'Cologne', '50931': 'Cologne', '50933': 'Cologne',
    '50935': 'Cologne', '50937': 'Cologne', '50939': 'Cologne', '50968': 'Cologne', '50969': 'Cologne',
    '50996': 'Cologne', '50997': 'Cologne', '50999': 'Cologne', '51061': 'Cologne', '51063': 'Cologne',
    '51065': 'Cologne', '51067': 'Cologne', '51069': 'Cologne', '51103': 'Cologne', '51105': 'Cologne',
    '51107': 'Cologne', '51109': 'Cologne', '51143': 'Cologne', '51145': 'Cologne', '51147': 'Cologne',
    '51149': 'Cologne',
    
     // Frankfurt (complete coverage 60306-60599 and 65929-65936)
     '60306': 'Frankfurt', '60308': 'Frankfurt', '60309': 'Frankfurt', '60311': 'Frankfurt', '60313': 'Frankfurt',
     '60314': 'Frankfurt', '60316': 'Frankfurt', '60318': 'Frankfurt', '60320': 'Frankfurt', '60322': 'Frankfurt',
     '60323': 'Frankfurt', '60325': 'Frankfurt', '60326': 'Frankfurt', '60327': 'Frankfurt', '60329': 'Frankfurt',
     '60385': 'Frankfurt', '60386': 'Frankfurt', '60388': 'Frankfurt', '60389': 'Frankfurt', '60431': 'Frankfurt',
     '60433': 'Frankfurt', '60435': 'Frankfurt', '60437': 'Frankfurt', '60439': 'Frankfurt', '60486': 'Frankfurt',
     '60487': 'Frankfurt', '60488': 'Frankfurt', '60489': 'Frankfurt', '60528': 'Frankfurt', '60529': 'Frankfurt',
     '60594': 'Frankfurt', '60596': 'Frankfurt', '60598': 'Frankfurt', '60599': 'Frankfurt', '65929': 'Frankfurt',
     '65931': 'Frankfurt', '65933': 'Frankfurt', '65934': 'Frankfurt', '65936': 'Frankfurt',
    
    // Stuttgart  
    '70173': 'Stuttgart', '70174': 'Stuttgart', '70176': 'Stuttgart', '70178': 'Stuttgart', '70180': 'Stuttgart',
    '70182': 'Stuttgart', '70184': 'Stuttgart', '70186': 'Stuttgart', '70188': 'Stuttgart', '70190': 'Stuttgart',
    '70191': 'Stuttgart', '70192': 'Stuttgart', '70193': 'Stuttgart', '70195': 'Stuttgart', '70197': 'Stuttgart',
    '70199': 'Stuttgart', '70327': 'Stuttgart', '70329': 'Stuttgart', '70372': 'Stuttgart', '70374': 'Stuttgart',
    '70376': 'Stuttgart', '70378': 'Stuttgart', '70435': 'Stuttgart', '70437': 'Stuttgart', '70439': 'Stuttgart',
    '70469': 'Stuttgart', '70499': 'Stuttgart', '70563': 'Stuttgart', '70565': 'Stuttgart', '70567': 'Stuttgart',
    '70569': 'Stuttgart', '70597': 'Stuttgart', '70599': 'Stuttgart', '70619': 'Stuttgart', '70629': 'Stuttgart',
    '70794': 'Stuttgart', '70806': 'Stuttgart', '70839': 'Stuttgart'
  };

  // Enhanced region-based city inference
  const inferCityFromRegion = (region: string): string | null => {
    if (!region) return null;
    
    const regionLower = region.toLowerCase();
    
    // Berlin districts
    if (['mitte', 'kreuzberg', 'friedrichshain', 'prenzlauer berg', 'charlottenburg', 'wilmersdorf', 
         'tempelhof', 'neukölln', 'treptow', 'köpenick', 'lichtenberg', 'marzahn', 'hellersdorf',
         'pankow', 'reinickendorf', 'spandau', 'steglitz', 'zehlendorf', 'wedding', 'moabit'].includes(regionLower)) {
      return 'Berlin';
    }
    
    // Munich districts
    if (['maxvorstadt', 'ludwigsvorstadt', 'isarvorstadt', 'au', 'haidhausen', 'bogenhausen',
         'schwabing', 'neuhausen', 'nymphenburg', 'laim', 'sendling', 'thalkirchen'].includes(regionLower)) {
      return 'Munich';
    }
    
    // Hamburg districts  
    if (['altona', 'eimsbüttel', 'harburg', 'wandsbek', 'bergedorf', 'nord', 'hamburg-mitte',
         'st. pauli', 'altstadt', 'neustadt', 'st. georg'].includes(regionLower)) {
      return 'Hamburg';
    }
    
    return null;
  };

  const inferApartmentType = (bedrooms: number, livingRooms: number = 0): string => {
    if (bedrooms === 0 && livingRooms === 1) return 'studio';
    if (bedrooms === 1 && livingRooms === 0) return 'studio';
    if (bedrooms === 1 && livingRooms >= 1) return '1 bedroom apartment';
    if (bedrooms === 2) return '2 bedroom apartment';
    if (bedrooms === 3) return '3 bedroom apartment';
    if (bedrooms > 3) return 'multi-bedroom apartment';
    return 'unknown';
  };

  const autoFillMissingValues = (data: PropertyRow[]): { data: PropertyRow[], autoFilled: string[] } => {
    const autoFilled: string[] = [];
    let cityFills = 0;
    let categoryFills = 0;
    let apartmentTypeFills = 0;

    const processedData = data.map(row => {
      const updatedRow = { ...row };

      // Auto-fill city with multiple strategies
      if (!updatedRow.city) {
        let inferredCity = null;
        
        // Strategy 1: Use postal code
        if (updatedRow.zip_code) {
          inferredCity = POSTAL_CODE_CITIES[updatedRow.zip_code];
        }
        
        // Strategy 2: Use region/district (fallback)
        if (!inferredCity && updatedRow.region) {
          inferredCity = inferCityFromRegion(updatedRow.region);
        }
        
        // Strategy 3: If we have "Kreuzberg" in region, that's definitely Berlin
        if (!inferredCity && updatedRow.region) {
          const regionLower = updatedRow.region.toLowerCase();
          if (regionLower.includes('kreuzberg') || regionLower.includes('berlin')) {
            inferredCity = 'Berlin';
          }
        }
        
        if (inferredCity) {
          updatedRow.city = inferredCity;
          cityFills++;
        }
      }

      // Default category to apartment
      if (!updatedRow.category) {
        updatedRow.category = 'apartment';
        categoryFills++;
      }

      // Infer apartment_type from bedrooms
      if (!updatedRow.apartment_type && updatedRow.bedrooms !== undefined) {
        const bedroomCount = parseInt(updatedRow.bedrooms?.toString() || '0');
        updatedRow.apartment_type = inferApartmentType(bedroomCount, 0);
        if (updatedRow.apartment_type !== 'unknown') {
          apartmentTypeFills++;
        }
      }

      return updatedRow;
    });

    // Build summary of auto-filled values
    if (cityFills > 0) autoFilled.push(`Added ${cityFills} cities based on postal codes and regions`);
    if (categoryFills > 0) autoFilled.push(`Set category to apartment for ${categoryFills} rows`);
    if (apartmentTypeFills > 0) autoFilled.push(`Inferred apartment type for ${apartmentTypeFills} rows`);

    return { data: processedData, autoFilled };
  };

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
      title: "✨ Template Downloaded",
      description: "Use this template to ensure your data is formatted correctly.",
    });
  };

  // Enhanced auto-fix headers with typo correction and fuzzy matching
  const autoFixHeaders = (headers: string[]): { fixes: HeaderFix[], unfixable: string[] } => {
    const fixes: HeaderFix[] = [];
    const unfixable: string[] = [];
    
    headers.forEach(header => {
      const trimmedHeader = header.trim();
      
      // 1. Check exact alias match
      if (HEADER_ALIASES[trimmedHeader]) {
        fixes.push({
          original: trimmedHeader,
          fixed: HEADER_ALIASES[trimmedHeader],
          method: 'exact'
        });
        return;
      }
      
      // 2. Check normalized version
      const normalized = normalizeHeader(trimmedHeader);
      if (HEADER_ALIASES[normalized]) {
        fixes.push({
          original: trimmedHeader,
          fixed: HEADER_ALIASES[normalized],
          method: 'normalized'
        });
        return;
      }
      
      // 3. Check case-insensitive match
      const aliasKey = Object.keys(HEADER_ALIASES).find(key => 
        key.toLowerCase() === trimmedHeader.toLowerCase()
      );
      if (aliasKey) {
        fixes.push({
          original: trimmedHeader,
          fixed: HEADER_ALIASES[aliasKey],
          method: 'alias'
        });
        return;
      }
      
      // 4. Fuzzy matching for typos
      const fuzzyMatch = Object.keys(HEADER_ALIASES).find(key => {
        const similarity = calculateSimilarity(normalized, normalizeHeader(key));
        return similarity > 0.8; // 80% similarity threshold
      });
      
      if (fuzzyMatch) {
        fixes.push({
          original: trimmedHeader,
          fixed: HEADER_ALIASES[fuzzyMatch],
          method: 'fuzzy'
        });
        return;
      }
      
      // Unfixable
      unfixable.push(trimmedHeader);
    });
    
    return { fixes, unfixable };
  };

  const downloadValidationErrors = () => {
    if (validationErrors.length === 0) return;

    const errorReport = {
      summary: {
        total_rows: validationSummary?.totalRows || uploadedData.length,
        valid_rows: validationSummary?.validRows || 0,
        error_rows: validationSummary?.errorRows || 0,
        warning_rows: validationSummary?.warningRows || 0,
        total_issues: validationErrors.length,
        missing_fields: validationSummary?.missingFields || [],
        errors_by_field: validationSummary?.groupedErrors || {}
      },
      detailed_errors: validationErrors.map(error => ({
        row_number: error.row,
        field_name: error.field,
        issue_description: error.message,
        current_value: (() => {
          const val = uploadedData[error.row - 1]?.[error.field as keyof PropertyRow];
          return val === null || val === undefined ? '' : String(val);
        })(),
        severity: error.severity,
        suggestions: (() => {
          // Provide specific suggestions based on field type
          switch (error.field) {
            case 'title':
              return 'Provide a descriptive property title (e.g., "Modern Studio in Mitte")';
            case 'description':
              return 'This property has no description - this is just a note, the property will still be imported';
            case 'apartment_type':
              return 'Use: studio, apartment, house, or room';
            case 'category':
              return 'Use: short_term, long_term, or corporate';
            case 'city':
              return 'Provide the city name (e.g., Berlin, Munich, Hamburg)';
            case 'street_name':
              return 'Provide the street name without the number';
            default:
              return `Provide a valid value for ${error.field.replace('_', ' ')}`;
          }
        })()
      })),
      original_headers: originalHeaders,
      header_mappings: columnMappings.map(mapping => ({
        csv_header: mapping.csvHeader,
        mapped_to: mapping.dbField,
        is_required: mapping.isRequired,
        is_mapped: mapping.mapped
      })),
      sample_data: uploadedData.slice(0, 3).map((row, index) => ({
        row_number: index + 1,
        data: row
      })),
      instructions: {
        how_to_fix: [
          "1. Review the detailed_errors section for specific issues",
          "2. Check that all required fields have values: " + requiredFields.join(', '),
          "3. Ensure data types are correct (numbers for prices, text for descriptions)",
          "4. Use the provided suggestions for each field",
          "5. Re-upload your corrected CSV file"
        ],
        need_help: "Copy this entire file content and share it with your AI assistant for automated fixes"
      }
    };

    const jsonString = JSON.stringify(errorReport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `validation_errors_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "📥 Error Report Downloaded",
      description: "Share this file with your AI assistant to get help fixing the issues automatically.",
    });
  };

  const autoMapHeaders = (headers: string[]): ColumnMapping[] => {
    const { fixes, unfixable } = autoFixHeaders(headers);
    
    // Show user what was fixed
    if (fixes.length > 0) {
      const fixedByMethod = fixes.reduce((acc, fix) => {
        acc[fix.method] = (acc[fix.method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const methodDescriptions = {
        exact: "exact matches",
        alias: "case variations", 
        normalized: "format corrections",
        fuzzy: "typo corrections"
      };
      
      const fixedDescription = Object.entries(fixedByMethod)
        .map(([method, count]) => `${count} ${methodDescriptions[method as keyof typeof methodDescriptions]}`)
        .join(', ');
      
      toast({
        title: "✨ Auto-fix Applied",
        description: `Fixed ${fixes.length} headers: ${fixedDescription}. ${unfixable.length > 0 ? `${unfixable.length} headers couldn't be mapped.` : ''}`,
        variant: "default",
      });
    }
    
    return headers.map(header => {
      const fix = fixes.find(f => f.original === header);
      const dbField = fix ? fix.fixed : '';
      
      return {
        csvHeader: header,
        dbField,
        isRequired: requiredFields.includes(dbField),
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

        // Auto-map headers using enhanced fuzzy matching
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

        // Apply smart auto-fill for missing values
        const { data: autoFilledData, autoFilled } = autoFillMissingValues(mappedData);

        // Show auto-fill summary if any values were filled
        if (autoFilled.length > 0) {
          toast({
            title: "✨ Smart Auto-Fill Applied",
            description: `We've filled in ${autoFilled.reduce((sum, msg) => sum + parseInt(msg.match(/\d+/)?.[0] || '0'), 0)} missing values: ${autoFilled.join(', ')}`,
            variant: "default",
          });
        }

        setUploadedData(autoFilledData);
        setOriginalHeaders(rawHeaders);
        setColumnMappings(autoMappedHeaders);
        validateData(autoFilledData);
        
        // Detect media URLs and show summary
        const mediaDetection = detectMediaUrls(autoFilledData);
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
    
    // Filter out any rows that look like headers
    const dataRows = data.filter(row => {
      // Skip rows where title contains obvious header keywords
      const title = row.title?.toLowerCase() || '';
      return !['title', 'property title', 'name', 'property name'].includes(title);
    });
    
    dataRows.forEach((row, index) => {
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
      if (!row.description || row.description.trim() === '') {
        errors.push({
          row: index + 1,
          field: 'description',
          message: 'This property has no description - will import anyway',
          severity: 'warning'
        });
      } else if (row.description.length < 10) {
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
    
    // Only check for errors, not warnings
    const errorCount = validationErrors.filter(e => e.severity === 'error').length;
    if (errorCount > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix all validation errors before uploading. Warnings are okay and won't block the upload.",
        variant: "destructive",
      });
      return;
    }

    // Duplicate detection step
    if (enableDuplicateDetection) {
      setIsUploading(true);
      
      toast({
        title: "🔍 Scanning for Duplicates",
        description: "Checking your import against existing properties...",
      });

      try {
        const duplicatesFound: { property: PropertyForDetection; matches: DuplicateMatch[]; index: number }[] = [];
        
        for (let i = 0; i < uploadedData.length; i++) {
          const property = uploadedData[i];
          const propertyForDetection: PropertyForDetection = {
            title: property.title,
            street_name: property.street_name,
            street_number: property.street_number,
            zip_code: property.zip_code,
            city: property.city,
            monthly_rent: property.monthly_rent,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            square_meters: property.square_meters
          };

          const matches = await duplicateDetectionService.detectDuplicates(propertyForDetection, user.id);
          
          if (matches.length > 0 && matches.some(m => m.status === 'duplicate' || m.status === 'potential')) {
            duplicatesFound.push({
              property: propertyForDetection,
              matches: matches.filter(m => m.status === 'duplicate' || m.status === 'potential'),
              index: i
            });
          }
        }

        setIsUploading(false);

        if (duplicatesFound.length > 0) {
          setDuplicateResults(duplicatesFound);
          setDuplicateModalOpen(true);
          
          toast({
            title: "⚠️ Duplicates Detected",
            description: `Found ${duplicatesFound.length} properties with potential duplicates. Please review before importing.`,
            variant: "default",
          });
          return;
        } else {
          toast({
            title: "✅ No Duplicates Found",
            description: "All properties appear to be unique. Proceeding with import...",
          });
        }
      } catch (error) {
        console.error('Duplicate detection error:', error);
        toast({
          title: "Duplicate Detection Error",
          description: "Could not check for duplicates. Proceeding with import...",
          variant: "destructive",
        });
      }
    }

    // Proceed with actual upload
    await performBulkUpload(uploadedData);
  };

  const performBulkUpload = async (dataToUpload: PropertyRow[]) => {
    if (!user) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Detect media URLs in the uploaded data
    const mediaDetection = detectMediaUrls(dataToUpload);
    const totalMediaItems = mediaDetection.reduce((sum, item) => sum + item.mediaItems.length, 0);
    
    setMediaProgress({ downloaded: 0, total: totalMediaItems, current: '' });
    setDownloadingMedia(totalMediaItems > 0);

    const results: UploadResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    let mediaResults = { photos: 0, floorplans: 0, failed: 0, errors: [] as string[] };

    try {
      for (let i = 0; i < dataToUpload.length; i++) {
        const property = dataToUpload[i];
        
        try {
          // Insert property first
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
            mediaResults.errors.push(...downloadResults.errors);
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

        setUploadProgress(((i + 1) / dataToUpload.length) * 100);
      }

      setUploadResult(results);
      
      if (results.success > 0) {
        const mediaMessage = totalMediaItems > 0 
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
      setDownloadingMedia(false);
    }
  };

  const handleDuplicateResolution = async (decisions: { [index: number]: 'import' | 'skip' }) => {
    // Filter out skipped properties
    const propertiesToImport = uploadedData.filter((_, index) => {
      const duplicateEntry = duplicateResults.find(d => d.index === index);
      return !duplicateEntry || decisions[index] === 'import';
    });

    const skippedCount = uploadedData.length - propertiesToImport.length;
    
    if (skippedCount > 0) {
      toast({
        title: "Duplicates Skipped",
        description: `Skipped ${skippedCount} duplicate properties. Importing ${propertiesToImport.length} unique properties.`,
      });
    }

    // Proceed with filtered data
    await performBulkUpload(propertiesToImport);
    setDuplicateModalOpen(false);
  };
      for (let i = 0; i < uploadedData.length; i++) {
        const property = uploadedData[i];
        
        try {
          // Insert property first
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
            mediaResults.errors.push(...downloadResults.errors);
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
        const mediaMessage = totalMediaItems > 0 
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
      setDownloadingMedia(false);
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Duplicate Settings
            </TabsTrigger>
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
                    <div className="space-y-3">
                      <div>
                        <Progress value={uploadProgress} className="mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Uploading properties... {Math.round(uploadProgress)}%
                        </p>
                      </div>
                      
                      {downloadingMedia && mediaProgress.total > 0 && (
                        <div>
                          <Progress value={(mediaProgress.downloaded / mediaProgress.total) * 100} className="mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {mediaProgress.current || `Downloading media files... ${mediaProgress.downloaded}/${mediaProgress.total}`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {validationErrors.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                       <div className="bg-muted/50 p-3 border-b flex items-center justify-between">
                         <h4 className="font-medium flex items-center gap-2">
                           <AlertCircle className="h-4 w-4" />
                           Validation Issues ({validationErrors.length})
                         </h4>
                         <Button 
                           variant="outline" 
                           size="sm" 
                           onClick={downloadValidationErrors}
                           className="flex items-center gap-2"
                         >
                           <Download className="h-4 w-4" />
                           Download Error Report
                         </Button>
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
