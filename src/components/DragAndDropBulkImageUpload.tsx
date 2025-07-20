import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  CloudUpload, 
  Image as ImageIcon, 
  X, 
  Brain, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Save,
  Eye,
  Tag,
  FileImage,
  Zap,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { mediaIntelligenceService, IMAGE_CATEGORIES, ImageCategory } from '@/services/mediaIntelligenceService';

interface DragAndDropBulkImageUploadProps {
  propertyId: string;
  onUploadComplete?: () => void;
  maxFiles?: number;
  maxSizePerFile?: number;
}

interface UploadFile {
  file: File;
  id: string;
  preview: string;
  status: 'pending' | 'analyzing' | 'analyzed' | 'uploading' | 'complete' | 'error';
  aiPrediction?: {
    category: ImageCategory;
    confidence: number;
    reasoning?: string;
  };
  manualCategory?: ImageCategory;
  error?: string;
  uploadUrl?: string;
}

interface CategoryGroup {
  category: ImageCategory;
  label: string;
  files: UploadFile[];
  confidence: number;
}

const DragAndDropBulkImageUpload: React.FC<DragAndDropBulkImageUploadProps> = ({
  propertyId,
  onUploadComplete,
  maxFiles = 50,
  maxSizePerFile = 10 * 1024 * 1024 // 10MB
}) => {
  const { toast } = useToast();
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Validate files
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > maxSizePerFile) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds the ${maxSizePerFile / 1024 / 1024}MB limit`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (uploadFiles.length + validFiles.length > maxFiles) {
      toast({
        title: "Too Many Files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }

    // Create upload file objects
    const newFiles: UploadFile[] = validFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      preview: URL.createObjectURL(file),
      status: 'pending'
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);

    // Start AI analysis
    analyzeImages(newFiles);
  }, [uploadFiles.length, maxFiles, maxSizePerFile, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp']
    },
    multiple: true
  });

  // Analyze images with AI
  const analyzeImages = async (files: UploadFile[]) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Update status
        setUploadFiles(prev => 
          prev.map(f => f.id === file.id ? { ...f, status: 'analyzing' } : f)
        );

        // Convert file to base64 for AI analysis
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file.file);
        });
        
        const base64Image = await base64Promise;

        // Call AI categorization
        const { data: aiResult, error } = await supabase.functions.invoke('ai-image-categorization', {
          body: { imageUrl: base64Image, property_id: propertyId }
        });

        if (error) throw error;

        // Update file with AI prediction
        setUploadFiles(prev => 
          prev.map(f => f.id === file.id ? { 
            ...f, 
            status: 'analyzed',
            aiPrediction: {
              category: aiResult.category,
              confidence: aiResult.confidence,
              reasoning: aiResult.reasoning
            }
          } : f)
        );

      } catch (error) {
        console.error('AI analysis failed for', file.file.name, error);
        
        setUploadFiles(prev => 
          prev.map(f => f.id === file.id ? { 
            ...f, 
            status: 'analyzed',
            aiPrediction: {
              category: 'other' as ImageCategory,
              confidence: 0.5,
              reasoning: 'AI analysis failed'
            }
          } : f)
        );
      }

      // Update progress
      setAnalysisProgress(((i + 1) / files.length) * 100);
    }

    setIsAnalyzing(false);
    toast({
      title: "Analysis Complete",
      description: `Analyzed ${files.length} images and grouped by category`,
    });
  };

  // Group files by category
  const categoryGroups: CategoryGroup[] = React.useMemo(() => {
    const groups: Record<string, UploadFile[]> = {};
    
    uploadFiles.forEach(file => {
      const category = file.manualCategory || file.aiPrediction?.category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(file);
    });

    return Object.entries(groups).map(([category, files]) => {
      const categoryInfo = IMAGE_CATEGORIES.find(cat => cat.value === category);
      const avgConfidence = files.reduce((sum, f) => sum + (f.aiPrediction?.confidence || 0), 0) / files.length;
      
      return {
        category: category as ImageCategory,
        label: categoryInfo?.label || 'Other',
        files,
        confidence: avgConfidence
      };
    }).sort((a, b) => {
      const aPriority = IMAGE_CATEGORIES.find(cat => cat.value === a.category)?.priority || 999;
      const bPriority = IMAGE_CATEGORIES.find(cat => cat.value === b.category)?.priority || 999;
      return aPriority - bPriority;
    });
  }, [uploadFiles]);

  // Remove file
  const removeFile = (fileId: string) => {
    setUploadFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== fileId);
    });
  };

  // Update manual category
  const updateManualCategory = (fileId: string, category: ImageCategory) => {
    setUploadFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, manualCategory: category } : f)
    );
  };

  // Upload all files
  const uploadAllFiles = async () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const filesToUpload = uploadFiles.filter(f => f.status !== 'error');
    
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      
      try {
        // Update status
        setUploadFiles(prev => 
          prev.map(f => f.id === file.id ? { ...f, status: 'uploading' } : f)
        );

        // Upload to storage
        const fileExt = file.file.name.split('.').pop();
        const fileName = `${propertyId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('property-photos')
          .upload(fileName, file.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('property-photos')
          .getPublicUrl(uploadData.path);

        // Save to property_media
        const finalCategory = file.manualCategory || file.aiPrediction?.category || 'other';
        const { data: mediaData, error: mediaError } = await supabase
          .from('property_media')
          .insert({
            property_id: propertyId,
            url: urlData.publicUrl,
            media_type: 'photo',
            title: file.file.name,
            ai_category: finalCategory,
            confidence_score: file.aiPrediction?.confidence || 0,
            sort_order: IMAGE_CATEGORIES.find(cat => cat.value === finalCategory)?.priority || 999
          })
          .select()
          .single();

        if (mediaError) throw mediaError;

        // Store categorization data
        if (file.aiPrediction) {
          await mediaIntelligenceService.storeCategorization(
            propertyId,
            urlData.publicUrl,
            file.aiPrediction.category,
            file.aiPrediction.confidence,
            !file.manualCategory
          );
        }

        // Record audit trail
        await mediaIntelligenceService.recordAuditTrail(
          propertyId,
          urlData.publicUrl,
          'bulk_import',
          {
            original_filename: file.file.name,
            file_size: file.file.size,
            ai_prediction: file.aiPrediction,
            manual_override: !!file.manualCategory
          }
        );

        // Update status
        setUploadFiles(prev => 
          prev.map(f => f.id === file.id ? { 
            ...f, 
            status: 'complete',
            uploadUrl: urlData.publicUrl
          } : f)
        );

      } catch (error) {
        console.error('Upload failed for', file.file.name, error);
        
        setUploadFiles(prev => 
          prev.map(f => f.id === file.id ? { 
            ...f, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          } : f)
        );
      }

      // Update progress
      setUploadProgress(((i + 1) / filesToUpload.length) * 100);
    }

    setIsUploading(false);
    
    const successCount = uploadFiles.filter(f => f.status === 'complete').length;
    const errorCount = uploadFiles.filter(f => f.status === 'error').length;
    
    toast({
      title: "Upload Complete",
      description: `${successCount} images uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
    });

    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  const canUpload = uploadFiles.length > 0 && 
                   uploadFiles.every(f => f.status === 'analyzed' || f.status === 'complete') &&
                   !isUploading;

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
              ${isDragActive 
                ? 'border-primary bg-primary/5 scale-105' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
              }
            `}
          >
            <input {...getInputProps()} />
            <CloudUpload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {isDragActive ? 'Drop images here...' : 'Drag & drop images here'}
            </h3>
            <p className="text-muted-foreground mb-4">
              or click to select files • Max {maxFiles} files, {maxSizePerFile / 1024 / 1024}MB each
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Brain className="w-4 h-4" />
              <span>AI will automatically categorize your images</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-5 h-5 animate-pulse text-primary" />
              <span className="font-medium">AI Analyzing Images...</span>
              <Badge variant="outline">{Math.round(analysisProgress)}%</Badge>
            </div>
            <Progress value={analysisProgress} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              Categorizing images and detecting room types
            </p>
          </CardContent>
        </Card>
      )}

      {/* Category Groups */}
      {categoryGroups.length > 0 && !isAnalyzing && (
        <div className="space-y-4">
          {categoryGroups.map((group) => (
            <Card key={group.category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    {group.label} ({group.files.length})
                  </CardTitle>
                  <Badge variant="outline">
                    {Math.round(group.confidence * 100)}% avg confidence
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {group.files.map((file) => (
                    <div key={file.id} className="relative group">
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={file.preview} 
                          alt={file.file.name}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Status overlay */}
                        {file.status === 'analyzing' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-white animate-spin" />
                          </div>
                        )}
                        
                        {/* Confidence badge */}
                        {file.aiPrediction && (
                          <Badge 
                            className="absolute top-1 right-1 text-xs"
                            variant={file.aiPrediction.confidence >= 0.8 ? "default" : "secondary"}
                          >
                            {Math.round(file.aiPrediction.confidence * 100)}%
                          </Badge>
                        )}
                        
                        {/* Remove button */}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 left-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      {/* Category override */}
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground truncate">
                          {file.file.name}
                        </p>
                        <Select
                          value={file.manualCategory || file.aiPrediction?.category || ''}
                          onValueChange={(value) => updateManualCategory(file.id, value as ImageCategory)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {IMAGE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <CloudUpload className="w-5 h-5 animate-pulse text-primary" />
              <span className="font-medium">Uploading Images...</span>
              <Badge variant="outline">{Math.round(uploadProgress)}%</Badge>
            </div>
            <Progress value={uploadProgress} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              Saving images to your property gallery
            </p>
          </CardContent>
        </Card>
      )}

      {/* Final Actions */}
      {uploadFiles.length > 0 && !isAnalyzing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {uploadFiles.length} images ready for upload
                </span>
                {uploadFiles.some(f => f.manualCategory) && (
                  <Badge variant="outline" className="text-xs">
                    <User className="w-3 h-3 mr-1" />
                    Manual overrides detected
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    uploadFiles.forEach(f => URL.revokeObjectURL(f.preview));
                    setUploadFiles([]);
                  }}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
                <Button
                  onClick={uploadAllFiles}
                  disabled={!canUpload}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save All Images ({uploadFiles.length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {uploadFiles.some(f => f.status === 'complete') && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            Successfully uploaded {uploadFiles.filter(f => f.status === 'complete').length} images. 
            They have been automatically categorized and added to your property gallery.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DragAndDropBulkImageUpload;