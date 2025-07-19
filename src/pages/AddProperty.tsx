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
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

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
        } catch (error) {
          console.error('Error loading property:', error);
          toast({
            title: "Error",
            description: "Failed to load property data",
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
    // Validation for required fields
    if (currentStep === 1 && (!formData.title || !formData.apartment_type || !formData.category)) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields before continuing.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep === 2 && (!formData.street_name || !formData.city)) {
      toast({
        title: "Required Fields Missing", 
        description: "Street name and city are required.",
        variant: "destructive",
      });
      return;
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
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'save'} property`,
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

                  <div>
                    <Label htmlFor="photos">Photos</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Click to upload photos or drag and drop</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB each</p>
                      <Button variant="outline" className="mt-2">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photos
                      </Button>
                    </div>
                  </div>

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
          <div className="space-y-4">
            <h3 className="font-medium">🏢 Address Information</h3>
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