import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Sparkles } from 'lucide-react';
import { AIPropertyPreview } from './AIPropertyPreview';

interface PropertyPreviewButtonProps {
  propertyData: {
    title?: string;
    description?: string;
    metaDescription?: string;
    summary?: string;
    tags?: string[];
    imageCaptions?: { [key: string]: string };
    location?: {
      street_name?: string;
      street_number?: string;
      city?: string;
      zip_code?: string;
    };
    details?: {
      bedrooms?: number;
      bathrooms?: number;
      square_meters?: number;
      monthly_rent?: number;
      apartment_type?: string;
    };
  };
  onEdit?: (field: string) => void;
  onRegenerate?: (field: string) => void;
  onSave?: () => void;
  disabled?: boolean;
}

export const PropertyPreviewButton: React.FC<PropertyPreviewButtonProps> = ({
  propertyData,
  onEdit,
  onRegenerate,
  onSave,
  disabled = false
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Check if any AI content has been generated
  const hasAIContent = !!(
    propertyData.title ||
    propertyData.description ||
    propertyData.metaDescription ||
    propertyData.summary ||
    (propertyData.tags && propertyData.tags.length > 0) ||
    (propertyData.imageCaptions && Object.keys(propertyData.imageCaptions).length > 0)
  );

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsPreviewOpen(true)}
        disabled={disabled || !hasAIContent}
        className="min-w-32"
      >
        <Eye className="h-4 w-4 mr-2" />
        Preview Listing
        {hasAIContent && <Sparkles className="h-3 w-3 ml-2" />}
      </Button>

      <AIPropertyPreview
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        propertyData={propertyData}
        onEdit={onEdit}
        onRegenerate={onRegenerate}
        onSave={onSave}
      />
    </>
  );
};