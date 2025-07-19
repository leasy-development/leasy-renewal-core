import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  Wand2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  FileText,
  Clock
} from 'lucide-react';

interface AIBulkDescriptionGeneratorProps {
  onComplete?: (results: any) => void;
}

interface GenerationProgress {
  current: number;
  total: number;
  currentProperty: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
}

interface GenerationResults {
  totalProperties: number;
  generated: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export function AIBulkDescriptionGenerator({ onComplete }: AIBulkDescriptionGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>({
    current: 0,
    total: 0,
    currentProperty: '',
    status: 'idle'
  });
  const [results, setResults] = useState<GenerationResults | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const generateBulkDescriptions = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate descriptions",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setResults(null);
    
    const generationResults: GenerationResults = {
      totalProperties: 0,
      generated: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    try {
      // Get properties that need descriptions (empty or very short)
      const { data: properties, error: fetchError } = await supabase
        .from('properties')
        .select('id, title, description, street_name, city, bedrooms, bathrooms, square_meters, monthly_rent, weekly_rate, daily_rate, apartment_type, category')
        .eq('user_id', user.id)
        .or('description.is.null,description.eq.""');

      if (fetchError) throw fetchError;

      if (!properties || properties.length === 0) {
        toast({
          title: "No Properties Found",
          description: "All your properties already have descriptions",
        });
        setIsGenerating(false);
        return;
      }

      // Filter properties that actually need descriptions
      const propertiesNeedingDescriptions = properties.filter(p => 
        !p.description || p.description.trim().length < 20
      );

      generationResults.totalProperties = propertiesNeedingDescriptions.length;

      setProgress({
        current: 0,
        total: propertiesNeedingDescriptions.length,
        currentProperty: '',
        status: 'generating'
      });

      // Process properties in batches to avoid overwhelming the API
      const BATCH_SIZE = 3;
      for (let i = 0; i < propertiesNeedingDescriptions.length; i += BATCH_SIZE) {
        const batch = propertiesNeedingDescriptions.slice(i, i + BATCH_SIZE);
        
        // Process batch in parallel
        const batchPromises = batch.map(async (property, batchIndex) => {
          const currentIndex = i + batchIndex;
          
          setProgress(prev => ({
            ...prev,
            current: currentIndex + 1,
            currentProperty: property.title
          }));

          try {
            const { data, error } = await supabase.functions.invoke('generate-property-description', {
              body: {
                property: {
                  title: property.title,
                  street_name: property.street_name,
                  city: property.city,
                  bedrooms: property.bedrooms,
                  bathrooms: property.bathrooms,
                  square_meters: property.square_meters,
                  monthly_rent: property.monthly_rent,
                  weekly_rate: property.weekly_rate,
                  daily_rate: property.daily_rate,
                  apartment_type: property.apartment_type,
                  category: property.category,
                  description: property.description
                },
                tone: 'professional and premium',
                format: 'html',
                language: 'en',
                maxLength: 400,
                includeFeatures: true
              }
            });

            if (error) throw error;

            if (data?.description) {
              // Update property with generated description
              const { error: updateError } = await supabase
                .from('properties')
                .update({ description: data.description })
                .eq('id', property.id);

              if (updateError) throw updateError;

              generationResults.generated++;
              generationResults.updated++;
            } else {
              generationResults.skipped++;
            }

          } catch (error) {
            generationResults.failed++;
            generationResults.errors.push(`${property.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });

        await Promise.all(batchPromises);

        // Small delay between batches
        if (i + BATCH_SIZE < propertiesNeedingDescriptions.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setResults(generationResults);
      
      setProgress(prev => ({
        ...prev,
        status: 'completed',
        currentProperty: ''
      }));

      toast({
        title: "✨ Bulk Generation Complete",
        description: `Generated descriptions for ${generationResults.generated} properties`,
      });

      onComplete?.(generationResults);

    } catch (error) {
      console.error('Bulk description generation failed:', error);
      
      setProgress(prev => ({
        ...prev,
        status: 'error'
      }));

      generationResults.errors.push(error instanceof Error ? error.message : 'Unknown error');
      setResults(generationResults);
      
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'generating': return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Wand2 className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          AI Bulk Description Generator
        </CardTitle>
        <CardDescription>
          Generate professional descriptions for all properties missing descriptions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button 
          onClick={generateBulkDescriptions}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating Descriptions...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate All Missing Descriptions
            </>
          )}
        </Button>

        {/* Progress Indicator */}
        {isGenerating && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">
                Processing {progress.current} of {progress.total} properties
              </span>
            </div>
            
            <Progress 
              value={(progress.current / progress.total) * 100} 
              className="w-full"
            />
            
            {progress.currentProperty && (
              <p className="text-xs text-muted-foreground">
                Currently: {progress.currentProperty}
              </p>
            )}
          </div>
        )}

        {/* Results Summary */}
        {results && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Generation Complete</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{results.totalProperties}</Badge>
                    <span>Total Properties</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{results.generated}</Badge>
                    <span>Generated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{results.skipped}</Badge>
                    <span>Skipped</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{results.failed}</Badge>
                    <span>Failed</span>
                  </div>
                </div>
                
                {results.errors.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-red-600">
                      View Errors ({results.errors.length})
                    </summary>
                    <div className="mt-2 text-xs bg-muted p-2 rounded max-h-32 overflow-y-auto">
                      {results.errors.map((error, i) => (
                        <div key={i} className="text-red-600 mb-1">{error}</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Usage Guidelines */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>How It Works</AlertTitle>
          <AlertDescription className="text-sm">
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Scans properties with missing or short descriptions (&lt;20 chars)</li>
              <li>Generates professional descriptions using AI</li>
              <li>Uses property details like location, size, and amenities</li>
              <li>Processes in batches to avoid rate limits</li>
              <li>Automatically saves generated descriptions</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}