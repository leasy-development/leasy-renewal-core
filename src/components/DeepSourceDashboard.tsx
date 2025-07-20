
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
  Settings
} from 'lucide-react';
import { deepSourceService, DeepSourceIssue, DeepSourceRepository } from '@/services/deepSourceService';
import { toast } from 'sonner';

export function DeepSourceDashboard() {
  const [repositories, setRepositories] = useState<DeepSourceRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [issues, setIssues] = useState<DeepSourceIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [autoFixEnabled, setAutoFixEnabled] = useState(true);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      setIsLoading(true);
      const repos = await deepSourceService.getRepositories();
      setRepositories(repos);
      if (repos.length > 0 && !selectedRepo) {
        setSelectedRepo(repos[0].id);
        await loadIssues(repos[0].id);
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
      toast.success(`Loaded ${repoIssues.length} issues from DeepSource`);
    } catch (error) {
      toast.error("Failed to load issues from DeepSource");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFixAll = async () => {
    const autoFixableIssues = issues.filter(issue => issue.autoFixable);
    if (autoFixableIssues.length === 0) {
      toast.info("No auto-fixable issues found");
      return;
    }

    setIsAutoFixing(true);
    let fixedCount = 0;

    try {
      for (const issue of autoFixableIssues) {
        const success = await deepSourceService.applyAutoFix(issue);
        if (success) {
          fixedCount++;
        }
      }

      toast.success(`Successfully fixed ${fixedCount} out of ${autoFixableIssues.length} issues`);
      
      // Reload issues to reflect fixes
      await loadIssues();
    } catch (error) {
      toast.error("Failed to apply auto-fixes");
    } finally {
      setIsAutoFixing(false);
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

      {/* Repository Selection */}
      {repositories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Repository</CardTitle>
            <CardDescription>Select repository to analyze</CardDescription>
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
                    {repo.issues_count}
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
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Major</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.major}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minor</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.minor}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Fixable</CardTitle>
            <Settings className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.autoFixable}</div>
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
            Issues detected by DeepSource analysis
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

                  {issue.autoFixable && autoFixEnabled && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deepSourceService.applyAutoFix(issue)}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Fix
                    </Button>
                  )}
                </div>
              ))}
              
              {issues.length > 20 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Showing 20 of {issues.length} issues
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
