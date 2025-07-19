import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { ChevronLeft, ChevronRight, Save, X, Plus, Trash2, Upload, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property | null;
  onPropertyUpdated?: () => void;
}

interface Property {
  id: string;
  title: string;
  description: string;
  apartment_type: string;
  category: string;
  status: string;
  city: string;
  monthly_rent: number;
  street_number: string;
  street_name: string;
  zip_code: string;
  region: string;
  country: string;
  weekly_rate: number;
  daily_rate: number;
  checkin_time: string;
  checkout_time: string;
  provides_wgsb: boolean;
  created_at: string;
}


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

export const AddPropertyModal = ({ isOpen, onClose, property, onPropertyUpdated }: AddPropertyModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>({});
  const { user } = useAuth();
  const { toast } = useToast();

  // Auto-save functionality
  useEffect(() => {
    if (isOpen) {
      const savedData = localStorage.getItem('property-form-draft');
      if (savedData && !property) {
        try {
          const parsed = JSON.parse(savedData);
          setFormData({ ...initialFormData, ...parsed });
        } catch (error) {
          console.error('Error loading saved draft:', error);
        }
      }
    }
  }, [isOpen, property]);

  useEffect(() => {
    if (isOpen && !property) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('property-form-draft', JSON.stringify(formData));
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [formData, isOpen, property]);

  // Load property data when editing
  useEffect(() => {
    if (property && isOpen) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        apartment_type: property.apartment_type || '',
        category: property.category || '',
        street_number: property.street_number || '',
        street_name: property.street_name || '',
        zip_code: property.zip_code || '',
        city: property.city || '',
        region: property.region || '',
        country: property.country || 'Germany',
        monthly_rent: property.monthly_rent || null,
        monthly_rent_refundability: 'non-refundable',
        weekly_rate: property.weekly_rate || null,
        weekly_rate_flexibility: 'flexible',
        daily_rate: property.daily_rate || null,
        daily_rate_type: 'short-term',
        checkin_time: property.checkin_time || '',
        checkout_time: property.checkout_time || '',
        provides_wgsb: property.provides_wgsb || false,
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
        // General Amenities - set defaults for existing properties
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
        rent: property.monthly_rent || null,
        rent_is_from: false,
      });
    } else if (!property && isOpen) {
      setFormData(initialFormData);
    }
  }, [property, isOpen]);

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
      
      if (property) {
        // Update existing property
        const { error: updateError } = await supabase
          .from('properties')
          .update({
            ...formData,
            status,
          })
          .eq('id', property.id);
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
        description: `Property ${property ? 'updated' : status === 'draft' ? 'saved as draft' : 'published'} successfully`,
      });

      // Reset form and close modal
      setFormData(initialFormData);
      setCurrentStep(1);
      onPropertyUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: "Error",
        description: `Failed to ${property ? 'update' : 'save'} property`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!property) {
      localStorage.removeItem('property-form-draft');
    }
    setFormData(initialFormData);
    setCurrentStep(1);
    setOpenSections({});
    onClose();
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

      case 3: // Rental Fees
        return (
          <div className="space-y-4">
            <h3 className="font-medium">💰 Rental Fees</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthly_rent">Monthly Rent (€)</Label>
                <Input
                  id="monthly_rent"
                  type="number"
                  value={formData.monthly_rent || ''}
                  onChange={(e) => handleInputChange('monthly_rent', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="1200"
                />
              </div>
              <div>
                <Label htmlFor="monthly_rent_refundability">Refundability</Label>
                <Select value={formData.monthly_rent_refundability} onValueChange={(value) => handleInputChange('monthly_rent_refundability', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non-refundable">Non Refundable</SelectItem>
                    <SelectItem value="refundable">Refundable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weekly_rate">Weekly Rent (€)</Label>
                <Input
                  id="weekly_rate"
                  type="number"
                  value={formData.weekly_rate || ''}
                  onChange={(e) => handleInputChange('weekly_rate', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="300"
                />
              </div>
              <div>
                <Label htmlFor="weekly_rate_flexibility">Flexibility</Label>
                <Select value={formData.weekly_rate_flexibility} onValueChange={(value) => handleInputChange('weekly_rate_flexibility', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flexible">Flexible</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="daily_rate">Daily Rent (€)</Label>
                <Input
                  id="daily_rate"
                  type="number"
                  value={formData.daily_rate || ''}
                  onChange={(e) => handleInputChange('daily_rate', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="50"
                />
              </div>
              <div>
                <Label htmlFor="daily_rate_type">Type</Label>
                <Select value={formData.daily_rate_type} onValueChange={(value) => handleInputChange('daily_rate_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short-term">Short-term</SelectItem>
                    <SelectItem value="long-term">Long-term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 4: // Amenities
        return (
          <div className="space-y-6">
            <TooltipProvider>
              <h3 className="font-medium">🏡 Amenities & Features</h3>
              
              {/* General Amenities */}
              <Collapsible open={openSections[4] !== false} onOpenChange={() => toggleSection(4)}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg">
                  <h4 className="font-medium">General Amenities</h4>
                  {openSections[4] === false ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_lift"
                        checked={formData.has_lift}
                        onCheckedChange={(checked) => handleInputChange('has_lift', checked)}
                      />
                      <Label htmlFor="has_lift">Lift available</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="weekly_cleaning_included"
                        checked={formData.weekly_cleaning_included}
                        onCheckedChange={(checked) => handleInputChange('weekly_cleaning_included', checked)}
                      />
                      <Label htmlFor="weekly_cleaning_included">Weekly cleaning included</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_essentials_closet"
                        checked={formData.has_essentials_closet}
                        onCheckedChange={(checked) => handleInputChange('has_essentials_closet', checked)}
                      />
                      <Label htmlFor="has_essentials_closet">Essentials closet</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_iron_and_board"
                        checked={formData.has_iron_and_board}
                        onCheckedChange={(checked) => handleInputChange('has_iron_and_board', checked)}
                      />
                      <Label htmlFor="has_iron_and_board">Iron and ironing board</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_drying_rack"
                        checked={formData.has_drying_rack}
                        onCheckedChange={(checked) => handleInputChange('has_drying_rack', checked)}
                      />
                      <Label htmlFor="has_drying_rack">Drying rack</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_luggage_storage"
                        checked={formData.has_luggage_storage}
                        onCheckedChange={(checked) => handleInputChange('has_luggage_storage', checked)}
                      />
                      <Label htmlFor="has_luggage_storage">Luggage storage available</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="yoga_mats_available"
                        checked={formData.yoga_mats_available}
                        onCheckedChange={(checked) => handleInputChange('yoga_mats_available', checked)}
                      />
                      <Label htmlFor="yoga_mats_available">Yoga mats available</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_accessible"
                        checked={formData.is_accessible}
                        onCheckedChange={(checked) => handleInputChange('is_accessible', checked)}
                      />
                      <Label htmlFor="is_accessible">Wheelchair accessible</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_air_conditioning"
                        checked={formData.has_air_conditioning}
                        onCheckedChange={(checked) => handleInputChange('has_air_conditioning', checked)}
                      />
                      <Label htmlFor="has_air_conditioning">Air conditioning</Label>
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
                        id="fire_extinguisher_available"
                        checked={formData.fire_extinguisher_available}
                        onCheckedChange={(checked) => handleInputChange('fire_extinguisher_available', checked)}
                      />
                      <Label htmlFor="fire_extinguisher_available">Fire extinguisher available</Label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="shared_laundry_room">Shared laundry room</Label>
                      <Select value={formData.shared_laundry_room} onValueChange={(value) => handleInputChange('shared_laundry_room', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="parking_available">Parking availability</Label>
                      <Select value={formData.parking_available} onValueChange={(value) => handleInputChange('parking_available', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="pets_allowed">Pets allowed</Label>
                      <Select value={formData.pets_allowed} onValueChange={(value) => handleInputChange('pets_allowed', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="breakfast_box_available">Breakfast box</Label>
                      <Select value={formData.breakfast_box_available} onValueChange={(value) => handleInputChange('breakfast_box_available', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              {/* Numa Standard Amenities */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg">
                  <h4 className="font-medium">🛎️ Numa Standard Amenities</h4>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_24_7_support"
                        checked={formData.has_24_7_support}
                        onCheckedChange={(checked) => handleInputChange('has_24_7_support', checked)}
                      />
                      <Label htmlFor="has_24_7_support">24/7 support</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_wifi"
                        checked={formData.has_wifi}
                        onCheckedChange={(checked) => handleInputChange('has_wifi', checked)}
                      />
                      <Label htmlFor="has_wifi">Wi-Fi</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="contactless_checkin"
                        checked={formData.contactless_checkin}
                        onCheckedChange={(checked) => handleInputChange('contactless_checkin', checked)}
                      />
                      <Label htmlFor="contactless_checkin">Contactless check-in</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="free_tea_coffee"
                        checked={formData.free_tea_coffee}
                        onCheckedChange={(checked) => handleInputChange('free_tea_coffee', checked)}
                      />
                      <Label htmlFor="free_tea_coffee">Free tea & coffee</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_shampoo_conditioner"
                        checked={formData.has_shampoo_conditioner}
                        onCheckedChange={(checked) => handleInputChange('has_shampoo_conditioner', checked)}
                      />
                      <Label htmlFor="has_shampoo_conditioner">Shampoo & conditioner</Label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              {/* Room-Specific Amenities */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted rounded-lg">
                  <h4 className="font-medium">🛏️ Room-Specific Amenities</h4>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="has_mini_fridge">Mini fridge</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_coffee_machine_kettle"
                        checked={formData.has_coffee_machine_kettle}
                        onCheckedChange={(checked) => handleInputChange('has_coffee_machine_kettle', checked)}
                      />
                      <Label htmlFor="has_coffee_machine_kettle">Coffee machine / Kettle</Label>
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
                      <Label htmlFor="has_cooking_essentials">Cooking essentials</Label>
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
                      <Label htmlFor="has_glasses_and_cups">Glasses and cups</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_hair_dryer"
                        checked={formData.has_hair_dryer}
                        onCheckedChange={(checked) => handleInputChange('has_hair_dryer', checked)}
                      />
                      <Label htmlFor="has_hair_dryer">Hair dryer</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="has_complimentary_water"
                        checked={formData.has_complimentary_water}
                        onCheckedChange={(checked) => handleInputChange('has_complimentary_water', checked)}
                      />
                      <Label htmlFor="has_complimentary_water">Complimentary water</Label>
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
                        id="has_work_station"
                        checked={formData.has_work_station}
                        onCheckedChange={(checked) => handleInputChange('has_work_station', checked)}
                      />
                      <Label htmlFor="has_work_station">Work station / Desk</Label>
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
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_sustainable_amenities"
                        checked={formData.is_sustainable_amenities}
                        onCheckedChange={(checked) => handleInputChange('is_sustainable_amenities', checked)}
                      />
                      <Label htmlFor="is_sustainable_amenities">Sustainable / eco-friendly amenities</Label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              {/* Rent Information */}
              <div className="space-y-4">
                <h4 className="font-medium">💶 Rent Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rent">Monthly rent (€)</Label>
                    <Input
                      id="rent"
                      type="number"
                      value={formData.rent || ''}
                      onChange={(e) => handleInputChange('rent', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="1200"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rent_is_from"
                        checked={formData.rent_is_from}
                        onCheckedChange={(checked) => handleInputChange('rent_is_from', checked)}
                      />
                      <Label htmlFor="rent_is_from">Display rent as "From €XXX"</Label>
                    </div>
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </div>
        );

      case 5: // Additional Costs
        return (
          <div className="space-y-6">
            <h3 className="font-medium">➕ Additional Fees, Discounts, Taxes</h3>
            
            {/* Additional Fees */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Additional Fees</Label>
                <Button variant="outline" size="sm" onClick={() => addItem('additional_fees')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Fee
                </Button>
              </div>
              {formData.additional_fees.map((fee) => (
                <div key={fee.id} className="grid grid-cols-4 gap-2 items-end mb-2">
                  <div>
                    <Label>Amount (€)</Label>
                    <Input
                      type="number"
                      value={fee.amount}
                      onChange={(e) => updateItem('additional_fees', fee.id, { amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Frequency</Label>
                    <Select value={fee.frequency} onValueChange={(value) => updateItem('additional_fees', fee.id, { frequency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-time">One-time</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={fee.description}
                      onChange={(e) => updateItem('additional_fees', fee.id, { description: e.target.value })}
                      placeholder="e.g. Internet"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => removeItem('additional_fees', fee.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Similar pattern for Discounts and Taxes... */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label>Discounts</Label>
                <Button variant="outline" size="sm" onClick={() => addItem('discounts')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Discount
                </Button>
              </div>
              {formData.discounts.map((discount) => (
                <div key={discount.id} className="grid grid-cols-4 gap-2 items-end mb-2">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={discount.name}
                      onChange={(e) => updateItem('discounts', discount.id, { name: e.target.value })}
                      placeholder="Student Discount"
                    />
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={discount.amount}
                      onChange={(e) => updateItem('discounts', discount.id, { amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={discount.isPercentage ? 'percentage' : 'fixed'} onValueChange={(value) => updateItem('discounts', discount.id, { isPercentage: value === 'percentage' })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">€ Fixed</SelectItem>
                        <SelectItem value="percentage">% Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => removeItem('discounts', discount.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 6: // Check-in/out & Agreements
        return (
          <div className="space-y-6">
            <h3 className="font-medium">🕒 Check-in / Check-out Times</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkin_time">Check-in Time</Label>
                <Input
                  id="checkin_time"
                  type="time"
                  value={formData.checkin_time}
                  onChange={(e) => handleInputChange('checkin_time', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="checkout_time">Check-out Time</Label>
                <Input
                  id="checkout_time"
                  type="time"
                  value={formData.checkout_time}
                  onChange={(e) => handleInputChange('checkout_time', e.target.value)}
                />
              </div>
            </div>

            <h3 className="font-medium">📄 Agreements</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Label>Terms and Conditions</Label>
                  <span className="text-red-500">*</span>
                </div>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Terms & Conditions
                  </Button>
                </div>
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <Label>Cancellation Policy</Label>
                  <span className="text-red-500">*</span>
                </div>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Cancellation Policy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 7: // Documents
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">📎 Required Documents</h3>
              <Button variant="outline" size="sm" onClick={() => addItem('required_documents')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </div>
            {formData.required_documents.map((doc) => (
              <div key={doc.id} className="grid grid-cols-3 gap-2 items-end">
                <div>
                  <Label>Document Title</Label>
                  <Input
                    value={doc.title}
                    onChange={(e) => updateItem('required_documents', doc.id, { title: e.target.value })}
                    placeholder="e.g. Passport"
                  />
                </div>
                <div>
                  <Label>Renter Type</Label>
                  <Select value={doc.renterType} onValueChange={(value) => updateItem('required_documents', doc.id, { renterType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Renters</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={() => removeItem('required_documents', doc.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        );

      case 8: // Beds
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">🛏️ Beds</h3>
              <Button variant="outline" size="sm" onClick={() => addItem('beds')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Bed
              </Button>
            </div>
            {formData.beds.map((bed) => (
              <div key={bed.id} className="grid grid-cols-4 gap-2 items-end">
                <div>
                  <Label>Bed Size</Label>
                  <Select value={bed.size} onValueChange={(value) => updateItem('beds', bed.id, { size: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                      <SelectItem value="queen">Queen</SelectItem>
                      <SelectItem value="king">King</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Room</Label>
                  <Select value={bed.room} onValueChange={(value) => updateItem('beds', bed.id, { room: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="room-1">Room 1</SelectItem>
                      <SelectItem value="room-2">Room 2</SelectItem>
                      <SelectItem value="room-3">Room 3</SelectItem>
                      <SelectItem value="living-room">Living Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bed Type</Label>
                  <Select value={bed.type} onValueChange={(value) => updateItem('beds', bed.id, { type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="sofa-bed">Sofa Bed</SelectItem>
                      <SelectItem value="bunk-bed">Bunk Bed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={() => removeItem('beds', bed.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        );

      case 9: // Landlord Info
        return (
          <div className="space-y-4">
            <h3 className="font-medium">👤 Landlord & Contractual Partner</h3>
            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="landlord_name">Landlord Name</Label>
                <span className="text-red-500">*</span>
              </div>
              <div className="flex space-x-2">
                <Input
                  id="landlord_name"
                  value={formData.landlord_name}
                  onChange={(e) => handleInputChange('landlord_name', e.target.value)}
                  placeholder="Search or enter landlord name"
                  className="flex-1"
                />
                <Button variant="outline">+ Create New</Button>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="contractual_partner">Contractual Partner</Label>
                <span className="text-red-500">*</span>
              </div>
              <div className="flex space-x-2">
                <Input
                  id="contractual_partner"
                  value={formData.contractual_partner}
                  onChange={(e) => handleInputChange('contractual_partner', e.target.value)}
                  placeholder="Search or enter contractual partner"
                  className="flex-1"
                />
                <Button variant="outline">+ Create New</Button>
              </div>
            </div>
          </div>
        );

      case 10: // WGSB
        return (
          <div className="space-y-4">
            <h3 className="font-medium">✅ WGSB</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="provides_wgsb"
                checked={formData.provides_wgsb}
                onCheckedChange={(checked) => handleInputChange('provides_wgsb', checked)}
              />
              <Label htmlFor="provides_wgsb">I provide a WGSB</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>WGSB is a legal document required for certain rental properties in Germany</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        );

      case 11: // Review
        return (
          <div className="space-y-6">
            <h3 className="font-medium">🧭 Review & Submit</h3>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Property Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Title:</strong> {formData.title}</p>
                    <p><strong>Type:</strong> {formData.apartment_type}</p>
                    <p><strong>Location:</strong> {formData.city}, {formData.country}</p>
                    <p><strong>Monthly Rent:</strong> €{formData.monthly_rent}</p>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1">
                  Preview Listing
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? 'Edit Property' : 'Add New Property'}</DialogTitle>
          <DialogDescription>
            {property ? 'Update your property details' : 'Create a new property listing step by step'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {steps.length}</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / steps.length) * 100)}% Complete</span>
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= step.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.id}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Current Step Info */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
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
                  Save Draft
                </Button>
                <Button
                  onClick={() => handleSave('published')}
                  disabled={loading || !formData.title || !formData.city}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Publish Now
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
      </DialogContent>
    </Dialog>
  );
};