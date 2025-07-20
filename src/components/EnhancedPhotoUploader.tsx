import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Brain, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Eye,
  Hash
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { mediaIntelligenceService, ImageCategory } from '@/services/mediaIntelligenceService';

interface EnhancedPhotoUploaderProps {
  propertyId: string;
  onPhotosChange?: (photos: any[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number;
}

interface UploadingFile {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error' | 'duplicate';
  url?: string;
  error?: string;
  category?: ImageCategory;
  confidence?: number;
  duplicate?: boolean;
  duplicateOf?: string;
  healthCheck?: any;
}

// Simple hash function for client-side duplicate detection
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

const EnhancedPhotoUploader: React.FC<EnhancedPhotoUploaderProps> = ({
  propertyId,
  onPhotosChange,
  maxFiles = 20,
  maxSizePerFile = 10 * 1024 * 1024 // 10MB
}) => {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [totalProgress, setTotalProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate client-side hash for basic duplicate detection
  const generateClientHash = useCallback(async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer.slice(0, Math.min(1024 * 1024, arrayBuffer.byteLength))); // First 1MB
    const hashInput = `${file.name}-${file.size}-${uint8Array.slice(0, 100).join('')}`;
    return simpleHash(hashInput);
  }, []);

  // Health check for uploaded file
  const performHealthCheck = useCallback(async (file: File): Promise<any> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        const results = {
          is_valid_image: true,
          dimensions: { width: img.width, height: img.height },
          file_size: file.size,
          is_too_small: img.width < 200 || img.height < 200,
          is_large_file: file.size > 5 * 1024 * 1024, // 5MB
          aspect_ratio: img.width / img.height,
          is_square: Math.abs(img.width - img.height) < 50
        };
        URL.revokeObjectURL(objectUrl);
        resolve(results);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          is_valid_image: false,
          error: 'Invalid image file'
        });
      };
      
      img.src = objectUrl;
    });
  }, []);

  // Upload file to Supabase storage
  const uploadFile = useCallback(async (file: File, uploadId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${propertyId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    // Update progress
    setUploadingFiles(prev => 
      prev.map(f => f.id === uploadId ? { ...f, progress: 10 } : f)
    );

    const { data, error } = await supabase.storage
      .from('property-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('property-photos')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }, [propertyId]);

  // Process a single file
  const processFile = useCallback(async (file: File) => {
    const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const uploadingFile: UploadingFile = {
      file,
      id: uploadId,
      progress: 0,
      status: 'uploading'
    };

    setUploadingFiles(prev => [...prev, uploadingFile]);

    try {
      // Health check
      setUploadingFiles(prev => 
        prev.map(f => f.id === uploadId ? { ...f, status: 'processing', progress: 5 } : f)
      );

      const healthCheck = await performHealthCheck(file);
      
      if (!healthCheck.is_valid_image) {
        throw new Error('Invalid image file');
      }

      // Generate hash for duplicate detection
      const clientHash = await generateClientHash(file);
      
      // Check for duplicates
      const duplicate = await mediaIntelligenceService.checkDuplicate(propertyId, clientHash);
      
      if (duplicate) {
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadId ? { 
            ...f, 
            status: 'duplicate', 
            progress: 100,
            duplicate: true,
            duplicateOf: duplicate.image_url
          } : f)
        );
        return;
      }

      // Upload to storage
      const imageUrl = await uploadFile(file, uploadId);
      
      setUploadingFiles(prev => 
        prev.map(f => f.id === uploadId ? { 
          ...f, 
          status: 'analyzing', 
          progress: 60,
          url: imageUrl 
        } : f)
      );

      // Store hash
      await mediaIntelligenceService.storeImageHash(
        propertyId,
        imageUrl,
        clientHash,
        {
          file_size: file.size,
          width: healthCheck.dimensions?.width,
          height: healthCheck.dimensions?.height
        }
      );

      // Save to property_media table
      const { data: mediaData, error: mediaError } = await supabase
        .from('property_media')
        .insert({
          property_id: propertyId,
          url: imageUrl,
          media_type: 'photo',
          title: file.name,
          sort_order: 0
        })
        .select()
        .single();

      if (mediaError) throw mediaError;

      // Record audit trail
      await mediaIntelligenceService.recordAuditTrail(
        propertyId,
        imageUrl,
        'manual_upload',
        { 
          original_filename: file.name,
          file_size: file.size,
          upload_method: 'enhanced_uploader'
        },
        healthCheck
      );

      // AI categorization
      try {
        const { data: aiResult, error: aiError } = await supabase.functions.invoke('ai-image-categorization', {
          body: { imageUrl, property_id: propertyId }
        });

        if (!aiError && aiResult) {
          // Store categorization
          await mediaIntelligenceService.storeCategorization(
            propertyId,
            imageUrl,
            aiResult.category,
            aiResult.confidence,
            true
          );

          // Update property media with AI category
          await mediaIntelligenceService.updatePropertyMediaCategorization(
            mediaData.id,
            aiResult.category,
            aiResult.confidence
          );

          setUploadingFiles(prev => 
            prev.map(f => f.id === uploadId ? { 
              ...f, 
              status: 'complete', 
              progress: 100,
              category: aiResult.category,
              confidence: aiResult.confidence,
              healthCheck
            } : f)
          );
        } else {
          // AI analysis failed, but upload was successful
          setUploadingFiles(prev => 
            prev.map(f => f.id === uploadId ? { 
              ...f, 
              status: 'complete', 
              progress: 100,
              healthCheck
            } : f)
          );
        }
      } catch (aiError) {
        console.warn('AI categorization failed:', aiError);
        // Continue without AI categorization
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadId ? { 
            ...f, 
            status: 'complete', 
            progress: 100,
            healthCheck
          } : f)
        );
      }

      toast({
        title: "Image Uploaded",
        description: `${file.name} has been uploaded successfully`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFiles(prev => 
        prev.map(f => f.id === uploadId ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed'
        } : f)
      );

      toast({
        title: "Upload Failed",
        description: `Failed to upload ${file.name}`,
        variant: "destructive",
      });
    }
  }, [propertyId, generateClientHash, performHealthCheck, uploadFile, toast]);

  // Handle file selection
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Validate files
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > maxSizePerFile) {
        toast({
          title: "File Too Large",
          description: `${file.name} is larger than ${maxSizePerFile / 1024 / 1024}MB`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (uploadingFiles.length + validFiles.length > maxFiles) {
      toast({
        title: "Too Many Files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }

    // Process files sequentially to avoid overwhelming the system
    for (const file of validFiles) {
      await processFile(file);
    }
  }, [maxFiles, maxSizePerFile, uploadingFiles.length, processFile, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp']
    },
    multiple: true
  });

  // Remove file from upload list
  const removeFile = useCallback((fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  // Retry failed upload
  const retryUpload = useCallback((fileId: string) => {
    const file = uploadingFiles.find(f => f.id === fileId);
    if (file && file.status === 'error') {
      removeFile(fileId);
      processFile(file.file);
    }
  }, [uploadingFiles, removeFile, processFile]);

  // Calculate overall progress
  React.useEffect(() => {
    if (uploadingFiles.length === 0) {
      setTotalProgress(0);
      return;
    }

    const totalProgress = uploadingFiles.reduce((sum, file) => sum + file.progress, 0);
    setTotalProgress(totalProgress / uploadingFiles.length);
  }, [uploadingFiles]);

  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'analyzing':
        return <Brain className="w-4 h-4 animate-pulse" />;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'duplicate':
        return <Hash className="w-4 h-4 text-orange-600" />;
      default:
        return <ImageIcon className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing...';
      case 'analyzing': return 'AI Analyzing...';
      case 'complete': return 'Complete';
      case 'error': return 'Failed';
      case 'duplicate': return 'Duplicate Found';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
              }
            `}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop images here...' : 'Drag & drop images here'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to select files • Max {maxFiles} files, {maxSizePerFile / 1024 / 1024}MB each
            </p>
            <Button variant="outline">
              Select Images
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Processing {uploadingFiles.length} files
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(totalProgress)}%
              </span>
            </div>
            <Progress value={totalProgress} className="mb-4" />
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uploadingFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-2 border rounded">
                  <div className="flex-shrink-0">
                    {getStatusIcon(file.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {file.file.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {getStatusText(file.status)}
                      </span>
                      {file.category && (
                        <Badge variant="secondary" className="text-xs">
                          {file.category} ({Math.round((file.confidence || 0) * 100)}%)
                        </Badge>
                      )}
                      {file.healthCheck?.is_too_small && (
                        <Badge variant="destructive" className="text-xs">
                          Low Resolution
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {file.status === 'error' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryUpload(file.id)}
                      >
                        Retry
                      </Button>
                    )}
                    {file.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate Alert */}
      {uploadingFiles.some(f => f.status === 'duplicate') && (
        <Alert>
          <Hash className="w-4 h-4" />
          <AlertDescription>
            Some images were identified as duplicates and were not uploaded. 
            This helps prevent cluttering your property gallery.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default EnhancedPhotoUploader;