import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { AIDescriptionModal } from '@/components/AIDescriptionModal';
import { 
  Wand2, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Euro,
  Edit,
  MoreVertical,
  Image
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface PropertyData {
  id: string;
  title: string;
  description?: string;
  street_name?: string;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_meters?: number;
  monthly_rent?: number;
  weekly_rate?: number;
  daily_rate?: number;
  apartment_type?: string;
  category?: string;
  status?: string;
}

interface PropertyCardProps {
  property: PropertyData;
  onUpdate: (property: PropertyData) => void;
  onEdit?: (property: PropertyData) => void;
  showActions?: boolean;
}

export function PropertyCard({ property, onUpdate, onEdit, showActions = true }: PropertyCardProps) {
  const [showAIModal, setShowAIModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAIDescriptionSave = (description: string) => {
    onUpdate({ ...property, description });
    
    toast({
      title: "✨ Description Updated",
      description: "AI-generated description saved successfully",
    });
  };

  const formatPrice = () => {
    if (property.monthly_rent) return `€${property.monthly_rent}/month`;
    if (property.weekly_rate) return `€${property.weekly_rate}/week`;
    if (property.daily_rate) return `€${property.daily_rate}/night`;
    return 'Price on request';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const hasMinimalDescription = !property.description || property.description.length < 20;

  return (
    <>
      <Card className="group hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">{property.title}</CardTitle>
              {property.street_name && property.city && (
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {property.street_name}, {property.city}
                </CardDescription>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {property.status && (
                <Badge variant="secondary" className="text-xs">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(property.status)} mr-1`} />
                  {property.status}
                </Badge>
              )}
              
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(property)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Property
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowAIModal(true)}>
                      <Wand2 className="w-4 h-4 mr-2" />
                      {hasMinimalDescription ? 'Generate' : 'Regenerate'} Description
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Property Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {property.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                {property.bedrooms}
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                {property.bathrooms}
              </div>
            )}
            {property.square_meters && (
              <div className="flex items-center gap-1">
                <Square className="w-4 h-4" />
                {property.square_meters}m²
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            {property.description ? (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {property.description}
              </p>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border-dashed border-2">
                <Wand2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">No description yet</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAIModal(true)}
                  className="ml-auto text-xs"
                >
                  Generate with AI
                </Button>
              </div>
            )}
            
            {hasMinimalDescription && property.description && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Brief description
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAIModal(true)}
                  className="text-xs h-6 px-2"
                >
                  <Wand2 className="w-3 h-3 mr-1" />
                  Enhance with AI
                </Button>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1 font-semibold text-primary">
              <Euro className="w-4 h-4" />
              {formatPrice()}
            </div>
            
            {property.apartment_type && (
              <Badge variant="secondary" className="text-xs">
                {property.apartment_type}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Description Modal */}
      <AIDescriptionModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        property={property}
        onSave={handleAIDescriptionSave}
      />
    </>
  );
}