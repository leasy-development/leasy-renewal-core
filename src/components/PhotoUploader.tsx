import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
}

const PhotoUploader = ({ photos, onPhotosChange, maxFiles = 20, maxSizePerFile = 10 }: Props) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: `${file.name} is not an image file.`,
        variant: "destructive",
      });
      return false;
    }

    // Check file size
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

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newFiles: File[] = [];
    const totalFilesAfterAdd = photos.length + files.length;

    if (totalFilesAfterAdd > maxFiles) {
      toast({
        title: "Too Many Files",
        description: `You can only upload up to ${maxFiles} photos. You're trying to add ${files.length} more to your existing ${photos.length} photos.`,
        variant: "destructive",
      });
      return;
    }

    Array.from(files).forEach(file => {
      if (validateFile(file)) {
        // Check for duplicates
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

    if (newFiles.length > 0) {
      onPhotosChange([...photos, ...newFiles]);
      toast({
        title: "Photos Added",
        description: `${newFiles.length} photo(s) added successfully.`,
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
    // Reset input value so the same file can be selected again
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

  const getImageUrl = (file: File) => {
    return URL.createObjectURL(file);
  };

  return (
    <div className="space-y-4">
      <Label>
        <ImageIcon className="inline h-4 w-4 mr-1" />
        Photos ({photos.length}/{maxFiles})
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
          disabled={photos.length >= maxFiles}
        >
          <Upload className="h-4 w-4 mr-2" />
          {photos.length >= maxFiles ? 'Maximum Photos Reached' : 'Choose Photos'}
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
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <Card key={index} className="relative group overflow-hidden">
              <div className="aspect-square">
                <img
                  src={getImageUrl(photo)}
                  alt={`Property photo ${index + 1}`}
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

      {photos.length === 0 && (
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