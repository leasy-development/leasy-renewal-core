import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronLeft, ChevronRight, Save, ArrowLeft, Plus, Trash2, Upload, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import PhotoUploader from "@/components/PhotoUploader";

interface AdditionalFee {
  id: string;
  amount: number;
  frequency: string;
  description: string;
}

interface Discount {
  id: string;
  name: string;
  amount: number;
  isPercentage: boolean;
}

interface Tax {
  id: string;
  percentage: number;
  appliesTo: string;
}

interface Document {
  id: string;
  title: string;
  renterType: string;
}

interface Bed {
  id: string;
  size: string;
  room: string;
  type: string;
}

interface PropertyFormData {
  title: string;
  description: string;
  apartment_type: string;
  category: string;
  street_number: string;
  street_name: string;
  zip_code: string;
  city: string;
  region: string;
  country: string;
  monthly_rent: number | null;
  monthly_rent_refundability: string;
  weekly_rate: number | null;
  weekly_rate_flexibility: string;
  daily_rate: number | null;
  daily_rate_type: string;
  checkin_time: string;
  checkout_time: string;
  provides_wgsb: boolean;
  video_tour_link: string;
  virtual_tour_link: string;
  photos: File[];
  terms_conditions: File | null;
  cancellation_policy: File | null;
  additional_fees: AdditionalFee[];
  discounts: Discount[];
  taxes: Tax[];
  required_documents: Document[];
  beds: Bed[];
  landlord_name: string;
  contractual_partner: string;
  // General Amenities
  has_lift: boolean;
  weekly_cleaning_included: boolean;
  has_essentials_closet: boolean;
  has_iron_and_board: boolean;
  has_drying_rack: boolean;
  shared_laundry_room: string;
  parking_available: string;
  has_luggage_storage: boolean;
  pets_allowed: string;
  yoga_mats_available: boolean;
  breakfast_box_available: string;
  is_accessible: boolean;
  has_air_conditioning: boolean;
  has_balcony: boolean;
  has_terrace: boolean;
  fire_extinguisher_available: boolean;
  // Numa Standard Amenities
  has_24_7_support: boolean;
  has_wifi: boolean;
  contactless_checkin: boolean;
  free_tea_coffee: boolean;
  has_shampoo_conditioner: boolean;
  // Room-Specific Amenities
  has_smart_tv: boolean;
  has_kitchenette: boolean;
  has_mini_fridge: boolean;
  has_coffee_machine_kettle: boolean;
  has_microwave: boolean;
  has_cooking_essentials: boolean;
  has_tableware: boolean;
  has_glasses_and_cups: boolean;
  has_hair_dryer: boolean;
  has_complimentary_water: boolean;
  has_heating: boolean;
  has_work_station: boolean;
  has_dishwasher: boolean;
  has_oven: boolean;
  has_stove: boolean;
  is_sustainable_amenities: boolean;
  // Rent Information
  rent: number | null;
  rent_is_from: boolean;
}

const initialFormData: PropertyFormData = {
  title: '',
  description: '',
  apartment_type: '',
  category: '',
  street_number: '',
  street_name: '',
  zip_code: '',
  city: '',
  region: '',
  country: 'Germany',
  monthly_rent: null,
  monthly_rent_refundability: 'non-refundable',
  weekly_rate: null,
  weekly_rate_flexibility: 'flexible',
  daily_rate: null,
  daily_rate_type: 'short-term',
  checkin_time: '',
  checkout_time: '',
  provides_wgsb: false,
  video_tour_link: '',
  virtual_tour_link: '',
  photos: [],
  terms_conditions: null,
  cancellation_policy: null,
  additional_fees: [],
  discounts: [],
  taxes: [],
  required_documents: [],
  beds: [],
  landlord_name: '',
  contractual_partner: '',
  // General Amenities
  has_lift: false,
  weekly_cleaning_included: false,
  has_essentials_closet: false,
  has_iron_and_board: false,
  has_drying_rack: false,
  shared_laundry_room: 'none',
  parking_available: 'none',
  has_luggage_storage: false,
  pets_allowed: 'no',
  yoga_mats_available: false,
  breakfast_box_available: 'no',
  is_accessible: false,
  has_air_conditioning: false,
  has_balcony: false,
  has_terrace: false,
  fire_extinguisher_available: false,
  // Numa Standard Amenities
  has_24_7_support: false,
  has_wifi: false,
  contactless_checkin: false,
  free_tea_coffee: false,
  has_shampoo_conditioner: false,
  // Room-Specific Amenities
  has_smart_tv: false,
  has_kitchenette: false,
  has_mini_fridge: false,
  has_coffee_machine_kettle: false,
  has_microwave: false,
  has_cooking_essentials: false,
  has_tableware: false,
  has_glasses_and_cups: false,
  has_hair_dryer: false,
  has_complimentary_water: false,
  has_heating: false,
  has_work_station: false,
  has_dishwasher: false,
  has_oven: false,
  has_stove: false,
  is_sustainable_amenities: false,
  // Rent Information
  rent: null,
  rent_is_from: false,
};

