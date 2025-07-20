
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Settings,
  Play,
  Pause,
  BarChart3,
  Shield,
  Bug,
  Palette,
  Target
} from 'lucide-react';
import { deepSourceService, DeepSourceRepository } from '@/services/deepSourceService';
import { enhancedDeepSourceService, BulkFixResult } from '@/services/enhancedDeepSourceService';
import { toast } from 'sonner';

export function ComprehensiveDeepSourceDashboard() {
  const [repositories, setRepositories] = useState<DeepSourceRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [fixResults, setFixResults] = useState<BulkFixResult | null>(null);
  const [enhancedStats, setEnhancedStats] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  const phases = [
    { 
      id: 1, 
      name: 'Security & Critical Issues', 
      icon: Shield,
      description: 'Fix security vulnerabilities and critical bugs',
      color: 'text-red-600'
    },
    { 
      id: 2, 
      name: 'TypeScript & Type Safety', 
      icon: FileText,
      description: 'Improve type definitions and remove any types',
      color: 'text-blue-600'
    },
    { 
      id: 3, 
      name: 'React Best Practices', 
      icon: Bug,
      description: 'Fix React patterns and performance issues',
      color: 'text-green-600'
    },
    { 
      id: 4, 
      name: 'Code Style & Consistency', 
      icon: Palette,
      description: 'Standardize formatting and naming conventions',
      color: 'text-purple-600'
    }
  ];

  useEffect(() => {
    loadRepositories();
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      loadEnhancedStats();
    }
  }, [selectedRepo]);

  const loadRepositories = async () => {
    try {
      const repos = await deepSourceService.getRepositories();
      setRepositories(repos);
      if (repos.length > 0 && !selectedRepo) {
        setSelectedRepo(repos[0].id);
      }
    } catch (error) {
      toast.error("Failed to load repositories");
    }
  };

  const loadEnhancedStats = async () => {
    if (!selectedRepo) return;
    
    try {
      const stats = await enhancedDeepSourceService.getEnhancedStats(selectedRepo);
      setEnhancedStats(stats);
    } catch (error) {
      toast.error("Failed to load enhanced statistics");
    }
  };

  const runComprehensiveFix = async () => {
    if (!selectedRepo) return;

    setIsProcessing(true);
    setProgress(0);
    setCurrentPhase(0);

    try {
      toast.info("Starting comprehensive DeepSource fix...");
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const result = await enhancedDeepSourceService.performComprehensiveFix(selectedRepo);
      
      clearInterval(progressInterval);
      setProgress(100);
      setFixResults(result);

      if (result.success) {
        toast.success(`Fixed ${result.totalFixes} issues across ${result.filesProcessed} files!`);
      } else {
        toast.error("Some fixes failed. Check the report for details.");
      }

      // Reload stats
      await loadEnhancedStats();

    } catch (error) {
      toast.error("Comprehensive fix failed");
      console.error(error);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const runPhaseFix = async (phase: number) => {
    if (!selectedRepo) return;

    setIsProcessing(true);
    setCurrentPhase(phase);

    try {
      const result = await enhancedDeepSourceService.executePhaseBasedFix(selectedRepo, phase);
      
      if (result.success) {
        toast.success(`Phase ${phase} completed: ${result.totalFixes} issues fixed`);
      } else {
        toast.error(`Phase ${phase} had some issues. Check logs for details.`);
      }

      await loadEnhancedStats();

    } catch (error) {
      toast.error(`Phase ${phase} failed`);
    } finally {
      setIsProcessing(false);
      setCurrentPhase(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Comprehensive DeepSource Fix</h2>
          <p className="text-muted-foreground">
            Systematic code quality improvement with advanced auto-fixing
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={runComprehensiveFix}
            disabled={isProcessing || !selectedRepo}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isProcessing ? (
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Zap className="h-5 w-5 mr-2" />
            )}
            Fix All Issues
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {currentPhase > 0 && (
                <p className="text-sm text-muted-foreground">
                  Current Phase: {phases.find(p => p.id === currentPhase)?.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repository Selection */}
      {repositories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Repository Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {repositories.map((repo) => (
                <Button
                  key={repo.id}
                  variant={selectedRepo === repo.id ? "default" : "outline"}
                  onClick={() => setSelectedRepo(repo.id)}
                >
                  {repo.name}
                  <Badge variant="secondary" className="ml-2">
                    {repo.issues_count}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="phases">Phase-by-Phase</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {enhancedStats && (
            <>
              {/* Enhanced Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{enhancedStats.total}</div>
                    <p className="text-xs text-muted-foreground">
                      Across {Object.keys(enhancedStats.processing.fileTypes).length} file types
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Auto-Fixable</CardTitle>
                    <Settings className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {enhancedStats.processing.fixabilityBreakdown.autoFixable}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((enhancedStats.processing.fixabilityBreakdown.autoFixable / enhancedStats.total) * 100)}% can be auto-fixed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {enhancedStats.processing.fixabilityBreakdown.critical}
                    </div>
                    <p className="text-xs text-muted-foreground">Require immediate attention</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Complexity</CardTitle>
                    <Target className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Simple: {enhancedStats.processing.complexityDistribution.simple}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Complex: {enhancedStats.processing.complexityDistribution.complex}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* File Types Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Issues by File Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {Object.entries(enhancedStats.processing.fileTypes).map(([type, count]) => (
                       <div key={type} className="text-center p-4 border rounded-lg">
                         <div className="text-2xl font-bold">{Number(count)}</div>
                         <div className="text-sm text-muted-foreground">.{type} files</div>
                       </div>
                     ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="phases" className="space-y-6">
          <div className="grid gap-6">
            {phases.map((phase) => (
              <Card key={phase.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full bg-gray-100 ${phase.color}`}>
                        <phase.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle>Phase {phase.id}: {phase.name}</CardTitle>
                        <CardDescription>{phase.description}</CardDescription>
                      </div>
                    </div>
                    <Button
                      onClick={() => runPhaseFix(phase.id)}
                      disabled={isProcessing}
                      variant="outline"
                    >
                      {isProcessing && currentPhase === phase.id ? (
                        <Pause className="h-4 w-4 mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Run Phase
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {enhancedStats && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Issue Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                     {Object.entries(enhancedStats.byCategory).map(([category, count]) => (
                       <div key={category} className="flex items-center justify-between">
                         <span className="capitalize">{category.replace('-', ' ')}</span>
                         <div className="flex items-center space-x-2">
                           <div className="w-32 bg-gray-200 rounded-full h-2">
                             <div 
                               className="bg-blue-600 h-2 rounded-full" 
                               style={{ width: `${(Number(count) / enhancedStats.total) * 100}%` }}
                             />
                           </div>
                           <span className="text-sm font-medium">{Number(count)}</span>
                         </div>
                       </div>
                     ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {fixResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>Fix Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
                  {fixResults.report}
                </pre>
                
                {fixResults.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {fixResults.errors.map((error, index) => (
                        <li key={index} className="text-red-600">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!fixResults && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Run a comprehensive fix to see detailed results here
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
