import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface StoredPhoto {
  id: string;
  url: string;
  title?: string;
  sort_order: number;
}

interface Props {
  propertyId?: string;
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
}

const PhotoUploader = ({ propertyId, photos, onPhotosChange, maxFiles = 20, maxSizePerFile = 10 }: Props) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [storedPhotos, setStoredPhotos] = useState<StoredPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load existing photos when propertyId is available
  useEffect(() => {
    if (propertyId && user) {
      loadExistingPhotos();
    }
  }, [propertyId, user]);

  const loadExistingPhotos = async () => {
    if (!propertyId) return;

    try {
      const { data, error } = await supabase
        .from('property_media')
        .select('*')
        .eq('property_id', propertyId)
        .eq('media_type', 'image')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setStoredPhotos(data || []);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const uploadToStorage = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${propertyId || 'temp'}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Storage upload error:', error);
      throw error;
    }
  };

  const savePhotoToDatabase = async (url: string, sortOrder: number) => {
    if (!propertyId) return;

    try {
      const { error } = await supabase
        .from('property_media')
        .insert({
          property_id: propertyId,
          media_type: 'image',
          url: url,
          sort_order: sortOrder
        });

      if (error) throw error;
    } catch (error) {
      console.error('Database save error:', error);
      throw error;
    }
  };

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: `${file.name} is not an image file.`,
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSizePerFile * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: `${file.name} is larger than ${maxSizePerFile}MB.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;

    const newFiles: File[] = [];
    const totalFilesAfterAdd = photos.length + storedPhotos.length + files.length;

    if (totalFilesAfterAdd > maxFiles) {
      toast({
        title: "Too Many Files",
        description: `You can only upload up to ${maxFiles} photos total.`,
        variant: "destructive",
      });
      return;
    }

    // Validate all files first
    Array.from(files).forEach(file => {
      if (validateFile(file)) {
        const isDuplicate = photos.some(existingFile => 
          existingFile.name === file.name && existingFile.size === file.size
        );
        
        if (!isDuplicate) {
          newFiles.push(file);
        } else {
          toast({
            title: "Duplicate File",
            description: `${file.name} has already been added.`,
            variant: "destructive",
          });
        }
      }
    });

    if (newFiles.length === 0) return;

    // If we have a propertyId, upload immediately
    if (propertyId) {
      setUploading(true);
      try {
        for (let i = 0; i < newFiles.length; i++) {
          const file = newFiles[i];
          const url = await uploadToStorage(file);
          if (url) {
            await savePhotoToDatabase(url, storedPhotos.length + i);
          }
        }
        
        await loadExistingPhotos(); // Refresh the stored photos
        toast({
          title: "Photos Uploaded",
          description: `${newFiles.length} photo(s) uploaded successfully.`,
        });
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload photos",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    } else {
      // Just add to local state for now (property not saved yet)
      onPhotosChange([...photos, ...newFiles]);
      toast({
        title: "Photos Added",
        description: `${newFiles.length} photo(s) added. They will be uploaded when you save the property.`,
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
    toast({
      title: "Photo Removed",
      description: "Photo has been removed from your listing.",
    });
  };

  const removeStoredPhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('property_media')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      await loadExistingPhotos(); // Refresh
      toast({
        title: "Photo Deleted",
        description: "Photo has been permanently deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete photo",
        variant: "destructive",
      });
    }
  };

  const getImageUrl = (file: File) => {
    return URL.createObjectURL(file);
  };

  const totalPhotos = photos.length + storedPhotos.length;

  return (
    <div className="space-y-4">
      <Label>
        <ImageIcon className="inline h-4 w-4 mr-1" />
        Photos ({totalPhotos}/{maxFiles})
      </Label>
      
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-muted-foreground mb-1">
          Drop photos here or click to upload
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          PNG, JPG, WEBP up to {maxSizePerFile}MB each • Max {maxFiles} photos
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={totalPhotos >= maxFiles || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {totalPhotos >= maxFiles ? 'Maximum Photos Reached' : 'Choose Photos'}
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Preview Grid */}
      {(storedPhotos.length > 0 || photos.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Stored Photos */}
          {storedPhotos.map((photo, index) => (
            <Card key={photo.id} className="relative group overflow-hidden">
              <div className="aspect-square">
                <img
                  src={photo.url}
                  alt={photo.title || `Property photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeStoredPhoto(photo.id)}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                <p className="text-white text-xs font-medium">
                  Uploaded
                </p>
              </div>
            </Card>
          ))}
          
          {/* Local Photos */}
          {photos.map((photo, index) => (
            <Card key={`local-${index}`} className="relative group overflow-hidden">
              <div className="aspect-square">
                <img
                  src={getImageUrl(photo)}
                  alt={`Property photo ${storedPhotos.length + index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removePhoto(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                <p className="text-white text-xs font-medium truncate">
                  {photo.name}
                </p>
                <p className="text-white/80 text-xs">
                  {(photo.size / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPhotos === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No photos uploaded yet</p>
          <p className="text-sm">Add photos to showcase your property</p>
        </div>
      )}
    </div>
  );
};

export default PhotoUploader;