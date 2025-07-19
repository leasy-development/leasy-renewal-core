import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Merge,
  X,
  RefreshCw,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { DuplicateReviewModal } from "./DuplicateReviewModal";

interface DuplicateGroup {
  id: string;
  confidence_score: number;
  status: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
  properties: Array<{
    id: string;
    property_id: string;
    similarity_reasons: string[];
    properties: {
      title: string;
      street_name: string;
      street_number?: string;
      city: string;
      zip_code?: string;
      monthly_rent: number;
      bedrooms?: number;
      bathrooms?: number;
      square_meters?: number;
      user_id: string;
      created_at: string;
    };
  }>;
}

interface Stats {
  total_pending: number;
  total_resolved: number;
  high_confidence: number;
  recent_activity: number;
}

export default function AdminDeduplicationPanel() {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const { user } = useAuth();
  const { toast } = useToast();

  const loadDuplicateGroups = async (status = "pending") => {
    try {
      const { data, error } = await supabase
        .from('global_duplicate_groups')
        .select(`
          *,
          global_duplicate_properties (
            id,
            property_id,
            similarity_reasons,
            properties (
              title,
              street_name,
              street_number,
              city,
              zip_code,
              monthly_rent,
              bedrooms,
              bathrooms,
              square_meters,
              user_id,
              created_at
            )
          )
        `)
        .eq('status', status)
        .order('confidence_score', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(group => ({
        ...group,
        properties: (group.global_duplicate_properties || []).map((prop: any) => ({
          ...prop,
          similarity_reasons: Array.isArray(prop.similarity_reasons) 
            ? prop.similarity_reasons 
            : JSON.parse(prop.similarity_reasons || '[]')
        }))
      }));
      
      setDuplicateGroups(transformedData);
    } catch (error) {
      console.error('Failed to load duplicate groups:', error);
      toast({
        title: "Error",
        description: "Failed to load duplicate groups",
        variant: "destructive"
      });
    }
  };

  const loadStats = async () => {
    try {
      const [pendingRes, resolvedRes, highConfRes, recentRes] = await Promise.all([
        supabase.from('global_duplicate_groups').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('global_duplicate_groups').select('id', { count: 'exact' }).neq('status', 'pending'),
        supabase.from('global_duplicate_groups').select('id', { count: 'exact' }).gte('confidence_score', 0.9),
        supabase.from('global_duplicate_groups').select('id', { count: 'exact' }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      setStats({
        total_pending: pendingRes.count || 0,
        total_resolved: resolvedRes.count || 0,
        high_confidence: highConfRes.count || 0,
        recent_activity: recentRes.count || 0
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const triggerGlobalScan = async () => {
    setIsScanning(true);
    try {
      const { error } = await supabase.functions.invoke('global-duplicate-scan', {
        body: { trigger: 'manual', admin_user_id: user?.id }
      });

      if (error) throw error;

      toast({
        title: "Scan Initiated",
        description: "Global duplicate scan has been started. Results will appear shortly.",
      });

      // Refresh data after a short delay
      setTimeout(() => {
        loadDuplicateGroups(activeTab);
        loadStats();
      }, 3000);
    } catch (error) {
      console.error('Failed to trigger scan:', error);
      toast({
        title: "Scan Failed",
        description: "Failed to initiate global duplicate scan",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleReviewGroup = (group: DuplicateGroup) => {
    setSelectedGroup(group);
  };

  const handleGroupResolved = () => {
    setSelectedGroup(null);
    loadDuplicateGroups(activeTab);
    loadStats();
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.9) return <Badge variant="destructive">High ({(score * 100).toFixed(0)}%)</Badge>;
    if (score >= 0.7) return <Badge variant="secondary">Medium ({(score * 100).toFixed(0)}%)</Badge>;
    return <Badge variant="outline">Low ({(score * 100).toFixed(0)}%)</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'resolved': return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>;
      case 'dismissed': return <Badge variant="secondary"><X className="w-3 h-3 mr-1" />Dismissed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  useEffect(() => {
    loadDuplicateGroups(activeTab);
    loadStats();
    setIsLoading(false);
  }, [activeTab]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading duplicate detection panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Global Duplicate Detection</h1>
          <p className="text-muted-foreground">Manage and review potential duplicate properties across all users</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={triggerGlobalScan} 
            disabled={isScanning}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Run Global Scan'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_resolved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
              <BarChart3 className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.high_confidence}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent (24h)</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recent_activity}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({stats?.total_pending || 0})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Duplicate Groups - {activeTab}</CardTitle>
              <CardDescription>
                Review potential duplicate properties and take action
              </CardDescription>
            </CardHeader>
            <CardContent>
              {duplicateGroups.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No {activeTab} duplicate groups found. Great job keeping the database clean!
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group ID</TableHead>
                      <TableHead>Properties</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duplicateGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-mono text-xs">
                          {group.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {group.properties?.slice(0, 2).map((prop, idx) => (
                              <div key={idx} className="text-sm">
                                <div className="font-medium">{prop.properties?.title}</div>
                                <div className="text-muted-foreground text-xs">
                                  {prop.properties?.street_name}, {prop.properties?.city}
                                </div>
                              </div>
                            ))}
                            {group.properties?.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{group.properties.length - 2} more
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getConfidenceBadge(group.confidence_score)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(group.status)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(group.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleReviewGroup(group)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedGroup && (
        <DuplicateReviewModal 
          group={selectedGroup} 
          onClose={() => setSelectedGroup(null)}
          onResolved={handleGroupResolved}
        />
      )}
    </div>
  );
}