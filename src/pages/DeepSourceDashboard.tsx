import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Code2, 
  FileText, 
  RefreshCw, 
  Settings, 
  Shield,
  Zap,
  Search,
  Filter,
  Download,
  Play,
  Bug,
  TrendingUp,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeepSourceIssue {
  id: string;
  deepsource_issue_id: string;
  check_id: string;
  title: string;
  description: string;
  file_path: string;
  line_begin: number;
  line_end: number;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'fixed' | 'ignored' | 'fixing';
  is_autofixable: boolean;
  fix_applied_at?: string;
  fix_method?: string;
  fix_summary?: string;
  created_at: string;
}

interface DeepSourceRepository {
  id: string;
  organization_slug: string;
  repository_name: string;
  api_token_configured: boolean;
  is_active: boolean;
  last_sync_at?: string;
}

interface DeepSourceScan {
  id: string;
  scan_type: string;
  status: string;
  issues_found: number;
  issues_fixed: number;
  created_at: string;
}

interface DeepSourceStats {
  totalIssues: number;
  fixedIssues: number;
  openIssues: number;
  criticalIssues: number;
  qualityScore: number;
  recentScans: DeepSourceScan[];
}

const DeepSourceDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [issues, setIssues] = useState<DeepSourceIssue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<DeepSourceIssue[]>([]);
  const [stats, setStats] = useState<DeepSourceStats>({
    totalIssues: 0,
    fixedIssues: 0,
    openIssues: 0,
    criticalIssues: 0,
    qualityScore: 100,
    recentScans: []
  });
  const [repository, setRepository] = useState<DeepSourceRepository | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState<string | null>(null);
  const [isBatchFixing, setIsBatchFixing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterIssues();
  }, [issues, searchTerm, categoryFilter, severityFilter, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load repository info
      const { data: repoData } = await supabase
        .from('deepsource_repositories')
        .select('*')
        .eq('organization_slug', 'leasy-development')
        .eq('repository_name', 'leasy-renewal-core')
        .eq('is_active', true)
        .single();

      setRepository(repoData);

      // Load issues
      const { data: issuesData } = await supabase
        .from('deepsource_issues')
        .select('*')
        .order('created_at', { ascending: false });

      // Type-safe conversion from database response
      const typedIssues: DeepSourceIssue[] = (issuesData || []).map(issue => ({
        ...issue,
        severity: issue.severity as 'low' | 'medium' | 'high' | 'critical',
        status: issue.status as 'open' | 'fixed' | 'ignored' | 'fixing'
      }));

      setIssues(typedIssues);

      // Load scans
      const { data: scansData } = await supabase
        .from('deepsource_scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate stats
      const totalIssues = issuesData?.length || 0;
      const fixedIssues = issuesData?.filter(issue => issue.status === 'fixed').length || 0;
      const openIssues = issuesData?.filter(issue => issue.status === 'open').length || 0;
      const criticalIssues = issuesData?.filter(issue => issue.severity === 'critical').length || 0;
      const qualityScore = totalIssues > 0 ? Math.round((fixedIssues / totalIssues) * 100) : 100;

      setStats({
        totalIssues,
        fixedIssues,
        openIssues,
        criticalIssues,
        qualityScore,
        recentScans: scansData || []
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load DeepSource data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterIssues = () => {
    let filtered = issues;

    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.file_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.check_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(issue => issue.category === categoryFilter);
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(issue => issue.severity === severityFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    setFilteredIssues(filtered);
  };

  const triggerScan = async () => {
    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('deepsource-integration', {
        body: {
          action: 'trigger_scan',
          organizationSlug: 'leasy-development',
          repositoryName: 'leasy-renewal-core'
        }
      });

      if (error) throw error;

      toast.success(`Scan completed! Found ${data.issuesFound} issues`);
      await loadData();
    } catch (error) {
      console.error('Scan failed:', error);
      toast.error('Failed to trigger scan');
    } finally {
      setIsScanning(false);
    }
  };

  const fixIssue = async (issueId: string) => {
    setIsFixing(issueId);
    try {
      const { data, error } = await supabase.functions.invoke('deepsource-integration', {
        body: {
          action: 'fix_issue',
          issueId
        }
      });

      if (error) throw error;

      toast.success('Issue fixed successfully!');
      await loadData();
    } catch (error) {
      console.error('Fix failed:', error);
      toast.error('Failed to fix issue');
    } finally {
      setIsFixing(null);
    }
  };

  const fixAllIssues = async () => {
    setIsBatchFixing(true);
    try {
      const { data, error } = await supabase.functions.invoke('deepsource-integration', {
        body: {
          action: 'fix_all'
        }
      });

      if (error) throw error;

      toast.success(`Fixed ${data.fixedCount} out of ${data.totalIssues} issues`);
      await loadData();
    } catch (error) {
      console.error('Batch fix failed:', error);
      toast.error('Failed to fix all issues');
    } finally {
      setIsBatchFixing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fixed': return 'bg-green-100 text-green-800 border-green-200';
      case 'open': return 'bg-red-100 text-red-800 border-red-200';
      case 'fixing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ignored': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fixed': return <CheckCircle2 className="h-4 w-4" />;
      case 'open': return <AlertTriangle className="h-4 w-4" />;
      case 'fixing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'ignored': return <Clock className="h-4 w-4" />;
      default: return <Bug className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
            <p className="text-muted-foreground">
              Code quality monitoring for leasy-development/leasy-renewal-core
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fixAllIssues} 
            disabled={isBatchFixing || stats.openIssues === 0}
            variant="default"
          >
            <Zap className={`h-4 w-4 mr-2 ${isBatchFixing ? 'animate-spin' : ''}`} />
            Autofix All ({stats.openIssues})
          </Button>
          <Button onClick={triggerScan} disabled={isScanning} variant="outline">
            <Play className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            Trigger Scan
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {!repository && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            Repository not configured. The first scan will create the repository configuration automatically.
            Make sure the DEEPSOURCE_API_TOKEN is configured in your Supabase project secrets.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.qualityScore}%</div>
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
              {stats.openIssues} open, {stats.fixedIssues} fixed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.criticalIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.criticalIssues}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentScans.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recentScans[0] ? `Last: ${formatDate(stats.recentScans[0].created_at)}` : 'No scans yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="issues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="issues">Issues ({filteredIssues.length})</TabsTrigger>
          <TabsTrigger value="scans">Recent Scans</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search issues..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="style">Style</SelectItem>
                    <SelectItem value="complexity">Complexity</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="fixing">Fixing</SelectItem>
                    <SelectItem value="ignored">Ignored</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Issues List */}
          <Card>
            <CardHeader>
              <CardTitle>Code Quality Issues</CardTitle>
              <CardDescription>
                Found {filteredIssues.length} issues matching your filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredIssues.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No issues found</h3>
                  <p className="text-muted-foreground">
                    {issues.length === 0 
                      ? "Run your first scan to detect code quality issues"
                      : "All issues match your current filters"
                    }
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {filteredIssues.map((issue) => (
                      <div key={issue.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(issue.status)}
                              <Badge className={getSeverityColor(issue.severity)}>
                                {issue.severity}
                              </Badge>
                              <Badge className={getStatusColor(issue.status)}>
                                {issue.status}
                              </Badge>
                              <span className="text-sm font-mono text-muted-foreground">
                                {issue.check_id}
                              </span>
                            </div>
                            <h4 className="font-medium mb-1">{issue.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {issue.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {issue.file_path}
                              </span>
                              <span>Lines {issue.line_begin}-{issue.line_end}</span>
                              <span className="capitalize">{issue.category}</span>
                            </div>
                            {issue.fix_summary && (
                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                                <strong>Fix applied:</strong> {issue.fix_summary}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {issue.status === 'open' && issue.is_autofixable && (
                              <Button
                                size="sm"
                                onClick={() => fixIssue(issue.id)}
                                disabled={isFixing === issue.id}
                              >
                                {isFixing === issue.id ? (
                                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Zap className="h-3 w-3 mr-1" />
                                )}
                                Autofix
                              </Button>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(issue.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scan History</CardTitle>
              <CardDescription>Recent code quality scans</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentScans.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No scans yet</h3>
                  <p className="text-muted-foreground">
                    Trigger your first scan to see results here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentScans.map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={scan.status === 'completed' ? 'default' : 'secondary'}>
                            {scan.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground capitalize">
                            {scan.scan_type} scan
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Found {scan.issues_found} issues, fixed {scan.issues_fixed}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(scan.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Issue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['critical', 'high', 'medium', 'low'].map(severity => {
                    const count = issues.filter(issue => issue.severity === severity).length;
                    const percentage = stats.totalIssues > 0 ? (count / stats.totalIssues) * 100 : 0;
                    return (
                      <div key={severity} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{severity}</span>
                          <span>{count}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['security', 'performance', 'style', 'complexity'].map(category => {
                    const count = issues.filter(issue => issue.category === category).length;
                    const percentage = stats.totalIssues > 0 ? (count / stats.totalIssues) * 100 : 0;
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{category}</span>
                          <span>{count}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeepSourceDashboard;