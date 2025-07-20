
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Bug, 
  Shield, 
  Zap, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileText,
  BarChart3,
  Settings,
  Clock,
  Download,
  Loader2,
  X,
  Eye,
  Wrench
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { deepSourceService, DeepSourceIssue, DeepSourceRepository, RefreshStatus, AutoFixResult } from '@/services/deepSourceService';
import { DeepSourceRefreshStatus } from './DeepSourceRefreshStatus';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

export function DeepSourceDashboard() {
  const [repositories, setRepositories] = useState<DeepSourceRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [issues, setIssues] = useState<DeepSourceIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [autoFixEnabled, setAutoFixEnabled] = useState(true);
  const [autoFixProgress, setAutoFixProgress] = useState(0);
  const [autoFixingMessage, setAutoFixingMessage] = useState('');
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>({
    isRefreshing: false,
    progress: 0,
    message: 'Ready'
  });
  const [isDemoMode, setIsDemoMode] = useState(false);

  const logCodeFix = async (issue: DeepSourceIssue, status: string, fixSummary?: string, errorDetails?: string) => {
    try {
      await supabase.from('code_fix_log').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        issue_code: issue.code,
        file_path: issue.file_path,
        line_number: issue.line_number,
        status,
        fix_summary: fixSummary,
        error_details: errorDetails,
        deepsource_issue_id: issue.id,
        fix_method: status === 'ignored' ? 'ignored' : (status === 'manual_fix' ? 'manual' : 'auto')
      });
    } catch (error) {
      console.warn('Failed to log code fix:', error);
    }
  };

  useEffect(() => {
    loadRepositories();
    
    // Subscribe to refresh status updates
    const unsubscribe = deepSourceService.onRefreshStatusChange(setRefreshStatus);
    
    return unsubscribe;
  }, []);

  const loadRepositories = async () => {
    try {
      setIsLoading(true);
      const repos = await deepSourceService.getRepositories();
      setRepositories(repos);
      
      // Test connection to determine demo mode
      const connectionTest = await deepSourceService.testConnection();
      setIsDemoMode(connectionTest.demo_mode);
      
      if (repos.length > 0 && !selectedRepo) {
        setSelectedRepo(repos[0].id);
        await loadIssues(repos[0].id);
      }
      
      if (connectionTest.demo_mode) {
        toast.info("Using demo data - configure DeepSource API token for real analysis");
      } else {
        toast.success("Connected to DeepSource successfully");
      }
    } catch (error) {
      toast.error("Failed to load repositories from DeepSource");
    } finally {
      setIsLoading(false);
    }
  };

  const loadIssues = async (repoId?: string) => {
    const repositoryId = repoId || selectedRepo;
    if (!repositoryId) return;

    try {
      setIsLoading(true);
      const repoIssues = await deepSourceService.getRepositoryIssues(repositoryId);
      setIssues(repoIssues);
      
      const message = isDemoMode 
        ? `Demo: Loaded ${repoIssues.length} sample issues`
        : `Loaded ${repoIssues.length} issues from DeepSource`;
      toast.success(message);
    } catch (error) {
      toast.error("Failed to load issues from DeepSource");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshAll = async () => {
    if (!selectedRepo) {
      toast.error("Please select a repository first");
      return;
    }

    try {
      const { repositories: newRepos, issues: newIssues } = await deepSourceService.refreshRepository(selectedRepo);
      
      setRepositories(newRepos);
      setIssues(newIssues);
      
      const message = isDemoMode
        ? `Demo refresh complete: ${newIssues.length} issues loaded`
        : `Refresh complete: ${newIssues.length} issues loaded from DeepSource`;
      toast.success(message);
    } catch (error) {
      toast.error("Failed to refresh data from DeepSource");
    }
  };

  const handleAutoFixAll = async () => {
    const autoFixableIssues = issues.filter(issue => issue.autoFixable);
    if (autoFixableIssues.length === 0) {
      toast.info("No auto-fixable issues found");
      return;
    }

    setIsAutoFixing(true);
    setAutoFixProgress(0);
    setAutoFixingMessage('Starting auto-fix process...');
    let fixedCount = 0;
    let totalFilesModified = 0;

    try {
      toast.info(`Starting auto-fix for ${autoFixableIssues.length} issues...`);
      
      for (let i = 0; i < autoFixableIssues.length; i++) {
        const issue = autoFixableIssues[i];
        setAutoFixingMessage(`Fixing issue ${i + 1} of ${autoFixableIssues.length}: ${issue.title}`);
        setAutoFixProgress(Math.round(((i + 1) / autoFixableIssues.length) * 100));
        
        try {
          const result: AutoFixResult = await deepSourceService.applyAutoFix(issue);
          if (result.success) {
            fixedCount++;
            totalFilesModified += result.files_modified || 1;
            await logCodeFix(issue, 'fixed', result.message);
          } else {
            await logCodeFix(issue, 'error', undefined, result.message);
          }
        } catch (error) {
          console.warn(`Failed to fix issue ${issue.id}:`, error);
          await logCodeFix(issue, 'error', undefined, String(error));
        }
      }

      const message = isDemoMode
        ? `Demo: Successfully simulated fixing ${fixedCount} issues across ${totalFilesModified} files`
        : `Successfully fixed ${fixedCount} issues across ${totalFilesModified} files`;
      
      if (fixedCount === 0) {
        toast.error("No issues were successfully fixed");
      } else {
        toast.success(message);
      }
      
      // Reload issues to reflect fixes
      await loadIssues();
    } catch (error) {
      toast.error("Failed to complete auto-fix process");
      console.error('Auto-fix error:', error);
    } finally {
      setIsAutoFixing(false);
      setAutoFixProgress(0);
      setAutoFixingMessage('');
    }
  };

  const handleSingleAutoFix = async (issue: DeepSourceIssue) => {
    setAutoFixingMessage(`Fixing: ${issue.title}...`);
    
    try {
      const result = await deepSourceService.applyAutoFix(issue);
      
      if (result.success) {
        const message = isDemoMode
          ? `Demo: Successfully simulated fixing "${issue.title}"`
          : `Fixed: ${issue.title}`;
        toast.success(message);
        await logCodeFix(issue, 'fixed', result.message);
        
        // Reload issues to reflect the fix
        await loadIssues();
      } else {
        toast.error(`Failed to fix: ${issue.title}`);
        await logCodeFix(issue, 'error', undefined, result.message);
      }
    } catch (error) {
      toast.error(`Error fixing: ${issue.title}`);
      console.error('Single auto-fix error:', error);
      await logCodeFix(issue, 'error', undefined, String(error));
    } finally {
      setAutoFixingMessage('');
    }
  };
  const handleIgnoreIssue = async (issue: DeepSourceIssue) => {
    try {
      await logCodeFix(issue, 'ignored', 'Issue ignored by user');
      toast.success(`Ignored issue: ${issue.title}`);
      
      // Remove from current issues list
      setIssues(issues.filter(i => i.id !== issue.id));
    } catch (error) {
      toast.error('Failed to ignore issue');
      console.error('Error ignoring issue:', error);
    }
  };

  const handleManualFix = async (issue: DeepSourceIssue) => {
    try {
      await logCodeFix(issue, 'manual_fix', 'Issue marked for manual fixing');
      toast.info(`Issue marked for manual fix: ${issue.title}`);
      
      // Optionally remove from list or mark as in progress
      setIssues(issues.map(i => i.id === issue.id ? { ...i, status: 'manual_fixing' } : i));
    } catch (error) {
      toast.error('Failed to mark issue for manual fix');
      console.error('Error marking manual fix:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'major': return 'bg-orange-500';
      case 'minor': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="h-4 w-4" />;
      case 'bug-risk': return <Bug className="h-4 w-4" />;
      case 'performance': return <Zap className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const stats = deepSourceService.getIssueStats(issues);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">DeepSource Integration</h2>
          <p className="text-muted-foreground">
            Automated code quality analysis and fixes from DeepSource
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoFixEnabled}
              onCheckedChange={setAutoFixEnabled}
              id="autofix-toggle"
            />
            <label htmlFor="autofix-toggle" className="text-sm font-medium">
              Auto-Fix
            </label>
          </div>
          <Button
            onClick={handleRefreshAll}
            disabled={refreshStatus.isRefreshing || !selectedRepo}
            variant="outline"
            size="sm"
          >
            {refreshStatus.isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Update Now
          </Button>
          <Button
            onClick={() => loadIssues()}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Refresh Status */}
      <DeepSourceRefreshStatus 
        isRefreshing={refreshStatus.isRefreshing}
        progress={refreshStatus.progress}
        message={refreshStatus.message}
        lastUpdated={refreshStatus.lastUpdated}
        demoMode={isDemoMode}
      />

      {/* Auto-Fix Progress */}
      {isAutoFixing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="font-medium text-blue-800">Auto-fixing in progress...</span>
                </div>
                <span className="text-sm text-blue-600">{autoFixProgress}%</span>
              </div>
              <Progress value={autoFixProgress} className="h-2" />
              {autoFixingMessage && (
                <p className="text-sm text-blue-700">{autoFixingMessage}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repository Selection */}
      {repositories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Repository</CardTitle>
            <CardDescription>
              Select repository to analyze
              {isDemoMode && (
                <Badge variant="outline" className="ml-2 text-amber-600 border-amber-200">
                  Demo Data
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {repositories.map((repo) => (
                <Button
                  key={repo.id}
                  variant={selectedRepo === repo.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedRepo(repo.id);
                    loadIssues(repo.id);
                  }}
                >
                  {repo.name}
                  <Badge variant="secondary" className="ml-2">
                    {repo.issues_count.toLocaleString()}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {isDemoMode ? 'Demo data' : 'Live from DeepSource'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Major</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.major.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minor</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.minor.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Fixable</CardTitle>
            <Settings className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.autoFixable.toLocaleString()}</div>
            {stats.autoFixable > 0 && autoFixEnabled && (
              <Button
                size="sm"
                className="mt-2 w-full"
                onClick={handleAutoFixAll}
                disabled={isAutoFixing}
              >
                {isAutoFixing ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Zap className="h-3 w-3 mr-1" />
                )}
                Fix All
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <CardTitle>Code Quality Issues</CardTitle>
          <CardDescription>
            {isDemoMode 
              ? 'Sample issues for demonstration - configure DeepSource API for real data'
              : 'Issues detected by DeepSource analysis'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-green-600">No Issues Found</p>
              <p className="text-muted-foreground">Your code quality looks great!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.slice(0, 20).map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg"
                >
                  <div className={`p-2 rounded-full ${getSeverityColor(issue.severity)}`}>
                    {getCategoryIcon(issue.category)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {issue.analyzer}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {issue.category}
                      </Badge>
                      <Badge 
                        variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {issue.severity}
                      </Badge>
                      {issue.autoFixable && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          Auto-fixable
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm font-medium text-foreground">
                      {issue.title}
                    </p>
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>{issue.file_path}</span>
                      <span>Line {issue.line_number}</span>
                      <span>Code: {issue.code}</span>
                    </div>
                    
                    {issue.suggestion && (
                      <p className="text-xs text-blue-600 mt-1">
                        💡 {issue.suggestion}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {issue.autoFixable && autoFixEnabled && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSingleAutoFix(issue)}
                        disabled={isAutoFixing || autoFixingMessage !== ''}
                      >
                        {autoFixingMessage && autoFixingMessage.includes(issue.title) ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Zap className="h-3 w-3 mr-1" />
                        )}
                        Auto Fix
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleManualFix(issue)}
                      disabled={isAutoFixing}
                    >
                      <Wrench className="h-3 w-3 mr-1" />
                      Manual Fix
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleIgnoreIssue(issue)}
                      disabled={isAutoFixing}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Ignore
                    </Button>
                  </div>
                </div>
              ))}
              
              {issues.length > 20 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Showing 20 of {issues.length.toLocaleString()} issues
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Clock className="h-3 w-3 mr-1" />
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
