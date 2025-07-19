import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Languages, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  FileText,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { IntelligentTranslationService } from '@/services/intelligentTranslation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TranslationDashboard = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    withGerman: 0,
    withEnglish: 0,
    withBoth: 0,
    needsTranslation: 0
  });

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProperties(data || []);
      
      // Calculate translation statistics
      const translationStats = IntelligentTranslationService.getTranslationStats(data || []);
      setStats(translationStats);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchTranslation = async () => {
    if (!user) return;
    
    const propertiesToProcess = properties.filter(property => 
      IntelligentTranslationService.needsTranslation(property)
    );

    if (propertiesToProcess.length === 0) {
      toast.info('No properties need translation');
      return;
    }

    setIsBatchProcessing(true);
    setBatchProgress(0);

    try {
      const propertyIds = propertiesToProcess.map(p => p.id);
      
      const { success, failed } = await IntelligentTranslationService.batchGenerateTranslations(
        propertyIds,
        user.id,
        (completed, total) => {
          setBatchProgress(Math.round((completed / total) * 100));
        }
      );

      toast.success(`Completed! ${success.length} properties translated, ${failed.length} failed`);
      
      // Reload properties to get updated data
      await loadProperties();
    } catch (error) {
      console.error('Batch translation failed:', error);
      toast.error('Batch translation failed');
    } finally {
      setIsBatchProcessing(false);
      setBatchProgress(0);
    }
  };

  const StatsCard: React.FC<{ 
    title: string; 
    value: number; 
    total: number; 
    icon: React.ReactNode;
    color: 'green' | 'blue' | 'amber' | 'red';
  }> = ({ title, value, total, icon, color }) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    
    const colorClasses = {
      green: 'text-green-600 bg-green-50 border-green-200',
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      amber: 'text-amber-600 bg-amber-50 border-amber-200',
      red: 'text-red-600 bg-red-50 border-red-200'
    };

    return (
      <Card className={`border ${colorClasses[color]}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{percentage}% of total</p>
            </div>
            <div className={`p-3 rounded-full ${colorClasses[color]}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading translation dashboard...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Languages className="h-8 w-8 text-primary" />
              Translation Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage and monitor your property translations
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadProperties}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleBatchTranslation}
              disabled={isBatchProcessing || stats.needsTranslation === 0}
            >
              {isBatchProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate Missing Translations
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {isBatchProcessing && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing translations...</span>
                  <span>{batchProgress}%</span>
                </div>
                <Progress value={batchProgress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Properties"
            value={stats.total}
            total={stats.total}
            icon={<FileText className="h-4 w-4" />}
            color="blue"
          />
          <StatsCard
            title="With German"
            value={stats.withGerman}
            total={stats.total}
            icon={<span className="text-sm font-bold">🇩🇪</span>}
            color="green"
          />
          <StatsCard
            title="With English"
            value={stats.withEnglish}
            total={stats.total}
            icon={<span className="text-sm font-bold">🇬🇧</span>}
            color="green"
          />
          <StatsCard
            title="Need Translation"
            value={stats.needsTranslation}
            total={stats.total}
            icon={<AlertTriangle className="h-4 w-4" />}
            color="amber"
          />
        </div>

        {/* Completion Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Translation Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Fully Translated (Both Languages)</span>
                  <span>{stats.withBoth} of {stats.total}</span>
                </div>
                <Progress 
                  value={stats.total > 0 ? (stats.withBoth / stats.total) * 100 : 0} 
                  className="w-full"
                />
              </div>
              
              {stats.needsTranslation > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {stats.needsTranslation} properties need translation to reach full bilingual coverage.
                  </AlertDescription>
                </Alert>
              )}
              
              {stats.needsTranslation === 0 && stats.total > 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    🎉 All properties have complete translations!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Property List */}
        <Tabs defaultValue="needs-translation" className="w-full">
          <TabsList>
            <TabsTrigger value="needs-translation">
              Needs Translation ({stats.needsTranslation})
            </TabsTrigger>
            <TabsTrigger value="all">
              All Properties ({stats.total})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="needs-translation" className="space-y-4">
            {properties
              .filter(property => IntelligentTranslationService.needsTranslation(property))
              .map(property => (
                <PropertyTranslationCard key={property.id} property={property} />
              ))
            }
          </TabsContent>
          
          <TabsContent value="all" className="space-y-4">
            {properties.map(property => (
              <PropertyTranslationCard key={property.id} property={property} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const PropertyTranslationCard: React.FC<{ property: any }> = ({ property }) => {
  const status = IntelligentTranslationService.needsTranslation(property);
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-medium">{property.title || 'Untitled Property'}</h3>
            <p className="text-sm text-muted-foreground">
              {property.city}, {property.country} • {property.category}
            </p>
            <div className="flex gap-2 mt-2">
              {property.language_detected && (
                <Badge variant="outline">
                  Detected: {property.language_detected === 'de' ? '🇩🇪 German' : '🇬🇧 English'}
                </Badge>
              )}
              {(property.title_de || property.description_de) && (
                <Badge variant="secondary">🇩🇪 German</Badge>
              )}
              {(property.title_en || property.description_en) && (
                <Badge variant="secondary">🇬🇧 English</Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            {status ? (
              <Badge variant="outline" className="border-amber-200 text-amber-700">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Needs Translation
              </Badge>
            ) : (
              <Badge variant="secondary" className="border-green-200 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TranslationDashboard;