import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  weekly_rate: number | null;
  daily_rate: number | null;
  checkin_time: string;
  checkout_time: string;
  provides_wgsb: boolean;
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
  weekly_rate: null,
  daily_rate: null,
  checkin_time: '',
  checkout_time: '',
  provides_wgsb: false,
};

const steps = [
  { id: 1, title: 'Basic Details', description: 'Property type and description' },
  { id: 2, title: 'Address', description: 'Location information' },
  { id: 3, title: 'Rental Fees', description: 'Pricing and rates' },
  { id: 4, title: 'Terms', description: 'Check-in/out and legal info' },
];

export const AddPropertyModal = ({ isOpen, onClose }: AddPropertyModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
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
      const { error } = await supabase
        .from('properties')
        .insert({
          ...formData,
          user_id: user.id,
          status,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Property ${status === 'draft' ? 'saved as draft' : 'published'} successfully`,
      });

      // Reset form and close modal
      setFormData(initialFormData);
      setCurrentStep(1);
      onClose();
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: "Error",
        description: "Failed to save property",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
    onClose();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apartment_type">Apartment Type</Label>
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
              <Label htmlFor="title">Title</Label>
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
              <Label htmlFor="category">Category</Label>
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street_number">Street Number</Label>
                <Input
                  id="street_number"
                  value={formData.street_number}
                  onChange={(e) => handleInputChange('street_number', e.target.value)}
                  placeholder="123"
                />
              </div>
              <div>
                <Label htmlFor="street_name">Street Name</Label>
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
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Berlin"
                  required
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

      case 3:
        return (
          <div className="space-y-4">
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
              <Label htmlFor="weekly_rate">Weekly Rate (€)</Label>
              <Input
                id="weekly_rate"
                type="number"
                value={formData.weekly_rate || ''}
                onChange={(e) => handleInputChange('weekly_rate', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="300"
              />
            </div>

            <div>
              <Label htmlFor="daily_rate">Daily Rate (€) - Optional</Label>
              <Input
                id="daily_rate"
                type="number"
                value={formData.daily_rate || ''}
                onChange={(e) => handleInputChange('daily_rate', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="50"
              />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Additional fees can be added after creating the property.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="provides_wgsb"
                checked={formData.provides_wgsb}
                onChange={(e) => handleInputChange('provides_wgsb', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="provides_wgsb">I provide a WGSB</Label>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Documents, landlord information, and additional terms can be added after creating the property.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Property</DialogTitle>
          <DialogDescription>
            Create a new property listing step by step
          </DialogDescription>
        </DialogHeader>

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
        <div className="flex items-center justify-between">
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