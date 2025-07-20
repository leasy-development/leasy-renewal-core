import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PropertyFormSidebar } from "@/components/PropertyFormSidebar";
import { BasicDetailsSection } from "@/components/property-form/BasicDetailsSection";
import { LocationSection } from "@/components/property-form/LocationSection";
import { PricingSection } from "@/components/property-form/PricingSection";
import { MediaSection } from "@/components/property-form/MediaSection";
import { FeesSection } from "@/components/property-form/FeesSection";
import { AmenitiesSection } from "@/components/property-form/AmenitiesSection";
import { PoliciesSection } from "@/components/property-form/PoliciesSection";
import { RoomsSection } from "@/components/property-form/RoomsSection";
import { FloatingActions } from "@/components/property-form/FloatingActions";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type AdditionalFee = {
  id: string;
  amount: number;
  frequency: string;
  description: string;
}

interface LandlordInfo {
  name: string;
  email: string;
  phone: string;
}

interface ContractualPartner {
  name: string;
  email: string;
  phone: string;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  apartment_type: string;
  street_number: string;
  street_name: string;
  city: string;
  region: string;
  zip_code: string;
  country: string;
  monthly_rent: number;
  weekly_rate: number;
  daily_rate: number;
  checkin_time: string;
  checkout_time: string;
  status: string;
  provides_wgsb: boolean;
  photos: File[];
  amenities: string[];
  house_rules: string;
  additional_fees: AdditionalFee[];
  landlord_info: LandlordInfo;
  contractual_partner: ContractualPartner;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  square_meters: number;
  beds: any[];
  discounts: any[];
  taxes: any[];
  required_documents: any[];
}

const AddProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditing = Boolean(id);
  
  const [activeSection, setActiveSection] = useState('basic');
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [loadingProperty, setLoadingProperty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "",
    apartment_type: "",
    street_number: "",
    street_name: "",
    city: "",
    region: "",
    zip_code: "",
    country: "Germany",
    monthly_rent: 0,
    weekly_rate: 0,
    daily_rate: 0,
    checkin_time: "",
    checkout_time: "",
    status: "draft",
    provides_wgsb: false,
    photos: [],
    amenities: [],
    house_rules: "",
    additional_fees: [],
    landlord_info: { name: "", email: "", phone: "" },
    contractual_partner: { name: "", email: "", phone: "" },
    bedrooms: 0,
    bathrooms: 0,
    max_guests: 0,
    square_meters: 0,
    beds: [],
    discounts: [],
    taxes: [],
    required_documents: [],
  });

  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const addItem = (field: 'additional_fees' | 'discounts' | 'taxes' | 'required_documents' | 'beds') => {
    const newItem = (() => {
      switch (field) {
        case 'additional_fees':
          return { id: Date.now().toString(), amount: 0, frequency: 'monthly', description: '' };
        case 'beds':
          return { id: Date.now().toString(), type: 'single', count: 1 };
        default:
          return { id: Date.now().toString() };
      }
    })();
    
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], newItem]
    }));
    setIsDirty(true);
  };

  const removeItem = (field: 'additional_fees' | 'discounts' | 'taxes' | 'required_documents' | 'beds', id: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((item: any) => item.id !== id)
    }));
    setIsDirty(true);
  };

  const updateItem = (field: 'additional_fees' | 'discounts' | 'taxes' | 'required_documents' | 'beds', id: string, updates: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item: any) => 
        item.id === id ? { ...item, ...updates } : item
      )
    }));
    setIsDirty(true);
  };

  // Load existing property for editing
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
            setFormData(prev => ({
              ...prev,
              ...data,
              photos: [],
              amenities: [],
              landlord_info: (typeof data.landlord_info === 'object' && data.landlord_info) ? data.landlord_info as unknown as LandlordInfo : { name: "", email: "", phone: "" },
              contractual_partner: (typeof data.contractual_partner === 'object' && data.contractual_partner) ? data.contractual_partner as unknown as ContractualPartner : { name: "", email: "", phone: "" },
            }));
            setIsDirty(false);
          }
        } catch (error: any) {
          console.error('Error loading property:', error);
          toast({
            title: "Error Loading Property",
            description: error.message || "Failed to load property details",
            variant: "destructive",
          });
        } finally {
          setLoadingProperty(false);
        }
      };

      loadProperty();
    }
  }, [isEditing, id, user, toast]);

  const handleSave = async (status = 'draft') => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to save properties",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      let error;
      let propertyId = id;
      
      // Extract fields that don't belong in properties table
      const { additional_fees, discounts, taxes, required_documents, beds, photos, amenities, ...propertyData } = formData;
      
      if (isEditing && id) {
        // Update existing property
        const { error: updateError } = await supabase
          .from('properties')
          .update({
            ...propertyData,
            landlord_info: formData.landlord_info as any,
            contractual_partner: formData.contractual_partner as any,
            status,
          })
          .eq('id', id);
        error = updateError;
      } else {
        // Create new property
        const { data, error: insertError } = await supabase
          .from('properties')
          .insert({
            ...propertyData,
            landlord_info: formData.landlord_info as any,
            contractual_partner: formData.contractual_partner as any,
            user_id: user.id,
            status,
          })
          .select()
          .single();
        
        if (data) {
          propertyId = data.id;
        }
        error = insertError;
      }

      if (error) throw error;

      // Handle additional fees
      if (propertyId && additional_fees.length > 0) {
        // Delete existing fees for this property
        await supabase
          .from('property_fees')
          .delete()
          .eq('property_id', propertyId);

        // Insert new fees
        const feesToInsert = additional_fees.map(fee => ({
          property_id: propertyId,
          name: fee.description,
          amount: fee.amount,
          frequency: fee.frequency
        }));

        const { error: feesError } = await supabase
          .from('property_fees')
          .insert(feesToInsert);

        if (feesError) throw feesError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Property ${isEditing ? 'updated' : status === 'draft' ? 'saved as draft' : 'published'} successfully`,
      });

      setIsDirty(false);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving property:', error);
      
      let errorMessage = `Failed to ${isEditing ? 'update' : 'save'} property`;
      let errorDetails = '';

      if (error?.message) {
        if (error.message.includes('duplicate key value')) {
          errorMessage = 'Duplicate Property';
          errorDetails = 'A property with this information already exists. Please check your entries.';
        } else if (error.message.includes('violates not-null constraint')) {
          errorMessage = 'Missing Required Fields';
          errorDetails = 'Please fill in all required fields before saving.';
        } else if (error.message.includes('permission denied')) {
          errorMessage = 'Permission Denied';
          errorDetails = 'You do not have permission to perform this action.';
        } else if (error.message.includes('invalid input syntax')) {
          errorMessage = 'Invalid Data Format';
          errorDetails = 'Please check your data format and try again.';
        } else {
          errorDetails = `Technical details: ${error.message}`;
        }
      }

      toast({
        title: errorMessage,
        description: errorDetails,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderSection = () => {
    const sectionProps = {
      formData,
      updateFormData,
      addItem,
      removeItem,
      updateItem,
      propertyId: id, // Pass the property ID for editing mode
    };

    switch (activeSection) {
      case 'basic':
        return <BasicDetailsSection {...sectionProps} />;
      case 'location':
        return <LocationSection {...sectionProps} />;
      case 'pricing':
        return <PricingSection {...sectionProps} />;
      case 'media':
        return <MediaSection {...sectionProps} />;
      case 'fees':
        return <FeesSection {...sectionProps} />;
      case 'amenities':
        return <AmenitiesSection {...sectionProps} />;
      case 'policies':
        return <PoliciesSection {...sectionProps} />;
      case 'rooms':
        return <RoomsSection {...sectionProps} />;
      default:
        return <BasicDetailsSection {...sectionProps} />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please log in to access the property form.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingProperty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading property details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container flex h-14 items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-lg font-semibold">
            {isEditing ? 'Edit Property' : 'Add New Property'}
          </h1>
          <div className="ml-auto flex items-center space-x-4">
            <Link 
              to="/analytics" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Analytics
            </Link>
            <Link 
              to="/account" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Account
            </Link>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        <PropertyFormSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          completedSections={completedSections}
          className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto"
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-4xl py-8">
            {renderSection()}
          </div>
        </main>
      </div>

      {/* Floating Actions */}
      <FloatingActions
        onSaveDraft={() => handleSave('draft')}
        onPublish={() => handleSave('active')}
        isLoading={isSaving}
        isDirty={isDirty}
      />
    </div>
  );
};

export default AddProperty;