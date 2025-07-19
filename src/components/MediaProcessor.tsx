import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { mediaUploader } from '@/lib/mediaUploader';
import { Download, RefreshCw, CheckCircle, AlertCircle, Image, Clock } from 'lucide-react';

interface MediaProcessorProps {
  onProcessingComplete?: (results: any) => void;
}

interface ProcessingJob {
  id: string;
  type: 'existing_properties' | 'csv_upload' | 'manual_retry';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  results?: any;
  error?: string;
}

export function MediaProcessor({ onProcessingComplete }: MediaProcessorProps) {
  const [activeJobs, setActiveJobs] = useState<ProcessingJob[]>([]);
  const [completedJobs, setCompletedJobs] = useState<ProcessingJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const createJob = (type: ProcessingJob['type']): ProcessingJob => ({
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    status: 'pending',
    progress: 0,
    startTime: new Date()
  });

  const updateJob = (jobId: string, updates: Partial<ProcessingJob>) => {
    setActiveJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, ...updates } : job
    ));
  };

  const completeJob = (jobId: string, results?: any, error?: string) => {
    setActiveJobs(prev => {
      const job = prev.find(j => j.id === jobId);
      if (job) {
        const completedJob: ProcessingJob = {
          ...job,
          status: error ? 'failed' : 'completed',
          endTime: new Date(),
          results,
          error
        };
        setCompletedJobs(completed => [completedJob, ...completed.slice(0, 9)]); // Keep last 10 jobs
        return prev.filter(j => j.id !== jobId);
      }
      return prev;
    });
  };

  // Process existing properties missing media
  const processExistingProperties = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to process existing properties.",
        variant: "destructive"
      });
      return;
    }

    const job = createJob('existing_properties');
    setActiveJobs(prev => [...prev, job]);
    setIsProcessing(true);

    try {
      updateJob(job.id, { status: 'processing' });

      const results = await mediaUploader.processExistingPropertiesMissingMedia(
        user.id,
        (current, total, propertyId) => {
          const progress = (current / total) * 100;
          updateJob(job.id, { progress });
        }
      );

      completeJob(job.id, results);

      toast({
        title: "Processing Complete",
        description: `✅ ${results.processedProperties} properties processed, ${results.totalMediaDownloaded} media files downloaded`,
        variant: "default"
      });

      onProcessingComplete?.(results);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      completeJob(job.id, undefined, errorMessage);
      
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Process CSV upload media in background
  const processCsvMedia = async (
    properties: Array<{ id: string; data: Record<string, any> }>,
    csvFileName: string
  ) => {
    if (!user) throw new Error('User not authenticated');

    const job = createJob('csv_upload');
    setActiveJobs(prev => [...prev, job]);

    try {
      updateJob(job.id, { status: 'processing' });

      const results = await mediaUploader.uploadBatchMedia(properties, {
        userId: user.id,
        csvFileName,
        onPropertyProgress: (current, total) => {
          const progress = (current / total) * 100;
          updateJob(job.id, { progress });
        },
        batchSize: 3
      });

      completeJob(job.id, results);

      toast({
        title: "CSV Media Processing Complete",
        description: `📸 Downloaded ${results.summary.totalSuccess} media files for ${properties.length} properties`,
      });

      onProcessingComplete?.(results);
      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      completeJob(job.id, undefined, errorMessage);
      throw error;
    }
  };

  // Retry failed media downloads for a specific property
  const retryPropertyMedia = async (propertyId: string, propertyData: Record<string, any>) => {
    if (!user) return;

    const job = createJob('manual_retry');
    setActiveJobs(prev => [...prev, job]);

    try {
      updateJob(job.id, { status: 'processing' });

      const results = await mediaUploader.uploadPropertyMedia(propertyData, {
        userId: user.id,
        propertyId,
        csvFileName: 'manual_retry'
      });

      updateJob(job.id, { progress: 100 });
      completeJob(job.id, results);

      toast({
        title: "Retry Complete",
        description: `✅ ${results.summary.success} files downloaded, ${results.summary.failed} failed`,
        variant: results.summary.failed > 0 ? "default" : "default"
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      completeJob(job.id, undefined, errorMessage);
      
      toast({
        title: "Retry Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const formatDuration = (start: Date, end?: Date) => {
    const duration = (end || new Date()).getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const getJobStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'processing': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getJobTypeLabel = (type: ProcessingJob['type']) => {
    switch (type) {
      case 'existing_properties': return 'Existing Properties Scan';
      case 'csv_upload': return 'CSV Media Upload';
      case 'manual_retry': return 'Manual Retry';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Media Processing Center
          </CardTitle>
          <CardDescription>
            Auto-fetch and process media files from URLs in your property data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={processExistingProperties}
            disabled={isProcessing}
            className="w-full"
            variant="default"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processing Existing Properties...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Process All Existing Properties Missing Media
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Processing Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeJobs.map(job => (
              <div key={job.id} className="space-y-2 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getJobStatusIcon(job.status)}
                    <span className="font-medium">{getJobTypeLabel(job.type)}</span>
                    <Badge variant="outline">{job.status}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(job.startTime)}
                  </span>
                </div>
                {job.status === 'processing' && (
                  <Progress value={job.progress} className="w-full" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Jobs History */}
      {completedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Processing History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completedJobs.slice(0, 5).map(job => (
              <div key={job.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  {getJobStatusIcon(job.status)}
                  <span className="text-sm">{getJobTypeLabel(job.type)}</span>
                  {job.status === 'completed' && job.results && (
                    <Badge variant="secondary" className="text-xs">
                      {job.results.processedProperties || job.results.summary?.totalSuccess || 'Complete'}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDuration(job.startTime, job.endTime)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Usage Guide */}
      <Alert>
        <Image className="h-4 w-4" />
        <AlertTitle>How Media Auto-Fetching Works</AlertTitle>
        <AlertDescription>
          <div className="mt-2 space-y-1 text-sm">
            <p>• <strong>CSV Uploads:</strong> Media URLs are automatically detected and downloaded during bulk imports</p>
            <p>• <strong>Existing Properties:</strong> Scans description fields for image URLs and downloads them</p>
            <p>• <strong>Background Processing:</strong> Large media operations run without blocking the UI</p>
            <p>• <strong>Duplicate Detection:</strong> Skips already downloaded files to save bandwidth</p>
            <p>• <strong>Organized Storage:</strong> Files are grouped by CSV filename and property ID</p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Export the component
export default MediaProcessor;