import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  SkipForward,
  Download,
  Bot,
  MapPin,
  Home,
  Euro,
  Maximize2
} from "lucide-react";
import { DuplicateMatch, PropertyForDetection } from "@/lib/duplicateDetection";

interface DuplicateDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: { property: PropertyForDetection; matches: DuplicateMatch[]; index: number }[];
  onResolve: (decisions: { [index: number]: 'import' | 'skip' }) => void;
}

export const DuplicateDetectionModal = ({ 
  isOpen, 
  onClose, 
  duplicates, 
  onResolve 
}: DuplicateDetectionModalProps) => {
  const [decisions, setDecisions] = useState<{ [index: number]: 'import' | 'skip' }>({});
  const [selectedProperty, setSelectedProperty] = useState<number>(0);

  const currentDuplicate = duplicates[selectedProperty];
  const totalDuplicates = duplicates.filter(d => d.matches.some(m => m.status === 'duplicate')).length;
  const totalPotential = duplicates.filter(d => d.matches.some(m => m.status === 'potential')).length;

  const handleDecision = (index: number, decision: 'import' | 'skip') => {
    setDecisions(prev => ({ ...prev, [index]: decision }));
  };

  const handleResolveAll = () => {
    onResolve(decisions);
    onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'duplicate':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'potential':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: string, score: number) => {
    switch (status) {
      case 'duplicate':
        return <Badge variant="destructive">{score}% Duplicate</Badge>;
      case 'potential':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">{score}% Potential</Badge>;
      default:
        return <Badge variant="outline">{score}% Unique</Badge>;
    }
  };

  if (!isOpen || duplicates.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>Duplicate Detection Results</span>
          </DialogTitle>
          <DialogDescription>
            Found {totalDuplicates} confirmed duplicates and {totalPotential} potential matches. 
            Review each case and decide whether to import or skip.
          </DialogDescription>
        </DialogHeader>

        {/* Summary Alert */}
        <Alert className="border-l-4 border-l-orange-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>{duplicates.length} properties need review</strong>
                <p className="text-sm mt-1">
                  {totalDuplicates} high-confidence duplicates, {totalPotential} potential matches
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => duplicates.forEach((_, index) => handleDecision(index, 'skip'))}
                >
                  Skip All Duplicates
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => duplicates.forEach((_, index) => handleDecision(index, 'import'))}
                >
                  Import All Anyway
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property List */}
          <div className="space-y-3">
            <h3 className="font-medium">Properties to Review</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {duplicates.map((dup, index) => {
                const highestMatch = dup.matches[0];
                const decision = decisions[index];
                
                return (
                  <Card 
                    key={index} 
                    className={`cursor-pointer transition-colors ${
                      selectedProperty === index ? 'ring-2 ring-primary' : ''
                    } ${decision === 'skip' ? 'opacity-50' : ''}`}
                    onClick={() => setSelectedProperty(index)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{dup.property.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {dup.property.city} • €{dup.property.monthly_rent}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusIcon(highestMatch?.status || 'unique')}
                            {getStatusBadge(highestMatch?.status || 'unique', highestMatch?.matchScore || 0)}
                          </div>
                        </div>
                        {decision && (
                          <div className="ml-2">
                            {decision === 'import' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Detailed View */}
          <div className="lg:col-span-2 space-y-4">
            {currentDuplicate && (
              <>
                {/* Property Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{currentDuplicate.property.title}</CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant={decisions[selectedProperty] === 'import' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleDecision(selectedProperty, 'import')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Import Anyway
                        </Button>
                        <Button
                          variant={decisions[selectedProperty] === 'skip' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => handleDecision(selectedProperty, 'skip')}
                        >
                          <SkipForward className="h-4 w-4 mr-2" />
                          Skip
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* AI Suggestion */}
                {currentDuplicate.matches[0]?.aiSuggestion && (
                  <Alert className="border-l-4 border-l-blue-500">
                    <Bot className="h-4 w-4" />
                    <AlertDescription>
                      <strong>AI Analysis:</strong> {currentDuplicate.matches[0].aiSuggestion}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Matches */}
                <div className="space-y-3">
                  <h4 className="font-medium">Potential Matches ({currentDuplicate.matches.length})</h4>
                  
                  {currentDuplicate.matches.map((match, matchIndex) => (
                    <Card key={matchIndex} className="border-l-4 border-l-orange-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{match.existingProperty.title}</CardTitle>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(match.status, match.matchScore)}
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Comparison */}
                        <Tabs defaultValue="overview" className="w-full">
                          <TabsList>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="details">Match Details</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="overview" className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <h5 className="font-medium text-green-700 mb-2">New Property</h5>
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <MapPin className="h-3 w-3" />
                                    <span>{currentDuplicate.property.city}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Euro className="h-3 w-3" />
                                    <span>€{currentDuplicate.property.monthly_rent}/month</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Home className="h-3 w-3" />
                                    <span>{currentDuplicate.property.bedrooms} bed, {currentDuplicate.property.bathrooms} bath</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Maximize2 className="h-3 w-3" />
                                    <span>{currentDuplicate.property.square_meters}m²</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h5 className="font-medium text-blue-700 mb-2">Existing Property</h5>
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <MapPin className="h-3 w-3" />
                                    <span>{match.existingProperty.city}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Euro className="h-3 w-3" />
                                    <span>€{match.existingProperty.monthly_rent}/month</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Home className="h-3 w-3" />
                                    <span>{match.existingProperty.bedrooms} bed, {match.existingProperty.bathrooms} bath</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Maximize2 className="h-3 w-3" />
                                    <span>{match.existingProperty.square_meters}m²</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="details" className="space-y-3">
                            {match.matchReasons.map((reason, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{reason.parameter}</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-muted-foreground">{reason.weight}% weight</span>
                                    <Badge variant="outline">{Math.round(reason.score)}%</Badge>
                                  </div>
                                </div>
                                <Progress value={reason.score} className="h-2" />
                                <p className="text-xs text-muted-foreground">{reason.details}</p>
                              </div>
                            ))}
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Resolved: {Object.keys(decisions).length}/{duplicates.length} properties
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleResolveAll}
              disabled={Object.keys(decisions).length < duplicates.length}
            >
              Apply Decisions ({Object.keys(decisions).length}/{duplicates.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};