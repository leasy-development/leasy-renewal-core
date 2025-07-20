
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { enhancedDeepSourceClient, ConnectivityTestResult, AnalyticsData } from '@/services/enhancedDeepSourceClient';
import { toast } from 'sonner';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Zap,
  RefreshCw,
  Settings,
  Github
} from 'lucide-react';

export function DeepSourceDebugPanel() {
  const [connectivityResult, setConnectivityResult] = useState<ConnectivityTestResult | null>(null);
  const [analyticsResult, setAnalyticsResult] = useState<AnalyticsData | null>(null);
  const [isTestingConnectivity, setIsTestingConnectivity] = useState(false);
  const [isTestingAnalytics, setIsTestingAnalytics] = useState(false);
  const [repositoryId, setRepositoryId] = useState('demo-repo-1');

  const testConnectivity = async () => {
    setIsTestingConnectivity(true);
    try {
      const result = await enhancedDeepSourceClient.testConnectivity();
      setConnectivityResult(result);
      toast.success('Connectivity test successful!');
    } catch (error) {
      console.error('Connectivity test failed:', error);
      toast.error(`Connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingConnectivity(false);
    }
  };

  const testAnalytics = async () => {
    setIsTestingAnalytics(true);
    try {
      const result = await enhancedDeepSourceClient.getAnalytics(repositoryId, 30);
      setAnalyticsResult(result);
      toast.success('Analytics test successful!');
    } catch (error) {
      console.error('Analytics test failed:', error);
      toast.error(`Analytics test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingAnalytics(false);
    }
  };

  const clearResults = () => {
    setConnectivityResult(null);
    setAnalyticsResult(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Enhanced DeepSource Debug Panel
          </CardTitle>
          <CardDescription>
            Test and debug the enhanced DeepSource function connectivity and features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <Label htmlFor="repository">Repository Configuration</Label>
            </div>
            <div className="flex gap-2">
              <Input
                id="repository"
                placeholder="e.g., owner/repo or demo-repo-1"
                value={repositoryId}
                onChange={(e) => setRepositoryId(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => setRepositoryId('demo-repo-1')}
                variant="outline"
                size="sm"
              >
                Demo
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Use format "owner/repository" for real GitHub repositories or "demo-repo-1" for mock data
            </p>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={testConnectivity}
              disabled={isTestingConnectivity}
              variant="outline"
            >
              {isTestingConnectivity ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              Test Connectivity
            </Button>
            
            <Button
              onClick={testAnalytics}
              disabled={isTestingAnalytics}
              variant="outline"
            >
              {isTestingAnalytics ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Test Analytics
            </Button>
            
            <Button
              onClick={clearResults}
              variant="secondary"
              size="sm"
            >
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {connectivityResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Connectivity Test Results
            </CardTitle>
            <CardDescription>
              Service connectivity and configuration status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Service Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <Badge variant={connectivityResult.status === 'ok' ? 'default' : 'destructive'}>
                      {connectivityResult.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Timestamp:</span>
                    <span className="text-sm font-mono">
                      {new Date(connectivityResult.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Environment</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>DeepSource API:</span>
                    <Badge variant={connectivityResult.environment.deepsource_api_configured ? 'default' : 'secondary'}>
                      {connectivityResult.environment.deepsource_api_configured ? 'Configured' : 'Not Set'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>GitHub Token:</span>
                    <Badge variant={connectivityResult.environment.github_token_configured ? 'default' : 'secondary'}>
                      {connectivityResult.environment.github_token_configured ? 'Configured' : 'Not Set'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Webhook Secret:</span>
                    <Badge variant={connectivityResult.environment.webhook_secret_configured ? 'default' : 'secondary'}>
                      {connectivityResult.environment.webhook_secret_configured ? 'Configured' : 'Not Set'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Service Info</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span>Batch Operations:</span>
                  <span className="font-mono">{connectivityResult.service_info.batch_operations_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Rate Limit States:</span>
                  <span className="font-mono">{connectivityResult.service_info.rate_limit_states}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {analyticsResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Analytics Test Results
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>Analytics data for repository: {analyticsResult.repository_id}</span>
              {analyticsResult.debug_info?.data_source === 'deepsource_api' && (
                <Badge variant="default" className="ml-2">
                  <Github className="h-3 w-3 mr-1" />
                  Real Data
                </Badge>
              )}
              {analyticsResult.debug_info?.data_source === 'mock_fallback' && (
                <Badge variant="secondary" className="ml-2">
                  Mock Data
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {analyticsResult.total_issues_processed}
                </div>
                <div className="text-sm text-muted-foreground">Total Issues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(analyticsResult.fix_success_rate * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsResult.avg_processing_time_ms}ms
                </div>
                <div className="text-sm text-muted-foreground">Avg Time</div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Issues by Category</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(analyticsResult.issues_by_category).map(([category, data]) => (
                  <div key={category} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="capitalize">{category}:</span>
                    <div className="text-right">
                      <div className="font-semibold">{data.count}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(data.success_rate * 100)}% success
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {analyticsResult.debug_info && (
              <div>
                <Separator />
                <h4 className="font-semibold mb-2">Debug Information</h4>
                <div className="bg-muted p-3 rounded text-sm font-mono space-y-1">
                  <div>Generated: {new Date(analyticsResult.debug_info.generated_at).toLocaleString()}</div>
                  <div>API Key Configured: {analyticsResult.debug_info.api_key_configured ? 'Yes' : 'No'}</div>
                  <div>Data Source: <Badge variant="outline" className="ml-1">{analyticsResult.debug_info.data_source}</Badge></div>
                  <div>Request Params: {JSON.stringify(analyticsResult.debug_info.request_params)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
