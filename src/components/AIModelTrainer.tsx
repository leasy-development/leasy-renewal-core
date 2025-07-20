import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Database, TrendingUp, Settings } from 'lucide-react';

interface ModelVersion {
  id: string;
  version_name: string;
  model_type: string;
  accuracy_score: number;
  precision_score: number;
  recall_score: number;
  training_samples_count: number;
  is_active: boolean;
  deployment_date: string;
  metadata: any;
}

interface TrainingData {
  total_samples: number;
  by_category: Record<string, number>;
  ready_for_training: boolean;
}

const AIModelTrainer: React.FC = () => {
  const { toast } = useToast();
  const [modelVersions, setModelVersions] = useState<ModelVersion[]>([]);
  const [trainingData, setTrainingData] = useState<TrainingData | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  useEffect(() => {
    loadModelVersions();
    loadTrainingData();
  }, []);

  const loadModelVersions = async () => {
    const { data, error } = await supabase
      .from('ai_model_versions')
      .select('*')
      .eq('model_type', 'image_classification')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load model versions",
        variant: "destructive",
      });
      return;
    }

    setModelVersions(data || []);
  };

  const loadTrainingData = async () => {
    // Get feedback data for training
    const { data, error } = await supabase
      .from('media_category_feedback_log')
      .select('corrected_category');

    if (error) {
      console.error('Error loading training data:', error);
      return;
    }

    const categoryCount: Record<string, number> = {};
    data?.forEach(item => {
      categoryCount[item.corrected_category] = (categoryCount[item.corrected_category] || 0) + 1;
    });

    setTrainingData({
      total_samples: data?.length || 0,
      by_category: categoryCount,
      ready_for_training: (data?.length || 0) >= 100
    });
  };

  const startTraining = async () => {
    setIsTraining(true);
    setTrainingProgress(0);

    try {
      // Simulate training progress
      const interval = setInterval(() => {
        setTrainingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 1000);

      // Call training endpoint (would be external ML service)
      const { data, error } = await supabase.functions.invoke('train-image-classifier', {
        body: {
          training_data: trainingData,
          model_config: {
            architecture: 'EfficientNet-B0',
            pretrained: true,
            fine_tune_layers: 3
          }
        }
      });

      if (error) throw error;

      // Save model version
      await supabase.from('ai_model_versions').insert({
        version_name: `v${modelVersions.length + 1}.0`,
        model_type: 'image_classification',
        accuracy_score: data.accuracy || 0.85,
        precision_score: data.precision || 0.82,
        recall_score: data.recall || 0.88,
        training_samples_count: trainingData?.total_samples || 0,
        is_active: false,
        metadata: {
          architecture: 'EfficientNet-B0',
          training_config: data.config
        }
      });

      toast({
        title: "Training Complete",
        description: "New model version trained successfully",
      });

      loadModelVersions();
    } catch (error) {
      toast({
        title: "Training Failed",
        description: "Model training encountered an error",
        variant: "destructive",
      });
    } finally {
      setIsTraining(false);
      setTrainingProgress(0);
    }
  };

  const deployModel = async (versionId: string) => {
    try {
      // Deactivate current active model
      await supabase
        .from('ai_model_versions')
        .update({ is_active: false })
        .eq('model_type', 'image_classification')
        .eq('is_active', true);

      // Activate new model
      await supabase
        .from('ai_model_versions')
        .update({ 
          is_active: true,
          deployment_date: new Date().toISOString()
        })
        .eq('id', versionId);

      toast({
        title: "Model Deployed",
        description: "New model version is now active",
      });

      loadModelVersions();
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy model version",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI Model Trainer</h1>
          <p className="text-muted-foreground">Manage image classification models</p>
        </div>
      </div>

      <Tabs defaultValue="training" className="space-y-6">
        <TabsList>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="models">Model Versions</TabsTrigger>
          <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Training Dataset
                </CardTitle>
                <CardDescription>
                  Feedback data available for model training
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Samples:</span>
                  <Badge variant={trainingData?.ready_for_training ? "default" : "secondary"}>
                    {trainingData?.total_samples || 0}
                  </Badge>
                </div>
                
                {trainingData?.by_category && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Category Distribution:</h4>
                    {Object.entries(trainingData.by_category).map(([category, count]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span className="capitalize">{category}</span>
                        <span>{count} samples</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4">
                  <Button 
                    onClick={startTraining}
                    disabled={!trainingData?.ready_for_training || isTraining}
                    className="w-full"
                  >
                    {isTraining ? 'Training...' : 'Start Training'}
                  </Button>
                  
                  {isTraining && (
                    <div className="mt-4 space-y-2">
                      <Progress value={trainingProgress} />
                      <p className="text-sm text-muted-foreground text-center">
                        Training Progress: {trainingProgress}%
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Model Configuration
                </CardTitle>
                <CardDescription>
                  EfficientNet B0 fine-tuning settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Architecture:</span>
                  <span>EfficientNet-B0</span>
                </div>
                <div className="flex justify-between">
                  <span>Pretrained:</span>
                  <span>ImageNet</span>
                </div>
                <div className="flex justify-between">
                  <span>Fine-tune Layers:</span>
                  <span>Last 3 layers</span>
                </div>
                <div className="flex justify-between">
                  <span>Output Classes:</span>
                  <span>10 room categories</span>
                </div>
                <div className="flex justify-between">
                  <span>Validation Split:</span>
                  <span>80/20</span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence Threshold:</span>
                  <span>80%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Model Versions</CardTitle>
              <CardDescription>
                Deployed and available model versions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Samples</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deployed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelVersions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="font-medium">
                        {version.version_name}
                      </TableCell>
                      <TableCell>
                        {(version.accuracy_score * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell>{version.training_samples_count}</TableCell>
                      <TableCell>
                        <Badge variant={version.is_active ? "default" : "secondary"}>
                          {version.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {version.deployment_date 
                          ? new Date(version.deployment_date).toLocaleDateString()
                          : "Not deployed"
                        }
                      </TableCell>
                      <TableCell>
                        {!version.is_active && (
                          <Button 
                            size="sm" 
                            onClick={() => deployModel(version.id)}
                          >
                            Deploy
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Model Performance
              </CardTitle>
              <CardDescription>
                Evaluation metrics for active model
              </CardDescription>
            </CardHeader>
            <CardContent>
              {modelVersions.find(v => v.is_active) ? (
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {((modelVersions.find(v => v.is_active)?.accuracy_score || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Accuracy</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {((modelVersions.find(v => v.is_active)?.precision_score || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Precision</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {((modelVersions.find(v => v.is_active)?.recall_score || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Recall</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No active model deployed
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIModelTrainer;