import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  Edit, 
  RotateCcw, 
  MapPin, 
  Home, 
  Ruler, 
  Euro,
  Image as ImageIcon,
  Tag,
  FileText,
  Sparkles,
  Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AIPropertyPreviewProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
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
}

export const AIPropertyPreview: React.FC<AIPropertyPreviewProps> = ({
  isOpen,
  onOpenChange,
  propertyData,
  onEdit,
  onRegenerate,
  onSave
}) => {
  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified';
    return `€${amount.toLocaleString()}`;
  };

  const formatLocation = () => {
    const { location } = propertyData;
    if (!location) return 'Location not set';
    
    const parts = [
      location.street_name && location.street_number 
        ? `${location.street_name} ${location.street_number}` 
        : location.street_name,
      location.zip_code && location.city 
        ? `${location.zip_code} ${location.city}` 
        : location.city
    ].filter(Boolean);
    
    return parts.join(', ') || 'Location not set';
  };

  const PreviewField: React.FC<{
    title: string;
    content: string | string[] | undefined;
    icon: React.ReactNode;
    field: string;
    maxLines?: number;
  }> = ({ title, content, icon, field, maxLines = 3 }) => {
    const displayContent = Array.isArray(content) 
      ? content.join(', ') 
      : content || 'Not generated';
    
    const isGenerated = content && (Array.isArray(content) ? content.length > 0 : content.trim().length > 0);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium text-sm">{title}</span>
            {isGenerated && (
              <Badge variant="secondary" className="h-5">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(field)}
                className="h-7 px-2"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRegenerate(field)}
                className="h-7 px-2"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <div 
          className={`text-sm text-muted-foreground p-3 bg-muted/30 rounded-md ${
            maxLines ? `line-clamp-${maxLines}` : ''
          }`}
          style={maxLines ? { 
            display: '-webkit-box',
            WebkitLineClamp: maxLines,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          } : {}}
        >
          {displayContent}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            AI-Enhanced Property Preview
          </DialogTitle>
          <DialogDescription>
            Review your AI-generated property listing before saving or publishing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Title */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Property Listing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PreviewField
                title="Title"
                content={propertyData.title}
                icon={<Home className="h-4 w-4" />}
                field="title"
                maxLines={2}
              />
              
              <PreviewField
                title="Description"
                content={propertyData.description}
                icon={<FileText className="h-4 w-4" />}
                field="description"
                maxLines={4}
              />
              
              <PreviewField
                title="Summary"
                content={propertyData.summary}
                icon={<FileText className="h-4 w-4" />}
                field="summary"
                maxLines={3}
              />
            </CardContent>
          </Card>

          {/* SEO & Marketing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">SEO & Marketing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PreviewField
                title="Meta Description"
                content={propertyData.metaDescription}
                icon={<Tag className="h-4 w-4" />}
                field="metaDescription"
                maxLines={2}
              />
              
              <PreviewField
                title="Tags"
                content={propertyData.tags}
                icon={<Tag className="h-4 w-4" />}
                field="tags"
                maxLines={2}
              />
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Property Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium text-sm">Location</span>
                  </div>
                  <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-md">
                    {formatLocation()}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    <span className="font-medium text-sm">Monthly Rent</span>
                  </div>
                  <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-md">
                    {formatCurrency(propertyData.details?.monthly_rent)}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span className="font-medium text-sm">Type</span>
                  </div>
                  <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-md">
                    {propertyData.details?.apartment_type || 'Not specified'}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    <span className="font-medium text-sm">Size & Rooms</span>
                  </div>
                  <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-md">
                    {propertyData.details?.square_meters ? `${propertyData.details.square_meters}m²` : 'Not specified'}
                    {propertyData.details?.bedrooms && ` • ${propertyData.details.bedrooms} bed`}
                    {propertyData.details?.bathrooms && ` • ${propertyData.details.bathrooms} bath`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Captions */}
          {propertyData.imageCaptions && Object.keys(propertyData.imageCaptions).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Image Alt Text
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(propertyData.imageCaptions).map(([imageKey, caption], index) => (
                    <div key={imageKey} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">Image {index + 1}</div>
                        <div className="text-sm text-muted-foreground">{caption}</div>
                      </div>
                      <div className="flex gap-1">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(`imageCaption_${imageKey}`)}
                            className="h-7 px-2"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {onRegenerate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRegenerate(`imageCaption_${imageKey}`)}
                            className="h-7 px-2"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Continue Editing
            </Button>
            {onSave && (
              <Button onClick={onSave} className="min-w-32">
                <Clock className="h-4 w-4 mr-2" />
                Save & Publish
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};