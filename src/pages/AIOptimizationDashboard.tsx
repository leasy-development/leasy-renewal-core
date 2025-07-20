import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Brain, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Zap,
  Target,
  TrendingUp,
  RefreshCw,
  Play,
  Pause,
  Settings,
  FileText,
  Languages,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { 
  AIBulkOptimizationService, 
  type AIOptimizationStats, 
  type PropertyAIStatus 
} from '@/services/aiBulkOptimization';

const AIOptimizationDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<AIOptimizationStats>({
    total_properties: 0,
    ai_ready: 0,
    ai_optimized: 0,
    missing_translations: 0,
    low_quality_scores: 0,
    queue_pending: 0
  });
  const [properties, setProperties] = useState<PropertyAIStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const [statsData, propertiesData] = await Promise.all([
        AIBulkOptimizationService.getOptimizationStats(user.id),
        AIBulkOptimizationService.getPropertiesAIStatus(user.id)
      ]);
      
      setStats(statsData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Failed to load AI optimization data:', error);
      toast.error('Failed to load optimization data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkOptimization = async (onlyMissing = true) => {
    if (!user) return;
    
    const propertiesToProcess = selectedProperties.length > 0 
      ? selectedProperties 
      : properties.map(p => p.id);

    if (propertiesToProcess.length === 0) {
      toast.info('No properties selected');
      return;
    }

    setIsProcessing(true);
    try {
      const types = ['title', 'description', 'meta_description'];
      const result = await AIBulkOptimizationService.queueBulkOptimization(
        propertiesToProcess,
        user.id,
        types,
        onlyMissing
      );

      toast.success(`Queued ${result.queued} properties for optimization. ${result.skipped} skipped.`);
      
      // Start processing the queue
      await AIBulkOptimizationService.processQueue(user.id);
      
      // Reload data
      await loadData();
    } catch (error) {
      console.error('Bulk optimization failed:', error);
      toast.error('Failed to start bulk optimization');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSinglePropertyOptimization = async (propertyId: string) => {
    if (!user) return;
    
    try {
      await AIBulkOptimizationService.queuePropertyOptimization(
        propertyId,
        user.id,
        ['title', 'description', 'meta_description']
      );
      
      toast.success('Property queued for optimization');
      await loadData();
    } catch (error) {
      console.error('Failed to queue property:', error);
      toast.error('Failed to queue property for optimization');
    }
  };

  const getQualityBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const StatsCard: React.FC<{ 
    title: string; 
    value: number; 
    total: number; 
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, total, icon, color }) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{percentage}% of total</p>
            </div>
            <div className={`p-3 rounded-full ${color}`}>
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
          <span>Loading AI optimization dashboard...</span>
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
              <Sparkles className="h-8 w-8 text-primary" />
              AI Optimization Center
            </h1>
            <p className="text-muted-foreground">
              Optimize your property listings with AI-powered content generation
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadData}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => handleBulkOptimization(true)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Bulk Optimize Missing
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="AI Ready"
            value={stats.ai_ready}
            total={stats.total_properties}
            icon={<CheckCircle className="h-4 w-4" />}
            color="text-green-600 bg-green-100"
          />
          <StatsCard
            title="Missing Translations"
            value={stats.missing_translations}
            total={stats.total_properties}
            icon={<Languages className="h-4 w-4" />}
            color="text-amber-600 bg-amber-100"
          />
          <StatsCard
            title="Low Quality Scores"
            value={stats.low_quality_scores}
            total={stats.total_properties}
            icon={<AlertTriangle className="h-4 w-4" />}
            color="text-red-600 bg-red-100"
          />
        </div>

        {/* Queue Status */}
        {stats.queue_pending > 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {stats.queue_pending} items in processing queue. Properties will be optimized automatically.
            </AlertDescription>
          </Alert>
        )}

        {/* Properties Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Properties Status
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProperties([])}
                  disabled={selectedProperties.length === 0}
                >
                  Clear Selection
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleBulkOptimization(false)}
                  disabled={selectedProperties.length === 0 || isProcessing}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Regenerate Selected
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {properties.map((property) => (
                <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedProperties.includes(property.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProperties([...selectedProperties, property.id]);
                        } else {
                          setSelectedProperties(selectedProperties.filter(id => id !== property.id));
                        }
                      }}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{property.title}</h3>
                      <p className="text-sm text-muted-foreground">{property.city}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Quality Score */}
                    <Badge className={getQualityBadgeColor(property.content_quality_score)}>
                      {property.content_quality_score}/100
                    </Badge>
                    
                    {/* Language Status */}
                    <div className="flex gap-1">
                      {property.has_german ? (
                        <Badge variant="secondary">🇩🇪</Badge>
                      ) : (
                        <Badge variant="outline">🇩🇪</Badge>
                      )}
                      {property.has_english ? (
                        <Badge variant="secondary">🇬🇧</Badge>
                      ) : (
                        <Badge variant="outline">🇬🇧</Badge>
                      )}
                    </div>
                    
                    {/* AI Status */}
                    {property.ai_optimized ? (
                      <Badge variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Optimized
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Needs Work
                      </Badge>
                    )}
                    
                    {/* Queue Status */}
                    {property.queue_items.length > 0 && (
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        <Clock className="h-3 w-3 mr-1" />
                        Queued ({property.queue_items.length})
                      </Badge>
                    )}
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSinglePropertyOptimization(property.id)}
                        disabled={property.queue_items.length > 0}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Optimize
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AIOptimizationDashboard;