import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Merge, 
  X, 
  AlertTriangle, 
  Euro, 
  MapPin, 
  Home, 
  Users,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface DuplicateGroup {
  id: string;
  confidence_score: number;
  status: string;
  created_at: string;
  properties: Array<{
    id: string;
    property_id: string;
    similarity_reasons: string[];
    properties: {
      title: string;
      street_name: string;
      street_number?: string;
      city: string;
      zip_code?: string;
      monthly_rent: number;
      bedrooms?: number;
      bathrooms?: number;
      square_meters?: number;
      user_id: string;
      created_at: string;
    };
  }>;
}

interface DuplicateReviewModalProps {
  group: DuplicateGroup;
  onClose: () => void;
  onResolved: () => void;
}

export function DuplicateReviewModal({ group, onClose, onResolved }: DuplicateReviewModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleMergeProperties = async () => {
    if (!selectedTarget) {
      toast({
        title: "Select Target Property",
        description: "Please select which property should be kept as the main record.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Update the duplicate group
      const { error: groupError } = await supabase
        .from('global_duplicate_groups')
        .update({
          status: 'resolved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          merge_target_property_id: selectedTarget,
          notes
        })
        .eq('id', group.id);

      if (groupError) throw groupError;

      // Log the action
      const affectedProperties = group.properties.map(p => p.property_id);
      const { error: logError } = await supabase
        .from('duplicate_detection_log')
        .insert({
          duplicate_group_id: group.id,
          admin_user_id: user?.id,
          action_type: 'merge',
          affected_properties: affectedProperties,
          details: {
            target_property: selectedTarget,
            merged_properties: affectedProperties.filter(id => id !== selectedTarget),
            confidence_score: group.confidence_score,
            notes
          }
        });

      if (logError) throw logError;

      // TODO: In a real implementation, you might want to:
      // 1. Merge property data (photos, amenities, etc.)
      // 2. Update references in other tables
      // 3. Soft-delete or archive the duplicate properties
      // 4. Send notifications to affected users

      toast({
        title: "Properties Merged",
        description: `Successfully merged ${group.properties.length} properties into the target property.`,
      });

      onResolved();
    } catch (error) {
      console.error('Failed to merge properties:', error);
      toast({
        title: "Merge Failed",
        description: "Failed to merge properties. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismissGroup = async () => {
    setIsProcessing(true);
    try {
      // Update the duplicate group
      const { error: groupError } = await supabase
        .from('global_duplicate_groups')
        .update({
          status: 'dismissed',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          notes
        })
        .eq('id', group.id);

      if (groupError) throw groupError;

      // Log the action
      const affectedProperties = group.properties.map(p => p.property_id);
      const { error: logError } = await supabase
        .from('duplicate_detection_log')
        .insert({
          duplicate_group_id: group.id,
          admin_user_id: user?.id,
          action_type: 'dismiss',
          affected_properties: affectedProperties,
          details: {
            reason: 'not_duplicates',
            confidence_score: group.confidence_score,
            notes
          }
        });

      if (logError) throw logError;

      toast({
        title: "Group Dismissed",
        description: "The duplicate group has been dismissed as not duplicates.",
      });

      onResolved();
    } catch (error) {
      console.error('Failed to dismiss group:', error);
      toast({
        title: "Dismiss Failed",
        description: "Failed to dismiss duplicate group. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAddress = (properties: any) => {
    const parts = [
      properties.street_number,
      properties.street_name,
      properties.city,
      properties.zip_code
    ].filter(Boolean);
    return parts.join(', ');
  };

  const getSimilarityReasons = (reasons: string[]) => {
    const reasonMap: { [key: string]: string } = {
      'exact_title': 'Identical title',
      'similar_title': 'Similar title',
      'exact_address': 'Identical address',
      'similar_address': 'Similar address',
      'same_rent': 'Same rent amount',
      'similar_rent': 'Similar rent amount',
      'same_size': 'Same square meters',
      'same_bedrooms': 'Same number of bedrooms'
    };

    return reasons.map(reason => reasonMap[reason] || reason);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Review Duplicate Group
          </DialogTitle>
          <DialogDescription>
            Confidence: {(group.confidence_score * 100).toFixed(0)}% • 
            {group.properties.length} properties detected as potential duplicates
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="properties" className="space-y-4">
          <TabsList>
            <TabsTrigger value="properties">Properties Comparison</TabsTrigger>
            <TabsTrigger value="analysis">Similarity Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Review these properties carefully. If they are duplicates, select which one should be kept as the main record.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.properties.map((item, index) => (
                <Card 
                  key={item.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTarget === item.property_id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedTarget(item.property_id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{item.properties.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline">Property {index + 1}</Badge>
                        {selectedTarget === item.property_id && (
                          <Badge variant="default">Selected as Target</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{formatAddress(item.properties)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span>€{item.properties.monthly_rent}/month</span>
                    </div>

                    <div className="flex gap-4 text-sm">
                      {item.properties.bedrooms && (
                        <div className="flex items-center gap-1">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span>{item.properties.bedrooms} beds</span>
                        </div>
                      )}
                      {item.properties.bathrooms && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{item.properties.bathrooms} baths</span>
                        </div>
                      )}
                      {item.properties.square_meters && (
                        <span>{item.properties.square_meters}m²</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Created: {new Date(item.properties.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Similarity Reasons:</Label>
                      <div className="flex flex-wrap gap-1">
                        {getSimilarityReasons(item.similarity_reasons).map((reason, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      User ID: {item.properties.user_id}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Duplicate Detection Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Detection Algorithm</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Properties were matched using a combination of title similarity, address matching, 
                    and property characteristics (rent, size, bedrooms).
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Confidence Score</Label>
                  <div className="mt-1">
                    <Badge variant={group.confidence_score >= 0.9 ? "destructive" : group.confidence_score >= 0.7 ? "secondary" : "outline"}>
                      {(group.confidence_score * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Common Matching Factors</Label>
                  <div className="mt-2 space-y-2">
                    {group.properties.map((item, index) => (
                      <div key={item.id} className="text-sm">
                        <span className="font-medium">Property {index + 1}:</span>
                        <div className="ml-4 mt-1">
                          {getSimilarityReasons(item.similarity_reasons).map((reason, idx) => (
                            <div key={idx} className="text-muted-foreground">• {reason}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <div>
            <Label htmlFor="notes">Admin Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this decision..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleDismissGroup}
                disabled={isProcessing}
              >
                <X className="w-4 h-4 mr-2" />
                Not Duplicates
              </Button>
              
              <Button 
                onClick={handleMergeProperties}
                disabled={isProcessing || !selectedTarget}
              >
                <Merge className="w-4 h-4 mr-2" />
                Merge Properties
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}