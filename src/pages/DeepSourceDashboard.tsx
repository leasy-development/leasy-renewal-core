import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Code2, 
  RefreshCw, 
  Settings, 
  Shield,
  Zap,
  Search,
  Play,
  Bug,
  TrendingUp,
  AlertCircle,
  FileText,
  Calendar,
  HardHat,
  Wrench
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SecurityTestPanel from "@/components/SecurityTestPanel";

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
  occurrence_count: number;
  file_count: number;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
}

interface CategoryStats {
  category: string;
  count: number;
  totalOccurrences: number;
}

interface DeepSourceRepository {
  id: string;
  organization_slug: string;
  repository_name: string;
  api_token_configured: boolean;
  is_active: boolean;
  last_sync_at?: string;
}

const DeepSourceDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [issues, setIssues] = useState<DeepSourceIssue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<DeepSourceIssue[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [repository, setRepository] = useState<DeepSourceRepository | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState<string | null>(null);
  const [isBatchFixing, setIsBatchFixing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterIssues();
  }, [issues, searchTerm, selectedCategory]);

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
        .maybeSingle();

      setRepository(repoData);

      // Load issues with enhanced data
      const { data: issuesData } = await supabase
        .from('deepsource_issues')
        .select('*')
        .order('created_at', { ascending: false });

      const typedIssues: DeepSourceIssue[] = (issuesData || []).map(issue => ({
        ...issue,
        severity: issue.severity as 'low' | 'medium' | 'high' | 'critical',
        status: issue.status as 'open' | 'fixed' | 'ignored' | 'fixing',
        occurrence_count: issue.occurrence_count || 1,
        file_count: issue.file_count || 1
      }));

      setIssues(typedIssues);

      // Calculate category stats
      const statsMap = new Map<string, { count: number; totalOccurrences: number }>();
      
      typedIssues.forEach(issue => {
        const category = issue.category;
        const current = statsMap.get(category) || { count: 0, totalOccurrences: 0 };
        statsMap.set(category, {
          count: current.count + 1,
          totalOccurrences: current.totalOccurrences + issue.occurrence_count
        });
      });

      const stats = Array.from(statsMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        totalOccurrences: data.totalOccurrences
      }));

      setCategoryStats(stats);
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

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(issue => issue.category === selectedCategory);
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

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'security': return <Shield className="h-4 w-4" />;
      case 'bug-risk': case 'bug_risk': return <Bug className="h-4 w-4" />;
      case 'anti-pattern': case 'antipattern': return <AlertTriangle className="h-4 w-4" />;
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'style': return <Wrench className="h-4 w-4" />;
      default: return <Code2 className="h-4 w-4" />;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      default: return <Bug className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'just now';
    if (diffHours === 1) return 'an hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'a day ago';
    return `${diffDays} days ago`;
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
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
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-64 border-r bg-muted/30 p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <Code2 className="h-6 w-6 text-primary" />
            <h2 className="font-semibold">DeepSource</h2>
          </div>

          {/* All Issues */}
          <div 
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
              selectedCategory === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
            }`}
            onClick={() => setSelectedCategory('all')}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>All issues</span>
            </div>
            <span className="font-semibold">{formatCount(issues.length)}</span>
          </div>

          <Separator />

          {/* Category Breakdown */}
          <div className="space-y-2">
            {categoryStats.map((stat) => (
              <div
                key={stat.category}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedCategory === stat.category ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedCategory(stat.category)}
              >
                <div className="flex items-center gap-2">
                  {getCategoryIcon(stat.category)}
                  <span className="capitalize">{stat.category.replace('_', ' ').replace('-', ' ')}</span>
                </div>
                <span className="font-semibold">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {selectedCategory === 'all' 
                  ? `All issues (${formatCount(filteredIssues.length)})` 
                  : `${selectedCategory.replace('_', ' ').replace('-', ' ')} (${formatCount(filteredIssues.length)})`
                }
              </h1>
              <p className="text-muted-foreground">
                leasy-development/leasy-renewal-core
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={triggerScan} disabled={isScanning} variant="outline">
                <Play className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                Trigger Scan
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Status Alert */}
        {!repository && (
          <div className="p-6 space-y-4">
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                Repository not configured. The first scan will create the repository configuration automatically.
                Make sure the DEEPSOURCE_API_TOKEN is configured in your Supabase project secrets.
              </AlertDescription>
            </Alert>
            
            {/* Security Test Panel */}
            <SecurityTestPanel />
          </div>
        )}

        {/* Issues List */}
        <div className="flex-1 p-6">
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
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {filteredIssues.map((issue) => (
                  <Card key={issue.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getSeverityIcon(issue.severity)}
                          <Badge variant="outline" className="text-xs font-mono">
                            {issue.check_id}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {issue.category.replace('_', ' ').replace('-', ' ')}
                          </Badge>
                        </div>
                        
                        <h3 className="font-medium text-sm mb-1">{issue.title}</h3>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Seen in {issue.file_count} file{issue.file_count !== 1 ? 's' : ''}</span>
                          <span>{formatTimeAgo(issue.created_at)} — {formatTimeAgo(issue.last_seen_at)} old</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {issue.is_autofixable && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fixIssue(issue.id)}
                            disabled={isFixing === issue.id}
                          >
                            {isFixing === issue.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Zap className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {issue.occurrence_count}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeepSourceDashboard;