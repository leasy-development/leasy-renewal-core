import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Search, 
  Filter, 
  ExternalLink, 
  Eye, 
  Bot, 
  User, 
  History,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { mediaIntelligenceService, IMAGE_CATEGORIES } from '@/services/mediaIntelligenceService';
import { format } from 'date-fns';

interface AuditTrailViewerProps {
  propertyId: string;
}

interface AuditEntry {
  id: string;
  image_url: string;
  source_type: 'manual_upload' | 'bulk_import' | 'scraper' | 'ai_generated';
  original_filename?: string;
  user_id?: string;
  metadata: any;
  health_check_results: any;
  created_at: string;
}

interface CategorizationData {
  id: string;
  image_url: string;
  predicted_category?: string;
  confidence_score?: number;
  final_category?: string;
  is_auto_assigned: boolean;
  created_at: string;
  updated_at: string;
}

interface FeedbackData {
  id: string;
  image_categorization_id: string;
  original_prediction?: string;
  corrected_category: string;
  user_id: string;
  created_at: string;
}

interface AuditRow {
  id: string;
  imageUrl: string;
  filename: string;
  source: string;
  initialCategory?: string;
  finalCategory?: string;
  confidence?: number;
  uploadedBy?: string;
  uploadedAt: string;
  corrections: FeedbackData[];
  healthStatus: 'healthy' | 'warning' | 'error';
  metadata: any;
}