const steps = [
  { id: 1, title: 'Basic Info', description: 'Apartment details and photos' },
  { id: 2, title: 'Address', description: 'Location information' },
  { id: 3, title: 'Rental Fees', description: 'Pricing and rates' },
  { id: 4, title: 'Amenities', description: 'Features and facilities' },
  { id: 5, title: 'Additional Costs', description: 'Fees, discounts, and taxes' },
  { id: 6, title: 'Check-in/out', description: 'Times and agreements' },
  { id: 7, title: 'Documents', description: 'Required documents' },
  { id: 8, title: 'Beds', description: 'Bedroom configuration' },
  { id: 9, title: 'Landlord Info', description: 'Landlord and partner details' },
  { id: 10, title: 'WGSB', description: 'Legal requirements' },
  { id: 11, title: 'Review', description: 'Review and submit' },
];

const AddProperty = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>({});
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  // Temporary API key input for Google Maps (until Supabase secrets are implemented)
  useEffect(() => {
    const savedApiKey = localStorage.getItem('google-maps-api-key');
    if (savedApiKey) {
      setGoogleMapsApiKey(savedApiKey);
    }
  }, []);

  // Load existing property data when editing
  useEffect(() => {
    if (isEditing && id && user) {
      const loadProperty = async () => {
        setLoadingProperty(true);
        try {
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

          if (error) throw error;

          if (data) {
            setFormData({
              ...initialFormData,
              title: data.title || '',
              description: data.description || '',
              apartment_type: data.apartment_type || '',
              category: data.category || '',
              street_number: data.street_number || '',
              street_name: data.street_name || '',
              zip_code: data.zip_code || '',
              city: data.city || '',
              region: data.region || '',
              country: data.country || 'Germany',
              monthly_rent: data.monthly_rent || null,
              weekly_rate: data.weekly_rate || null,
              daily_rate: data.daily_rate || null,
              checkin_time: data.checkin_time || '',
              checkout_time: data.checkout_time || '',
              provides_wgsb: data.provides_wgsb || false,
              rent: data.monthly_rent || null,
            });
          }
        } catch (error: any) {
          console.error('Error loading property:', error);
          
          let errorMessage = "Failed to load property data";
          let errorDetails = '';

          if (error?.message) {
            if (error.message.includes('permission denied') || error.message.includes('row-level security')) {
              errorMessage = "Access Denied";
              errorDetails = "You don't have permission to edit this property. Make sure you're logged in with the correct account.";
            } else if (error.message.includes('PGRST116')) {
              errorMessage = "Property Not Found";
              errorDetails = "This property doesn't exist or has been deleted.";
            } else if (error.message.includes('network')) {
              errorMessage = "Connection Error";
              errorDetails = "Please check your internet connection and try again.";
            } else {
              errorDetails = `Technical details: ${error.message}`;
            }
          } else {
            errorDetails = "The property data could not be retrieved. Please try again.";
          }

          toast({
            title: errorMessage,
            description: errorDetails,
            variant: "destructive",
          });
          navigate('/dashboard');
        } finally {
          setLoadingProperty(false);
        }
      };

      loadProperty();
    }
  }, [isEditing, id, user, navigate, toast]);

  // Auto-save functionality (only for new properties)
  useEffect(() => {
    if (!isEditing) {
      const savedData = localStorage.getItem('property-form-draft');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setFormData({ ...initialFormData, ...parsed });
        } catch (error) {
          console.error('Error loading saved draft:', error);
        }
      }
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('property-form-draft', JSON.stringify(formData));
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [formData, isEditing]);

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressSelect = (addressData: any) => {
    setFormData(prev => ({
      ...prev,
      street_number: addressData.street_number,
      street_name: addressData.street_name,
      city: addressData.city,
      zip_code: addressData.zip_code,
      region: addressData.region,
      country: addressData.country,
    }));
  };

  const addItem = (field: 'additional_fees' | 'discounts' | 'taxes' | 'required_documents' | 'beds') => {
    const newItem = (() => {
      switch (field) {
        case 'additional_fees':
          return { id: Date.now().toString(), amount: 0, frequency: 'monthly', description: '' };
        case 'discounts':
          return { id: Date.now().toString(), name: '', amount: 0, isPercentage: false };
        case 'taxes':
          return { id: Date.now().toString(), percentage: 0, appliesTo: 'rent' };
        case 'required_documents':
          return { id: Date.now().toString(), title: '', renterType: 'all' };
        case 'beds':
          return { id: Date.now().toString(), size: 'queen', room: 'room-1', type: 'standard' };
        default:
          return {};
      }
    })();
    
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], newItem]
    }));
  };

  const removeItem = (field: 'additional_fees' | 'discounts' | 'taxes' | 'required_documents' | 'beds', id: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((item: any) => item.id !== id)
    }));
  };

  const updateItem = (field: 'additional_fees' | 'discounts' | 'taxes' | 'required_documents' | 'beds', id: string, updates: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item: any) => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  };

  const toggleSection = (sectionId: number) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const validateURL = (url: string) => {
    if (!url) return true; // Optional fields
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = () => {
    // Validation for required fields by step
    switch (currentStep) {
      case 1:
        if (!formData.title || !formData.apartment_type || !formData.category) {
          toast({
            title: "Required Fields Missing",
            description: "Please fill in title, apartment type, and category before continuing.",
            variant: "destructive",
          });
          return;
        }
        break;
      
      case 2:
        if (!formData.street_name || !formData.city) {
          toast({
            title: "Required Fields Missing", 
            description: "Street name and city are required.",
            variant: "destructive",
          });
          return;
        }
        break;
      
      case 3:
        if (!formData.monthly_rent && !formData.weekly_rate && !formData.daily_rate) {
          toast({
            title: "Pricing Required",
            description: "Please set at least one rental rate (monthly, weekly, or daily).",
            variant: "destructive",
          });
          return;
        }
        break;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!user) return;

    setLoading(true);
    try {
      let error;
      
      if (isEditing && id) {
        // Update existing property
        const { error: updateError } = await supabase
          .from('properties')
          .update({
            ...formData,
            status,
          })
          .eq('id', id);
        error = updateError;
      } else {
        // Create new property
        const { error: insertError } = await supabase
          .from('properties')
          .insert({
            ...formData,
            user_id: user.id,
            status,
          });
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Property ${isEditing ? 'updated' : status === 'draft' ? 'saved as draft' : 'published'} successfully`,
      });

      // Clear draft only for new properties and navigate back to dashboard
      if (!isEditing) {
        localStorage.removeItem('property-form-draft');
      }
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving property:', error);
      
      // Parse and display specific error messages
      let errorMessage = `Failed to ${isEditing ? 'update' : 'save'} property`;
      let errorDetails = '';

      if (error?.message) {
        // Common Supabase/PostgreSQL errors with user-friendly messages
        if (error.message.includes('duplicate key value')) {
          errorMessage = 'Duplicate Property';
          errorDetails = 'A property with this information already exists. Please check your title and address.';
        } else if (error.message.includes('violates not-null constraint')) {
          errorMessage = 'Required Information Missing';
          errorDetails = 'Some required fields are missing. Please check that title, apartment type, and address are filled in.';
        } else if (error.message.includes('violates foreign key constraint')) {
          errorMessage = 'Invalid Reference';
          errorDetails = 'There\'s an issue with linked data. Please try refreshing the page and try again.';
        } else if (error.message.includes('permission denied') || error.message.includes('insufficient_privilege')) {
          errorMessage = 'Permission Denied';
          errorDetails = 'You don\'t have permission to perform this action. Please make sure you\'re logged in correctly.';
        } else if (error.message.includes('row-level security')) {
          errorMessage = 'Access Restricted';
          errorDetails = 'You can only edit your own properties. Please make sure you\'re logged in with the correct account.';
        } else if (error.message.includes('value too long')) {
          errorMessage = 'Input Too Long';
          errorDetails = 'One of your inputs is too long. Please shorten your description or other text fields.';
        } else if (error.message.includes('invalid input syntax')) {
          errorMessage = 'Invalid Data Format';
          errorDetails = 'Some of your input data has an invalid format. Please check your pricing, dates, and contact information.';
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
          errorMessage = 'Connection Error';
          errorDetails = 'There was a network issue. Please check your internet connection and try again.';
        } else if (error.message.includes('PGRST116')) {
          errorMessage = 'No Rows Updated';
          errorDetails = 'The property could not be found or you don\'t have permission to edit it.';
        } else {
          // Show the actual error message for debugging
          errorDetails = `Technical details: ${error.message}`;
        }
      } else if (error?.code) {
        // Handle specific error codes
        switch (error.code) {
          case '23505':
            errorMessage = 'Duplicate Entry';
            errorDetails = 'This property information already exists in the database.';
            break;
          case '23502':
            errorMessage = 'Required Field Missing';
            errorDetails = 'A required field is missing. Please fill in all mandatory information.';
            break;
          case '42501':
            errorMessage = 'Permission Denied';
            errorDetails = 'You don\'t have the necessary permissions for this action.';
            break;
          default:
            errorDetails = `Error code: ${error.code} - ${error.message || 'Unknown error occurred'}`;
        }
      } else {
        errorDetails = 'An unexpected error occurred. Please try again or contact support if the problem persists.';
      }

      toast({
        title: errorMessage,
        description: errorDetails,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: // Basic Info
        return (
          <div className="space-y-6">
            <TooltipProvider>
              <Collapsible open={openSections[1] !== false} onOpenChange={() => toggleSection(1)}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg">
                  <h3 className="font-medium">🏡 Basic Apartment Info</h3>
                  {openSections[1] === false ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="apartment_type">Apartment Type</Label>
                      <span className="text-red-500">*</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select the type of apartment you're listing</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select value={formData.apartment_type} onValueChange={(value) => handleInputChange('apartment_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select apartment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="1-bedroom">1 Bedroom</SelectItem>
                        <SelectItem value="2-bedroom">2 Bedroom</SelectItem>
                        <SelectItem value="3-bedroom">3 Bedroom</SelectItem>
                        <SelectItem value="4-bedroom">4+ Bedroom</SelectItem>
                        <SelectItem value="penthouse">Penthouse</SelectItem>
                        <SelectItem value="loft">Loft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="title">Title</Label>
                      <span className="text-red-500">*</span>
                    </div>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Modern 2BR Apartment in City Center"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your property..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="category">Category</Label>
                      <span className="text-red-500">*</span>
                    </div>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="luxury">Luxury</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="budget">Budget</SelectItem>
                        <SelectItem value="student">Student Housing</SelectItem>
                        <SelectItem value="furnished">Furnished</SelectItem>
                        <SelectItem value="unfurnished">Unfurnished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <PhotoUploader
                    photos={formData.photos}
                    onPhotosChange={(photos) => handleInputChange('photos', photos)}
                  />

                  <div>
                    <Label htmlFor="video_tour_link">Video Tour Link (YouTube, Vimeo)</Label>
                    <Input
                      id="video_tour_link"
                      value={formData.video_tour_link}
                      onChange={(e) => handleInputChange('video_tour_link', e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className={!validateURL(formData.video_tour_link) ? 'border-red-500' : ''}
                    />
                    {formData.video_tour_link && !validateURL(formData.video_tour_link) && (
                      <p className="text-red-500 text-sm mt-1">Please enter a valid URL</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="virtual_tour_link">360° Virtual Tour Link</Label>
                    <Input
                      id="virtual_tour_link"
                      value={formData.virtual_tour_link}
                      onChange={(e) => handleInputChange('virtual_tour_link', e.target.value)}
                      placeholder="https://..."
                      className={!validateURL(formData.virtual_tour_link) ? 'border-red-500' : ''}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </TooltipProvider>
          </div>
        );

      case 2: // Address
        return (
          <div className="space-y-6">
            <h3 className="font-medium">🏢 Address Information</h3>
            
            {!googleMapsApiKey && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-amber-800">
                      Google Maps API Key Required
                    </p>
                    <p className="text-sm text-amber-700">
                      To enable address autocomplete and map functionality, please enter your Google Maps API key below:
                    </p>
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter Google Maps API key"
                        value={googleMapsApiKey}
                        onChange={(e) => {
                          setGoogleMapsApiKey(e.target.value);
                          localStorage.setItem('google-maps-api-key', e.target.value);
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://console.cloud.google.com/google/maps-apis/credentials', '_blank')}
                      >
                        Get API Key
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {googleMapsApiKey ? (
              <AddressAutocomplete
                onAddressSelect={handleAddressSelect}
                initialAddress={{
                  street_number: formData.street_number,
                  street_name: formData.street_name,
                  city: formData.city,
                  zip_code: formData.zip_code,
                  region: formData.region,
                  country: formData.country,
                }}
                apiKey={googleMapsApiKey}
              />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manual address entry (without autocomplete):
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="street_number">Street #</Label>
                    <Input
                      id="street_number"
                      value={formData.street_number}
                      onChange={(e) => handleInputChange('street_number', e.target.value)}
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="street_name">Street Name</Label>
                      <span className="text-red-500">*</span>
                    </div>
                    <Input
                      id="street_name"
                      value={formData.street_name}
                      onChange={(e) => handleInputChange('street_name', e.target.value)}
                      placeholder="Main Street"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="zip_code">ZIP Code</Label>
                    <Input
                      id="zip_code"
                      value={formData.zip_code}
                      onChange={(e) => handleInputChange('zip_code', e.target.value)}
                      placeholder="12345"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="city">City</Label>
                      <span className="text-red-500">*</span>
                    </div>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Berlin"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    placeholder="Berlin"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="Austria">Austria</SelectItem>
                      <SelectItem value="Switzerland">Switzerland</SelectItem>
                      <SelectItem value="Netherlands">Netherlands</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        );

      case 3: // Rental Fees
        return (
          <div className="space-y-6">
            <h3 className="font-medium">💰 Rental Fees & Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="monthly_rent">Monthly Rent (€)</Label>
                <Input
                  id="monthly_rent"
                  type="number"
                  value={formData.monthly_rent || ''}
                  onChange={(e) => handleInputChange('monthly_rent', e.target.value ? Number(e.target.value) : null)}
                  placeholder="2500"
                />
              </div>
              <div>
                <Label htmlFor="weekly_rate">Weekly Rate (€)</Label>
                <Input
                  id="weekly_rate"
                  type="number"
                  value={formData.weekly_rate || ''}
                  onChange={(e) => handleInputChange('weekly_rate', e.target.value ? Number(e.target.value) : null)}
                  placeholder="600"
                />
              </div>
              <div>
                <Label htmlFor="daily_rate">Daily Rate (€)</Label>
                <Input
                  id="daily_rate"
                  type="number"
                  value={formData.daily_rate || ''}
                  onChange={(e) => handleInputChange('daily_rate', e.target.value ? Number(e.target.value) : null)}
                  placeholder="100"
                />
              </div>
            </div>
          </div>
        );

      case 4: // Amenities
        return (
          <div className="space-y-6">
            <TooltipProvider>
              <Collapsible open={openSections[4] !== false} onOpenChange={() => toggleSection(4)}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg">
                  <h3 className="font-medium">🏠 General Amenities</h3>
                  {openSections[4] === false ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_lift"
                        checked={formData.has_lift}
                        onCheckedChange={(checked) => handleInputChange('has_lift', checked)}
                      />
                      <Label htmlFor="has_lift">Elevator/Lift</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="weekly_cleaning_included"
                        checked={formData.weekly_cleaning_included}
                        onCheckedChange={(checked) => handleInputChange('weekly_cleaning_included', checked)}
                      />
                      <Label htmlFor="weekly_cleaning_included">Weekly Cleaning</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_essentials_closet"
                        checked={formData.has_essentials_closet}
                        onCheckedChange={(checked) => handleInputChange('has_essentials_closet', checked)}
                      />
                      <Label htmlFor="has_essentials_closet">Essentials Closet</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_iron_and_board"
                        checked={formData.has_iron_and_board}
                        onCheckedChange={(checked) => handleInputChange('has_iron_and_board', checked)}
                      />
                      <Label htmlFor="has_iron_and_board">Iron & Board</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_drying_rack"
                        checked={formData.has_drying_rack}
                        onCheckedChange={(checked) => handleInputChange('has_drying_rack', checked)}
                      />
                      <Label htmlFor="has_drying_rack">Drying Rack</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_luggage_storage"
                        checked={formData.has_luggage_storage}
                        onCheckedChange={(checked) => handleInputChange('has_luggage_storage', checked)}
                      />
                      <Label htmlFor="has_luggage_storage">Luggage Storage</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="yoga_mats_available"
                        checked={formData.yoga_mats_available}
                        onCheckedChange={(checked) => handleInputChange('yoga_mats_available', checked)}
                      />
                      <Label htmlFor="yoga_mats_available">Yoga Mats</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_accessible"
                        checked={formData.is_accessible}
                        onCheckedChange={(checked) => handleInputChange('is_accessible', checked)}
                      />
                      <Label htmlFor="is_accessible">Accessible</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fire_extinguisher_available"
                        checked={formData.fire_extinguisher_available}
                        onCheckedChange={(checked) => handleInputChange('fire_extinguisher_available', checked)}
                      />
                      <Label htmlFor="fire_extinguisher_available">Fire Extinguisher</Label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="shared_laundry_room">Shared Laundry Room</Label>
                      <Select value={formData.shared_laundry_room} onValueChange={(value) => handleInputChange('shared_laundry_room', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="building">In Building</SelectItem>
                          <SelectItem value="floor">On Floor</SelectItem>
                          <SelectItem value="shared">Shared Access</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="parking_available">Parking Available</Label>
                      <Select value={formData.parking_available} onValueChange={(value) => handleInputChange('parking_available', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="street">Street Parking</SelectItem>
                          <SelectItem value="garage">Garage</SelectItem>
                          <SelectItem value="private">Private Space</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="pets_allowed">Pets Allowed</Label>
                      <Select value={formData.pets_allowed} onValueChange={(value) => handleInputChange('pets_allowed', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No Pets</SelectItem>
                          <SelectItem value="cats">Cats Only</SelectItem>
                          <SelectItem value="dogs">Dogs Only</SelectItem>
                          <SelectItem value="both">Cats & Dogs</SelectItem>
                          <SelectItem value="all">All Pets</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="breakfast_box_available">Breakfast Box</Label>
                      <Select value={formData.breakfast_box_available} onValueChange={(value) => handleInputChange('breakfast_box_available', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">Not Available</SelectItem>
                          <SelectItem value="paid">Paid Option</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSections[41] !== false} onOpenChange={() => toggleSection(41)}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg">
                  <h3 className="font-medium">🏢 Building Amenities</h3>
                  {openSections[41] === false ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_wifi"
                        checked={formData.has_wifi}
                        onCheckedChange={(checked) => handleInputChange('has_wifi', checked)}
                      />
                      <Label htmlFor="has_wifi">WiFi</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_air_conditioning"
                        checked={formData.has_air_conditioning}
                        onCheckedChange={(checked) => handleInputChange('has_air_conditioning', checked)}
                      />
                      <Label htmlFor="has_air_conditioning">Air Conditioning</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_heating"
                        checked={formData.has_heating}
                        onCheckedChange={(checked) => handleInputChange('has_heating', checked)}
                      />
                      <Label htmlFor="has_heating">Heating</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_balcony"
                        checked={formData.has_balcony}
                        onCheckedChange={(checked) => handleInputChange('has_balcony', checked)}
                      />
                      <Label htmlFor="has_balcony">Balcony</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_terrace"
                        checked={formData.has_terrace}
                        onCheckedChange={(checked) => handleInputChange('has_terrace', checked)}
                      />
                      <Label htmlFor="has_terrace">Terrace</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_24_7_support"
                        checked={formData.has_24_7_support}
                        onCheckedChange={(checked) => handleInputChange('has_24_7_support', checked)}
                      />
                      <Label htmlFor="has_24_7_support">24/7 Support</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="contactless_checkin"
                        checked={formData.contactless_checkin}
                        onCheckedChange={(checked) => handleInputChange('contactless_checkin', checked)}
                      />
                      <Label htmlFor="contactless_checkin">Contactless Check-in</Label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSections[42] !== false} onOpenChange={() => toggleSection(42)}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg">
                  <h3 className="font-medium">🍽️ Kitchen & Dining</h3>
                  {openSections[42] === false ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_kitchenette"
                        checked={formData.has_kitchenette}
                        onCheckedChange={(checked) => handleInputChange('has_kitchenette', checked)}
                      />
                      <Label htmlFor="has_kitchenette">Kitchenette</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_mini_fridge"
                        checked={formData.has_mini_fridge}
                        onCheckedChange={(checked) => handleInputChange('has_mini_fridge', checked)}
                      />
                      <Label htmlFor="has_mini_fridge">Mini Fridge</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_coffee_machine_kettle"
                        checked={formData.has_coffee_machine_kettle}
                        onCheckedChange={(checked) => handleInputChange('has_coffee_machine_kettle', checked)}
                      />
                      <Label htmlFor="has_coffee_machine_kettle">Coffee Machine/Kettle</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_microwave"
                        checked={formData.has_microwave}
                        onCheckedChange={(checked) => handleInputChange('has_microwave', checked)}
                      />
                      <Label htmlFor="has_microwave">Microwave</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_cooking_essentials"
                        checked={formData.has_cooking_essentials}
                        onCheckedChange={(checked) => handleInputChange('has_cooking_essentials', checked)}
                      />
                      <Label htmlFor="has_cooking_essentials">Cooking Essentials</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_tableware"
                        checked={formData.has_tableware}
                        onCheckedChange={(checked) => handleInputChange('has_tableware', checked)}
                      />
                      <Label htmlFor="has_tableware">Tableware</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_glasses_and_cups"
                        checked={formData.has_glasses_and_cups}
                        onCheckedChange={(checked) => handleInputChange('has_glasses_and_cups', checked)}
                      />
                      <Label htmlFor="has_glasses_and_cups">Glasses & Cups</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_dishwasher"
                        checked={formData.has_dishwasher}
                        onCheckedChange={(checked) => handleInputChange('has_dishwasher', checked)}
                      />
                      <Label htmlFor="has_dishwasher">Dishwasher</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_oven"
                        checked={formData.has_oven}
                        onCheckedChange={(checked) => handleInputChange('has_oven', checked)}
                      />
                      <Label htmlFor="has_oven">Oven</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_stove"
                        checked={formData.has_stove}
                        onCheckedChange={(checked) => handleInputChange('has_stove', checked)}
                      />
                      <Label htmlFor="has_stove">Stove</Label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openSections[43] !== false} onOpenChange={() => toggleSection(43)}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg">
                  <h3 className="font-medium">🛀 Room Amenities</h3>
                  {openSections[43] === false ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_smart_tv"
                        checked={formData.has_smart_tv}
                        onCheckedChange={(checked) => handleInputChange('has_smart_tv', checked)}
                      />
                      <Label htmlFor="has_smart_tv">Smart TV</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_hair_dryer"
                        checked={formData.has_hair_dryer}
                        onCheckedChange={(checked) => handleInputChange('has_hair_dryer', checked)}
                      />
                      <Label htmlFor="has_hair_dryer">Hair Dryer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_complimentary_water"
                        checked={formData.has_complimentary_water}
                        onCheckedChange={(checked) => handleInputChange('has_complimentary_water', checked)}
                      />
                      <Label htmlFor="has_complimentary_water">Complimentary Water</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_work_station"
                        checked={formData.has_work_station}
                        onCheckedChange={(checked) => handleInputChange('has_work_station', checked)}
                      />
                      <Label htmlFor="has_work_station">Work Station</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="free_tea_coffee"
                        checked={formData.free_tea_coffee}
                        onCheckedChange={(checked) => handleInputChange('free_tea_coffee', checked)}
                      />
                      <Label htmlFor="free_tea_coffee">Free Tea & Coffee</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_shampoo_conditioner"
                        checked={formData.has_shampoo_conditioner}
                        onCheckedChange={(checked) => handleInputChange('has_shampoo_conditioner', checked)}
                      />
                      <Label htmlFor="has_shampoo_conditioner">Shampoo & Conditioner</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_sustainable_amenities"
                        checked={formData.is_sustainable_amenities}
                        onCheckedChange={(checked) => handleInputChange('is_sustainable_amenities', checked)}
                      />
                      <Label htmlFor="is_sustainable_amenities">Sustainable Amenities</Label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </TooltipProvider>
          </div>
        );

      case 5: // Additional Costs
        return (
          <div className="space-y-6">
            <h3 className="font-medium">💳 Additional Costs & Fees</h3>
            
            {/* Additional Fees */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Additional Fees</CardTitle>
                <CardDescription>Add any extra fees for your property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.additional_fees.map((fee, index) => (
                  <div key={fee.id} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label>Description</Label>
                      <Input
                        value={fee.description}
                        onChange={(e) => updateItem('additional_fees', fee.id, { description: e.target.value })}
                        placeholder="e.g., Cleaning fee"
                      />
                    </div>
                    <div className="w-32">
                      <Label>Amount (€)</Label>
                      <Input
                        type="number"
                        value={fee.amount}
                        onChange={(e) => updateItem('additional_fees', fee.id, { amount: Number(e.target.value) })}
                        placeholder="50"
                      />
                    </div>
                    <div className="w-32">
                      <Label>Frequency</Label>
                      <Select 
                        value={fee.frequency} 
                        onValueChange={(value) => updateItem('additional_fees', fee.id, { frequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="once">One-time</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem('additional_fees', fee.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addItem('additional_fees')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Fee
                </Button>
              </CardContent>
            </Card>

            {/* Discounts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Discounts</CardTitle>
                <CardDescription>Add any discounts for longer stays</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.discounts.map((discount, index) => (
                  <div key={discount.id} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label>Discount Name</Label>
                      <Input
                        value={discount.name}
                        onChange={(e) => updateItem('discounts', discount.id, { name: e.target.value })}
                        placeholder="e.g., Weekly discount"
                      />
                    </div>
                    <div className="w-32">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={discount.amount}
                        onChange={(e) => updateItem('discounts', discount.id, { amount: Number(e.target.value) })}
                        placeholder="10"
                      />
                    </div>
                    <div className="w-32">
                      <Label>Type</Label>
                      <Select 
                        value={discount.isPercentage ? 'percentage' : 'fixed'} 
                        onValueChange={(value) => updateItem('discounts', discount.id, { isPercentage: value === 'percentage' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem('discounts', discount.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addItem('discounts')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Discount
                </Button>
              </CardContent>
            </Card>

            {/* Taxes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Taxes</CardTitle>
                <CardDescription>Add applicable taxes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.taxes.map((tax, index) => (
                  <div key={tax.id} className="flex gap-3 items-end">
                    <div className="w-32">
                      <Label>Percentage (%)</Label>
                      <Input
                        type="number"
                        value={tax.percentage}
                        onChange={(e) => updateItem('taxes', tax.id, { percentage: Number(e.target.value) })}
                        placeholder="19"
                        step="0.1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Applies To</Label>
                      <Select 
                        value={tax.appliesTo} 
                        onValueChange={(value) => updateItem('taxes', tax.id, { appliesTo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rent">Rent</SelectItem>
                          <SelectItem value="fees">Additional Fees</SelectItem>
                          <SelectItem value="total">Total Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem('taxes', tax.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addItem('taxes')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tax
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 7: // Documents
        return (
          <div className="space-y-6">
            <h3 className="font-medium">📋 Documents & Requirements</h3>
            
            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Terms & Conditions</CardTitle>
                  <CardDescription>Upload your terms and conditions document</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 5MB</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                  {formData.terms_conditions && (
                    <p className="text-sm text-green-600 mt-2">✓ File uploaded: {formData.terms_conditions.name}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cancellation Policy</CardTitle>
                  <CardDescription>Upload your cancellation policy document</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 5MB</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                  {formData.cancellation_policy && (
                    <p className="text-sm text-green-600 mt-2">✓ File uploaded: {formData.cancellation_policy.name}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Required Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Required Documents from Tenants</CardTitle>
                <CardDescription>Specify what documents tenants need to provide</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.required_documents.map((doc, index) => (
                  <div key={doc.id} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label>Document Title</Label>
                      <Input
                        value={doc.title}
                        onChange={(e) => updateItem('required_documents', doc.id, { title: e.target.value })}
                        placeholder="e.g., Passport/ID"
                      />
                    </div>
                    <div className="w-48">
                      <Label>Required For</Label>
                      <Select 
                        value={doc.renterType} 
                        onValueChange={(value) => updateItem('required_documents', doc.id, { renterType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tenants</SelectItem>
                          <SelectItem value="primary">Primary Tenant Only</SelectItem>
                          <SelectItem value="international">International Tenants</SelectItem>
                          <SelectItem value="students">Students Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem('required_documents', doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addItem('required_documents')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Required Document
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 8: // Beds
        return (
          <div className="space-y-6">
            <h3 className="font-medium">🛏️ Bedroom Configuration</h3>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bed Setup</CardTitle>
                <CardDescription>Configure the beds available in your property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.beds.map((bed, index) => (
                  <div key={bed.id} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label>Room</Label>
                      <Select 
                        value={bed.room} 
                        onValueChange={(value) => updateItem('beds', bed.id, { room: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="room-1">Room 1</SelectItem>
                          <SelectItem value="room-2">Room 2</SelectItem>
                          <SelectItem value="room-3">Room 3</SelectItem>
                          <SelectItem value="living-room">Living Room</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <Label>Bed Size</Label>
                      <Select 
                        value={bed.size} 
                        onValueChange={(value) => updateItem('beds', bed.id, { size: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="double">Double</SelectItem>
                          <SelectItem value="queen">Queen</SelectItem>
                          <SelectItem value="king">King</SelectItem>
                          <SelectItem value="sofa-bed">Sofa Bed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <Label>Type</Label>
                      <Select 
                        value={bed.type} 
                        onValueChange={(value) => updateItem('beds', bed.id, { type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="bunk">Bunk Bed</SelectItem>
                          <SelectItem value="murphy">Murphy Bed</SelectItem>
                          <SelectItem value="sofa">Sofa Bed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem('beds', bed.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addItem('beds')}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bed
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 9: // Landlord Info
        return (
          <div className="space-y-6">
            <h3 className="font-medium">👤 Landlord & Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Landlord Information</CardTitle>
                  <CardDescription>Primary landlord contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="landlord_name">Landlord Name</Label>
                    <Input
                      id="landlord_name"
                      value={formData.landlord_name}
                      onChange={(e) => handleInputChange('landlord_name', e.target.value)}
                      placeholder="John Smith"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contractual Partner</CardTitle>
                  <CardDescription>Who will sign the rental agreement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="contractual_partner">Partner Name/Company</Label>
                    <Input
                      id="contractual_partner"
                      value={formData.contractual_partner}
                      onChange={(e) => handleInputChange('contractual_partner', e.target.value)}
                      placeholder="Smith Property Management"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 10: // WGSB
        return (
          <div className="space-y-6">
            <h3 className="font-medium">📄 WGSB Legal Requirements</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="provides_wgsb"
                checked={formData.provides_wgsb}
                onCheckedChange={(checked) => handleInputChange('provides_wgsb', checked)}
              />
              <Label htmlFor="provides_wgsb">
                Property provides WGSB certificate
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              WGSB (Wohngebäude-Sicherheits-Bestätigung) is required for certain properties in Germany.
            </p>
          </div>
        );

      case 11: // Review
        return (
          <div className="space-y-6">
            <h3 className="font-medium">📋 Review Your Property</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Title:</strong> {formData.title || 'Not set'}</div>
                  <div><strong>Type:</strong> {formData.apartment_type || 'Not set'}</div>
                  <div><strong>Category:</strong> {formData.category || 'Not set'}</div>
                  <div><strong>Photos:</strong> {formData.photos.length} uploaded</div>
                  <div><strong>Description:</strong> {formData.description ? `${formData.description.substring(0, 100)}...` : 'Not set'}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Address:</strong> {formData.street_number} {formData.street_name || 'Not set'}</div>
                  <div><strong>City:</strong> {formData.city || 'Not set'}</div>
                  <div><strong>ZIP:</strong> {formData.zip_code || 'Not set'}</div>
                  <div><strong>Region:</strong> {formData.region || 'Not set'}</div>
                  <div><strong>Country:</strong> {formData.country}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {formData.monthly_rent && <div><strong>Monthly:</strong> €{formData.monthly_rent}</div>}
                  {formData.weekly_rate && <div><strong>Weekly:</strong> €{formData.weekly_rate}</div>}
                  {formData.daily_rate && <div><strong>Daily:</strong> €{formData.daily_rate}</div>}
                  {!formData.monthly_rent && !formData.weekly_rate && !formData.daily_rate && (
                    <div className="text-muted-foreground">No pricing set</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Times & Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Check-in:</strong> {formData.checkin_time || 'Not set'}</div>
                  <div><strong>Check-out:</strong> {formData.checkout_time || 'Not set'}</div>
                  <div><strong>WGSB:</strong> {formData.provides_wgsb ? 'Yes' : 'No'}</div>
                  <div><strong>Beds:</strong> {formData.beds.length} configured</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Amenities Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex flex-wrap gap-1">
                    {formData.has_wifi && <Badge variant="secondary">WiFi</Badge>}
                    {formData.has_air_conditioning && <Badge variant="secondary">AC</Badge>}
                    {formData.has_heating && <Badge variant="secondary">Heating</Badge>}
                    {formData.has_balcony && <Badge variant="secondary">Balcony</Badge>}
                    {formData.has_kitchenette && <Badge variant="secondary">Kitchen</Badge>}
                    {formData.has_lift && <Badge variant="secondary">Elevator</Badge>}
                    {formData.parking_available !== 'none' && <Badge variant="secondary">Parking</Badge>}
                  </div>
                  {!formData.has_wifi && !formData.has_air_conditioning && !formData.has_heating && 
                   !formData.has_balcony && !formData.has_kitchenette && !formData.has_lift && (
                    <div className="text-muted-foreground">No amenities selected</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Additional Costs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Additional Fees:</strong> {formData.additional_fees.length}</div>
                  <div><strong>Discounts:</strong> {formData.discounts.length}</div>
                  <div><strong>Taxes:</strong> {formData.taxes.length}</div>
                  <div><strong>Required Documents:</strong> {formData.required_documents.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Landlord:</strong> {formData.landlord_name || 'Not set'}</div>
                  <div><strong>Contractual Partner:</strong> {formData.contractual_partner || 'Not set'}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Media & Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Video Tour:</strong> {formData.video_tour_link ? '✓ Set' : 'Not set'}</div>
                  <div><strong>Virtual Tour:</strong> {formData.virtual_tour_link ? '✓ Set' : 'Not set'}</div>
                  <div><strong>Terms & Conditions:</strong> {formData.terms_conditions ? '✓ Uploaded' : 'Not uploaded'}</div>
                  <div><strong>Cancellation Policy:</strong> {formData.cancellation_policy ? '✓ Uploaded' : 'Not uploaded'}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <div className="text-center">
                  <h4 className="font-medium mb-2">Ready to {isEditing ? 'update' : 'publish'} your property?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Review all the information above and make sure everything is correct before {isEditing ? 'updating' : 'publishing'}.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => handleSave('draft')}
                      disabled={loading || !formData.title || !formData.city}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isEditing ? 'Save Changes' : 'Save as Draft'}
                    </Button>
                    <Button
                      onClick={() => handleSave('published')}
                      disabled={loading || !formData.title || !formData.city}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isEditing ? 'Update & Publish' : 'Publish Property'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="p-6 bg-card rounded-lg">
            <p>Step {currentStep} content</p>
            <p className="text-muted-foreground">This step is not yet fully implemented</p>
          </div>
        );
    }
  };

  if (loadingProperty) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading property data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-semibold">{isEditing ? 'Edit Property' : 'Add New Property'}</h1>
                <p className="text-muted-foreground">{isEditing ? 'Update your property details' : 'Create a new property listing step by step'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {steps.length}</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / steps.length) * 100)}% Complete</span>
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs ${
                  currentStep >= step.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.id}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-1 mx-1 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Current Step Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Step {currentStep}: {steps[currentStep - 1]?.title}
            </CardTitle>
            <CardDescription>
              {steps[currentStep - 1]?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            {currentStep === steps.length ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleSave('draft')}
                  disabled={loading || !formData.title || !formData.city}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Save Changes' : 'Save Draft'}
                </Button>
                <Button
                  onClick={() => handleSave('published')}
                  disabled={loading || !formData.title || !formData.city}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update & Publish' : 'Publish Now'}
                </Button>
              </>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProperty;