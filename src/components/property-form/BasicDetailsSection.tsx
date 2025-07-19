import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MissingTranslationStatus } from "@/components/MissingTranslationStatus";
import { IntelligentTranslationService } from "@/services/intelligentTranslation";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { useState } from "react";

interface BasicDetailsSectionProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  propertyId?: string;
}

export function BasicDetailsSection({ formData, updateFormData, propertyId }: BasicDetailsSectionProps) {
  const { user } = useAuth();
  const [isGeneratingTranslation, setIsGeneratingTranslation] = useState(false);

  const handleGenerateMissingTranslation = async (targetLanguage: 'de' | 'en') => {
    if (!propertyId || !user) {
      toast.error('Property must be saved before generating translations');
      return;
    }

    setIsGeneratingTranslation(true);
    try {
      await IntelligentTranslationService.updatePropertyTranslations(propertyId, user.id);
      toast.success(`Generated ${targetLanguage === 'de' ? 'German' : 'English'} translation successfully`);
      // Optionally refresh the form data here
    } catch (error) {
      console.error('Translation generation failed:', error);
      toast.error('Failed to generate translation');
    } finally {
      setIsGeneratingTranslation(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Basic Details</h2>
        <p className="text-muted-foreground">Enter the basic information about your property</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Property Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="e.g., Modern 2BR Apartment in City Center"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => updateFormData('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="room">Room</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="shared">Shared Space</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Describe your property, its features, and what makes it special..."
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="apartment_type">Apartment Type</Label>
              <Input
                id="apartment_type"
                value={formData.apartment_type}
                onChange={(e) => updateFormData('apartment_type', e.target.value)}
                placeholder="e.g., 2 Bedroom, Studio, Penthouse"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Translation Status */}
      {(formData.title || formData.description) && (
        <MissingTranslationStatus
          property={formData}
          onGenerateMissing={handleGenerateMissingTranslation}
          isGenerating={isGeneratingTranslation}
        />
      )}
    </div>
  );
}