const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({ propertyId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditRow | null>(null);

  // Fetch audit trail data
  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['audit-trail', propertyId],
    queryFn: () => mediaIntelligenceService.getAuditTrail(propertyId)
  });

  // Fetch categorization data
  const { data: categorizationData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categorization-audit', propertyId],
    queryFn: () => mediaIntelligenceService.getImageCategorizations(propertyId)
  });

  // Fetch feedback data
  const { data: feedbackData } = useQuery({
    queryKey: ['feedback-audit', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorization_feedback')
        .select(`
          *,
          image_categorization_id
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FeedbackData[];
    }
  });

  // Combine and process data
  const processedAuditData: AuditRow[] = useMemo(() => {
    if (!auditData || !categorizationData) return [];

    return auditData.map(audit => {
      const categorization = categorizationData.find(cat => cat.image_url === audit.image_url);
      const corrections = feedbackData?.filter(fb => 
        fb.image_categorization_id === categorization?.id
      ) || [];

      // Determine health status
      let healthStatus: 'healthy' | 'warning' | 'error' = 'healthy';
      if (audit.health_check_results?.error) {
        healthStatus = 'error';
      } else if (
        audit.health_check_results?.is_too_small || 
        audit.health_check_results?.is_blank ||
        !categorization
      ) {
        healthStatus = 'warning';
      }

      return {
        id: audit.id,
        imageUrl: audit.image_url,
        filename: audit.original_filename || 'Unknown',
        source: audit.source_type,
        initialCategory: categorization?.predicted_category,
        finalCategory: categorization?.final_category || categorization?.predicted_category,
        confidence: categorization?.confidence_score,
        uploadedBy: audit.user_id,
        uploadedAt: audit.created_at,
        corrections,
        healthStatus,
        metadata: audit.metadata
      };
    }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [auditData, categorizationData, feedbackData]);

  // Filter data
  const filteredData = useMemo(() => {
    return processedAuditData.filter(entry => {
      const matchesSearch = entry.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.finalCategory?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSource = sourceFilter === 'all' || entry.source === sourceFilter;
      
      const matchesStatus = statusFilter === 'all' || entry.healthStatus === statusFilter;
      
      return matchesSearch && matchesSource && matchesStatus;
    });
  }, [processedAuditData, searchTerm, sourceFilter, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = processedAuditData.length;
    const healthy = processedAuditData.filter(e => e.healthStatus === 'healthy').length;
    const warnings = processedAuditData.filter(e => e.healthStatus === 'warning').length;
    const errors = processedAuditData.filter(e => e.healthStatus === 'error').length;
    const corrected = processedAuditData.filter(e => e.corrections.length > 0).length;
    const autoAssigned = processedAuditData.filter(e => {
      const cat = categorizationData?.find(c => c.image_url === e.imageUrl);
      return cat?.is_auto_assigned === true;
    }).length;

    return { total, healthy, warnings, errors, corrected, autoAssigned };
  }, [processedAuditData, categorizationData]);

  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case 'manual_upload': return 'default';
      case 'bulk_import': return 'secondary';
      case 'scraper': return 'outline';
      default: return 'outline';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getCategoryLabel = (category?: string) => {
    if (!category) return '-';
    const categoryInfo = IMAGE_CATEGORIES.find(cat => cat.value === category);
    return categoryInfo?.label || category;
  };

  if (auditLoading || categoriesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Images</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.healthy}</div>
            <div className="text-sm text-muted-foreground">Healthy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.warnings}</div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.autoAssigned}</div>
            <div className="text-sm text-muted-foreground">AI Assigned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.corrected}</div>
            <div className="text-sm text-muted-foreground">Corrected</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Audit Trail ({filteredData.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by filename or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="manual_upload">Manual Upload</SelectItem>
                <SelectItem value="bulk_import">Bulk Import</SelectItem>
                <SelectItem value="scraper">Scraper</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audit Table */}
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Initial Category</TableHead>
                  <TableHead>Final Category</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Corrections</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-muted/50">
                    <TableCell>
                      {getHealthIcon(entry.healthStatus)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-muted rounded overflow-hidden">
                          <img 
                            src={entry.imageUrl} 
                            alt={entry.filename}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-sm font-medium truncate max-w-32">
                          {entry.filename}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={getSourceBadgeVariant(entry.source)}>
                        {entry.source.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm">
                        {getCategoryLabel(entry.initialCategory)}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {getCategoryLabel(entry.finalCategory)}
                        </span>
                        {entry.corrections.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <User className="w-3 h-3 mr-1" />
                            Corrected
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {entry.confidence && (
                        <Badge 
                          variant={entry.confidence >= 0.8 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {Math.round(entry.confidence * 100)}%
                        </Badge>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(entry.uploadedAt), 'MMM dd, yyyy')}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(entry.uploadedAt), 'HH:mm')}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {entry.corrections.length > 0 ? (
                        <Badge variant="outline" className="text-xs">
                          {entry.corrections.length} correction{entry.corrections.length > 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedEntry(entry)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Audit Details</DialogTitle>
                            </DialogHeader>
                            {selectedEntry && (
                              <AuditDetailView entry={selectedEntry} />
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button size="sm" variant="outline" asChild>
                          <a 
                            href={entry.imageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredData.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No audit entries found matching your filters.
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// Audit Detail View Component
interface AuditDetailViewProps {
  entry: AuditRow;
}

const AuditDetailView: React.FC<AuditDetailViewProps> = ({ entry }) => {
  return (
    <div className="space-y-4">
      {/* Image Preview */}
      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
        <img 
          src={entry.imageUrl} 
          alt={entry.filename}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">File Information</h4>
          <div className="space-y-1 text-sm">
            <div><span className="text-muted-foreground">Filename:</span> {entry.filename}</div>
            <div><span className="text-muted-foreground">Source:</span> {entry.source}</div>
            <div><span className="text-muted-foreground">Uploaded:</span> {format(new Date(entry.uploadedAt), 'PPp')}</div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Categorization</h4>
          <div className="space-y-1 text-sm">
            <div><span className="text-muted-foreground">Initial:</span> {getCategoryLabel(entry.initialCategory)}</div>
            <div><span className="text-muted-foreground">Final:</span> {getCategoryLabel(entry.finalCategory)}</div>
            {entry.confidence && (
              <div><span className="text-muted-foreground">Confidence:</span> {Math.round(entry.confidence * 100)}%</div>
            )}
          </div>
        </div>
      </div>

      {/* Corrections History */}
      {entry.corrections.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Correction History</h4>
          <div className="space-y-2">
            {entry.corrections.map((correction, index) => (
              <div key={correction.id} className="flex items-center justify-between p-2 border rounded">
                <div className="text-sm">
                  <span className="text-muted-foreground">Changed from</span> {getCategoryLabel(correction.original_prediction)} <span className="text-muted-foreground">to</span> {getCategoryLabel(correction.corrected_category)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(correction.created_at), 'MMM dd, HH:mm')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Metadata</h4>
          <ScrollArea className="h-32">
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

function getCategoryLabel(category?: string) {
  if (!category) return '-';
  const categoryInfo = IMAGE_CATEGORIES.find(cat => cat.value === category);
  return categoryInfo?.label || category;
}

export default AuditTrailViewer;