import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bug, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText,
  GitBranch,
  Shield,
  Zap,
  TrendingUp,
  Download,
  RefreshCw,
  Settings,
  BarChart3,
  Code2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CodeFixLog {
  id: string;
  issue_code: string;
  file_path: string;
  line_number: number | null;
  status: string; // Changed from specific union to string for flexibility
  fix_summary: string | null;
  error_details: string | null;
  deepsource_issue_id: string | null;
  fix_method: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface DeepSourceStats {
  totalIssues: number;
  fixedIssues: number;
  pendingIssues: number;
  criticalIssues: number;
  qualityScore: number;
  lastScanDate: Date | null;
}

const DeepSourceDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [fixLogs, setFixLogs] = useState<CodeFixLog[]>([]);
  const [stats, setStats] = useState<DeepSourceStats>({
    totalIssues: 0,
    fixedIssues: 0,
    pendingIssues: 0,
    criticalIssues: 0,
    qualityScore: 0,
    lastScanDate: null
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load code fix logs
      const { data: logs, error: logsError } = await supabase
        .from('code_fix_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      setFixLogs(logs || []);

      // Calculate stats
      const totalIssues = logs?.length || 0;
      const fixedIssues = logs?.filter(log => log.status === 'fixed').length || 0;
      const pendingIssues = logs?.filter(log => log.status === 'error' || log.status === 'manual_fix').length || 0;
      const criticalIssues = logs?.filter(log => 
        log.issue_code.includes('security') || 
        log.issue_code.includes('critical') ||
        log.issue_code.includes('vulnerability')
      ).length || 0;

      const qualityScore = totalIssues > 0 ? Math.round((fixedIssues / totalIssues) * 100) : 100;
      const lastScanDate = logs && logs.length > 0 ? new Date(logs[0].created_at) : null;

      setStats({
        totalIssues,
        fixedIssues,
        pendingIssues,
        criticalIssues,
        qualityScore,
        lastScanDate
      });

    } catch (error) {
      console.error('Failed to load DeepSource data:', error);
      toast.error('Failed to load code quality data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    await checkDeepSourceStatus();
    setIsRefreshing(false);
    toast.success('Code quality data refreshed');
  };

  const checkDeepSourceStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('deepsource-integration', {
        method: 'GET',
        body: new URLSearchParams({ action: 'status' })
      });

      if (error) throw error;

      console.log('DeepSource status:', data);
    } catch (error) {
      console.error('Failed to check DeepSource status:', error);
    }
  };

  const triggerScan = async () => {
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase.functions.invoke('deepsource-integration', {
        method: 'GET',
        body: new URLSearchParams({ action: 'scan' })
      });

      if (error) throw error;

      toast.success('Code quality scan initiated');
      await loadData();
    } catch (error) {
      console.error('Failed to trigger scan:', error);
      toast.error('Failed to trigger code quality scan');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fixIssue = async (issueId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('deepsource-integration', {
        method: 'POST',
        body: { action: 'fix_issue', issue_id: issueId }
      });

      if (error) throw error;

      if (data.fixed) {
        toast.success('Issue fixed successfully');
      } else {
        toast.warning('Issue requires manual intervention');
      }
      
      await loadData();
    } catch (error) {
      console.error('Failed to fix issue:', error);
      toast.error('Failed to fix issue');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fixed': return 'bg-green-100 text-green-800 border-green-200';
      case 'skipped': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'ignored': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'manual_fix': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fixed': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      case 'manual_fix': return <Settings className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Code2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">DeepSource Dashboard</h1>
            <p className="text-muted-foreground">Code quality monitoring and automated fixes</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={triggerScan} disabled={isRefreshing} variant="outline">
            <Zap className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Trigger Scan
          </Button>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Code Quality Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.qualityScore}%</div>
            <Progress value={stats.qualityScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIssues}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lastScanDate ? `Last scan: ${formatDate(stats.lastScanDate.toISOString())}` : 'No scans yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fixed Issues</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.fixedIssues}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalIssues > 0 ? `${Math.round((stats.fixedIssues / stats.totalIssues) * 100)}% success rate` : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.criticalIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.criticalIssues}
            </div>
            <p className="text-xs text-muted-foreground">
              Security & critical issues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Fixes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Code Fixes</CardTitle>
              <CardDescription>
                Latest automated fixes and manual interventions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fixLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No code fixes recorded</h3>
                  <p className="text-muted-foreground">Start your first DeepSource scan to see results here</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {fixLogs.map((log) => (
                      <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          {getStatusIcon(log.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(log.status)}>
                                {log.status.replace('_', ' ')}
                              </Badge>
                              <span className="text-sm font-medium">{log.issue_code}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(log.created_at)}
                            </span>
                          </div>
                          <div className="mt-1">
                            <p className="text-sm text-muted-foreground">
                              <FileText className="h-3 w-3 inline mr-1" />
                              {log.file_path}
                              {log.line_number && ` (Line ${log.line_number})`}
                            </p>
                          </div>
                          {log.fix_summary && (
                            <p className="text-sm mt-2">{log.fix_summary}</p>
                          )}
                          {log.error_details && log.status === 'error' && (
                            <Alert className="mt-2">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                {log.error_details}
                              </AlertDescription>
                            </Alert>
                           )}
                           {(log.status === 'pending' || log.status === 'error') && (
                             <div className="mt-2">
                               <Button 
                                 size="sm" 
                                 variant="outline"
                                 onClick={() => fixIssue(log.id)}
                                 className="text-xs"
                               >
                                 <Settings className="h-3 w-3 mr-1" />
                                 Try Auto-Fix
                               </Button>
                             </div>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 </ScrollArea>
               )}
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Fix Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Automatic Fixes</span>
                    <Badge className="bg-green-100 text-green-800">
                      {stats.fixedIssues} / {stats.totalIssues}
                    </Badge>
                  </div>
                  <Progress value={stats.qualityScore} />
                  <p className="text-xs text-muted-foreground">
                    {stats.qualityScore}% of issues automatically resolved
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Issue Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Security Issues</span>
                    <Badge variant="destructive">{stats.criticalIssues}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Performance Issues</span>
                    <Badge variant="secondary">
                      {fixLogs.filter(log => log.issue_code.includes('performance')).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Code Style</span>
                    <Badge variant="outline">
                      {fixLogs.filter(log => log.issue_code.includes('style')).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>DeepSource Configuration</CardTitle>
              <CardDescription>
                Configure automated code quality scanning and fixing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  DeepSource integration is configured through environment variables. 
                  Ensure DEEPSOURCE_API_TOKEN is set in your Supabase Edge Function secrets.
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scan Frequency</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>On every commit</option>
                    <option>Daily</option>
                    <option>Weekly</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Auto-fix Level</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Conservative (Safe fixes only)</option>
                    <option>Moderate (Recommended)</option>
                    <option>Aggressive (All available fixes)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Code Quality Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeepSourceDashboard;