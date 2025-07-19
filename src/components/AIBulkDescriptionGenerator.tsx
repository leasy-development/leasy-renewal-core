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
  Clock,
  SkipForward,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

interface AIBulkDescriptionGeneratorProps {
  onComplete?: (results: any) => void;
}

interface GenerationProgress {
  current: number;
  total: number;
  currentProperty: string;
  status: 'idle' | 'generating' | 'completed' | 'error' | 'retrying';
}

interface PropertyError {
  propertyId: string;
  propertyTitle: string;
  error: string;
  type: 'validation' | 'generation' | 'update';
}

interface GenerationResults {
  totalProperties: number;
  generated: number;
  updated: number;
  skipped: number;
  skippedInactive: number;
  skippedInvalid: number;
  failed: number;
  errors: PropertyError[];
  retryableErrors: PropertyError[];
}

interface Property {
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

export function AIBulkDescriptionGenerator({ onComplete }: AIBulkDescriptionGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>({
    current: 0,
    total: 0,
    currentProperty: '',
    status: 'idle'
  });
  const [results, setResults] = useState<GenerationResults | null>(null);
  const [failedProperties, setFailedProperties] = useState<Property[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Validate property data before processing
  const validateProperty = (property: Property): { isValid: boolean; missingFields: string[] } => {
    const requiredFields = ['title', 'apartment_type'];
    const recommendedFields = ['city', 'bedrooms', 'square_meters'];
    
    const missingRequired = requiredFields.filter(field => !property[field as keyof Property]);
    const missingRecommended = recommendedFields.filter(field => !property[field as keyof Property]);
    
    return {
      isValid: missingRequired.length === 0,
      missingFields: [...missingRequired, ...missingRecommended]
    };
  };

  // Check if property is inactive
  const isPropertyInactive = (property: Property): boolean => {
    return (
      property.status === 'inactive' ||
      property.title?.toLowerCase().includes('(inactive do not use)') ||
      property.title?.toLowerCase().includes('inactive') ||
      property.title?.toLowerCase().includes('do not use')
    );
  };

  // Sleep function for retry delays
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Process a single property with retry logic
  const processProperty = async (
    property: Property, 
    retryCount = 0, 
    generationResults: GenerationResults
  ): Promise<void> => {
    const maxRetries = 3;
    const baseDelay = 250;

    try {
      // Check if property is inactive
      if (isPropertyInactive(property)) {
        generationResults.skippedInactive++;
        console.log(`⏭️  Skipping inactive property: ${property.title}`);
        return;
      }

      // Validate property data
      const validation = validateProperty(property);
      if (!validation.isValid) {
        generationResults.skippedInvalid++;
        generationResults.errors.push({
          propertyId: property.id,
          propertyTitle: property.title,
          error: `Missing required fields: ${validation.missingFields.join(', ')}`,
          type: 'validation'
        });
        console.error(`❌ Validation failed for property ${property.title}:`, validation.missingFields);
        return;
      }

      // Call the Edge Function with proper type parameter
      const { data, error } = await supabase.functions.invoke('generate-property-description', {
        body: {
          type: 'description', // ✅ FIXED: Add required type parameter
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

      if (error) {
        throw new Error(error.message || 'Edge function error');
      }

      if (data?.description || data?.content) {
        const description = data.description || data.content;
        
        // Update property with generated description
        const { error: updateError } = await supabase
          .from('properties')
          .update({ description })
          .eq('id', property.id);

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }

        generationResults.generated++;
        generationResults.updated++;
        console.log(`✅ Generated description for: ${property.title}`);
      } else {
        generationResults.skipped++;
        console.log(`⏭️  No description generated for: ${property.title}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error processing property ${property.title}:`, errorMessage);

      if (retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`🔄 Retrying ${property.title} in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        await sleep(delay);
        return processProperty(property, retryCount + 1, generationResults);
      } else {
        generationResults.failed++;
        const propertyError: PropertyError = {
          propertyId: property.id,
          propertyTitle: property.title,
          error: errorMessage,
          type: errorMessage.includes('Database') ? 'update' : 'generation'
        };
        generationResults.errors.push(propertyError);
        generationResults.retryableErrors.push(propertyError);
      }
    }
  };

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
    setFailedProperties([]);
    
    const generationResults: GenerationResults = {
      totalProperties: 0,
      generated: 0,
      updated: 0,
      skipped: 0,
      skippedInactive: 0,
      skippedInvalid: 0,
      failed: 0,
      errors: [],
      retryableErrors: []
    };

    try {
      console.log('🚀 Starting bulk description generation...');

      // Get properties that need descriptions (empty or very short)
      const { data: properties, error: fetchError } = await supabase
        .from('properties')
        .select('id, title, description, street_name, city, bedrooms, bathrooms, square_meters, monthly_rent, weekly_rate, daily_rate, apartment_type, category, status')
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

      if (propertiesNeedingDescriptions.length === 0) {
        toast({
          title: "All Set!",
          description: "All your properties already have adequate descriptions",
        });
        setIsGenerating(false);
        return;
      }

      generationResults.totalProperties = propertiesNeedingDescriptions.length;

      setProgress({
        current: 0,
        total: propertiesNeedingDescriptions.length,
        currentProperty: '',
        status: 'generating'
      });

      console.log(`📊 Processing ${propertiesNeedingDescriptions.length} properties`);

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

          await processProperty(property, 0, generationResults);
        });

        await Promise.all(batchPromises);

        // Small delay between batches
        if (i + BATCH_SIZE < propertiesNeedingDescriptions.length) {
          await sleep(1000);
        }
      }

      // Store failed properties for retry
      const failedProps = propertiesNeedingDescriptions.filter(p => 
        generationResults.retryableErrors.some(e => e.propertyId === p.id)
      );
      setFailedProperties(failedProps);

      setResults(generationResults);
      
      setProgress(prev => ({
        ...prev,
        status: 'completed',
        currentProperty: ''
      }));

      console.log('📈 Generation Results:', generationResults);

      toast({
        title: "✨ Bulk Generation Complete",
        description: `Generated ${generationResults.generated} descriptions, skipped ${generationResults.skippedInactive + generationResults.skippedInvalid}, failed ${generationResults.failed}`,
      });

      onComplete?.(generationResults);

    } catch (error) {
      console.error('💥 Bulk description generation failed:', error);
      
      setProgress(prev => ({
        ...prev,
        status: 'error'
      }));

      generationResults.errors.push({
        propertyId: 'system',
        propertyTitle: 'System Error',
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'generation'
      });
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

  const retryFailedProperties = async () => {
    if (failedProperties.length === 0 || !results) return;

    setIsRetrying(true);
    
    const retryResults: GenerationResults = {
      ...results,
      errors: results.errors.filter(e => e.type !== 'generation'), // Keep validation errors
      retryableErrors: []
    };

    try {
      console.log(`🔄 Retrying ${failedProperties.length} failed properties...`);

      setProgress({
        current: 0,
        total: failedProperties.length,
        currentProperty: '',
        status: 'retrying'
      });

      for (let i = 0; i < failedProperties.length; i++) {
        const property = failedProperties[i];
        
        setProgress(prev => ({
          ...prev,
          current: i + 1,
          currentProperty: property.title
        }));

        // Remove from failed count for retry
        retryResults.failed--;
        
        await processProperty(property, 0, retryResults);
        
        // Small delay between retries
        if (i < failedProperties.length - 1) {
          await sleep(500);
        }
      }

      // Update failed properties list
      const stillFailedProps = failedProperties.filter(p => 
        retryResults.retryableErrors.some(e => e.propertyId === p.id)
      );
      setFailedProperties(stillFailedProps);

      setResults(retryResults);
      
      setProgress(prev => ({
        ...prev,
        status: 'completed',
        currentProperty: ''
      }));

      const retrySuccess = failedProperties.length - stillFailedProps.length;
      
      toast({
        title: "🔄 Retry Complete",
        description: `Successfully generated ${retrySuccess} descriptions on retry`,
        variant: retrySuccess > 0 ? "default" : "destructive"
      });

    } catch (error) {
      console.error('💥 Retry failed:', error);
      toast({
        title: "Retry Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'generating': return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'retrying': return <RotateCcw className="w-4 h-4 animate-spin text-orange-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Wand2 className="w-4 h-4" />;
    }
  };

  const isProcessing = isGenerating || isRetrying;

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
        <div className="flex gap-2">
          <Button 
            onClick={generateBulkDescriptions}
            disabled={isProcessing}
            className="flex-1"
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

          {results && results.retryableErrors.length > 0 && !isProcessing && (
            <Button 
              onClick={retryFailedProperties}
              disabled={isProcessing}
              variant="outline"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry Failed ({results.retryableErrors.length})
            </Button>
          )}
        </div>

        {/* Progress Indicator */}
        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">
                {progress.status === 'retrying' ? 'Retrying' : 'Processing'} {progress.current} of {progress.total} properties
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

        {/* Enhanced Results Summary */}
        {results && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Generation Complete</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{results.totalProperties}</Badge>
                    <span>Total Properties</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{results.generated}</Badge>
                    <span>✅ Generated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{results.skippedInactive}</Badge>
                    <span>🟡 Inactive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{results.skippedInvalid}</Badge>
                    <span>📝 Invalid Data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{results.skipped}</Badge>
                    <span>⏭️  Other Skipped</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{results.failed}</Badge>
                    <span>🔴 Failed</span>
                  </div>
                </div>
                
                {results.errors.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-red-600 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      View Detailed Errors ({results.errors.length})
                    </summary>
                    <div className="mt-2 text-xs bg-muted p-3 rounded max-h-40 overflow-y-auto space-y-2">
                      {results.errors.map((error, i) => (
                        <div key={i} className="border-l-2 border-red-300 pl-2">
                          <div className="font-medium text-red-700">{error.propertyTitle}</div>
                          <div className="text-red-600">{error.error}</div>
                          <div className="text-xs text-gray-500 uppercase">{error.type} ERROR</div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {results.retryableErrors.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <RotateCcw className="w-4 h-4" />
                    <span>{results.retryableErrors.length} properties can be retried</span>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Usage Guidelines */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertTitle>How It Works</AlertTitle>
          <AlertDescription className="text-sm">
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>🔍 Scans properties with missing or short descriptions (&lt;20 chars)</li>
              <li>🚫 Automatically skips inactive listings and invalid properties</li>
              <li>✅ Validates required fields (title, type) before processing</li>
              <li>🤖 Generates professional descriptions using AI with retry logic</li>
              <li>📊 Processes in batches with exponential backoff for rate limiting</li>
              <li>💾 Automatically saves generated descriptions to database</li>
              <li>🔄 Provides retry functionality for failed generations</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}