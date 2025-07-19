import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Eye, Merge, X, AlertTriangle } from 'lucide-react';
import {
  detectGlobalDuplicates,
  saveDuplicateGroups,
  getPendingDuplicateGroups,
  mergeDuplicateProperties,
  dismissDuplicateGroup,
  type GlobalDuplicateGroup
} from '@/services/globalDuplicateDetection';

interface PropertyComparisonProps {
  properties: any[];
  groupId: string;
  onMerge: () => void;
  onDismiss: () => void;
}

function PropertyComparison({ properties, groupId, onMerge, onDismiss }: PropertyComparisonProps) {
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [mergeReason, setMergeReason] = useState('');
  const [dismissNotes, setDismissNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleMerge = async () => {
    if (!selectedTarget) {
      toast({
        title: "Select Target",
        description: "Please select which property to keep as the main one.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const propertyIds = properties.map(p => p.id);
      await mergeDuplicateProperties(groupId, selectedTarget, propertyIds, mergeReason);
      
      toast({
        title: "Properties Merged",
        description: "Duplicate properties have been successfully merged."
      });
      
      onMerge();
    } catch (error) {
      console.error('Error merging properties:', error);
      toast({
        title: "Merge Failed",
        description: "Failed to merge properties. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = async () => {
    setIsProcessing(true);
    try {
      await dismissDuplicateGroup(groupId, dismissNotes);
      
      toast({
        title: "Group Dismissed",
        description: "Duplicate group has been marked as false positive."
      });
      
      onDismiss();
    } catch (error) {
      console.error('Error dismissing group:', error);
      toast({
        title: "Dismiss Failed",
        description: "Failed to dismiss duplicate group. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {properties.map((property, index) => (
          <Card key={property.id} className={`relative ${selectedTarget === property.id ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{property.title}</CardTitle>
                <Button
                  variant={selectedTarget === property.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTarget(property.id)}
                >
                  {selectedTarget === property.id ? "Selected" : "Select as Target"}
                </Button>
              </div>
              <CardDescription>
                Owner: {property.user_id} • Property #{index + 1}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Address:</span>
                  <p className="text-muted-foreground">
                    {property.street_number} {property.street_name}<br />
                    {property.zip_code} {property.city}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Specs:</span>
                  <p className="text-muted-foreground">
                    {property.bedrooms} bed • {property.bathrooms} bath<br />
                    {property.square_meters}m² • €{property.monthly_rent}/mo
                  </p>
                </div>
              </div>
              
              {property.property_media && property.property_media.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Photos:</span>
                  <div className="flex gap-2 mt-1">
                    {property.property_media.slice(0, 3).map((media: any) => (
                      <img
                        key={media.id}
                        src={media.url}
                        alt={media.title || 'Property photo'}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ))}
                    {property.property_media.length > 3 && (
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs">
                        +{property.property_media.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {property.description && (
                <div>
                  <span className="font-medium text-sm">Description:</span>
                  <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                    {property.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Merge className="h-4 w-4" />
              Merge Properties
            </h4>
            <Textarea
              placeholder="Reason for merging (optional)"
              value={mergeReason}
              onChange={(e) => setMergeReason(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={handleMerge} 
              disabled={isProcessing || !selectedTarget}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  <Merge className="h-4 w-4 mr-2" />
                  Merge Properties
                </>
              )}
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <X className="h-4 w-4" />
              Dismiss as False Positive
            </h4>
            <Textarea
              placeholder="Notes on why this is not a duplicate (optional)"
              value={dismissNotes}
              onChange={(e) => setDismissNotes(e.target.value)}
              rows={3}
            />
            <Button 
              variant="outline" 
              onClick={handleDismiss} 
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Dismissing...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Dismiss Group
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GlobalDuplicateDetection() {
  const [duplicateGroups, setDuplicateGroups] = useState<GlobalDuplicateGroup[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadPendingGroups = async () => {
    try {
      setIsLoading(true);
      const groups = await getPendingDuplicateGroups();
      setDuplicateGroups(groups);
    } catch (error) {
      console.error('Error loading pending groups:', error);
      toast({
        title: "Load Failed",
        description: "Failed to load pending duplicate groups.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runDuplicateDetection = async () => {
    setIsScanning(true);
    try {
      toast({
        title: "Scanning Started",
        description: "Starting global duplicate detection scan..."
      });

      const matches = await detectGlobalDuplicates();
      
      if (matches.length === 0) {
        toast({
          title: "No Duplicates Found",
          description: "No new duplicates were detected in the scan."
        });
      } else {
        await saveDuplicateGroups(matches);
        toast({
          title: "Duplicates Detected",
          description: `Found ${matches.length} potential duplicate groups.`
        });
        await loadPendingGroups();
      }
    } catch (error) {
      console.error('Error during duplicate detection:', error);
      toast({
        title: "Scan Failed",
        description: "Failed to complete duplicate detection scan.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    loadPendingGroups();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Global Duplicate Detection</h2>
          <p className="text-muted-foreground">
            Detect and manage duplicate properties across all user accounts
          </p>
        </div>
        <Button 
          onClick={runDuplicateDetection} 
          disabled={isScanning}
          size="lg"
        >
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Run Duplicate Scan
            </>
          )}
        </Button>
      </div>

      {duplicateGroups.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <Eye className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">No Pending Duplicates</h3>
              <p className="text-muted-foreground">
                No duplicate groups are currently pending review.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <span className="font-medium">
              {duplicateGroups.length} pending duplicate group{duplicateGroups.length !== 1 ? 's' : ''} require review
            </span>
          </div>

          {duplicateGroups.map((group) => (
            <Card key={group.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    Duplicate Group #{group.id.slice(-8)}
                    <Badge variant="secondary">
                      {group.confidence_score}% confidence
                    </Badge>
                  </CardTitle>
                  <Badge variant="outline">
                    {group.properties?.length || 0} properties
                  </Badge>
                </div>
                <CardDescription>
                  Detected on {new Date(group.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PropertyComparison
                  properties={group.properties || []}
                  groupId={group.id}
                  onMerge={loadPendingGroups}
                  onDismiss={loadPendingGroups}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}