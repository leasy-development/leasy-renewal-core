import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PhotoUploader from "@/components/PhotoUploader";
import { Upload, FileImage, Trash2, Eye } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MediaSectionProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  propertyId?: string;
}

interface FloorplanItem {
  id: string;
  file?: File;
  url?: string;
  title: string;
  uploading?: boolean;
}

export function MediaSection({ formData, updateFormData, propertyId }: MediaSectionProps) {
  const [floorplans, setFloorplans] = useState<FloorplanItem[]>(formData.floorplans || []);
  const [uploadingFloorplan, setUploadingFloorplan] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFloorplanUpload = async (files: FileList) => {
    if (!propertyId) {
      toast({
        title: "Save Property First",
        description: "Please save the property before uploading floorplans.",
        variant: "destructive",
      });
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload only image files for floorplans.",
          variant: "destructive",
        });
        continue;
      }

      const floorplanId = `floorplan-${Date.now()}-${i}`;
      const newFloorplan: FloorplanItem = {
        id: floorplanId,
        file,
        title: file.name.replace(/\.[^/.]+$/, ""),
        uploading: true,
      };

      setFloorplans(prev => [...prev, newFloorplan]);
      setUploadingFloorplan(floorplanId);

      try {
        const fileName = `${propertyId}/floorplans/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('property-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('property-photos')
          .getPublicUrl(fileName);

        // Save to property_media table
        const { error: dbError } = await supabase
          .from('property_media')
          .insert({
            property_id: propertyId,
            url: publicUrl,
            media_type: 'floorplan',
            title: newFloorplan.title,
            sort_order: floorplans.length,
          });

        if (dbError) throw dbError;

        setFloorplans(prev => prev.map(fp => 
          fp.id === floorplanId 
            ? { ...fp, url: publicUrl, uploading: false, file: undefined }
            : fp
        ));

        const updatedFloorplans = floorplans.map(fp => 
          fp.id === floorplanId 
            ? { ...fp, url: publicUrl, uploading: false, file: undefined }
            : fp
        );
        updatedFloorplans.push({ id: floorplanId, url: publicUrl, title: newFloorplan.title });
        updateFormData('floorplans', updatedFloorplans);

        toast({
          title: "Floorplan Uploaded",
          description: "Floorplan has been successfully uploaded.",
        });

      } catch (error: any) {
        console.error('Upload error:', error);
        setFloorplans(prev => prev.filter(fp => fp.id !== floorplanId));
        
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to upload floorplan.",
          variant: "destructive",
        });
      } finally {
        setUploadingFloorplan(null);
      }
    }
  };

  const removeFloorplan = async (floorplanId: string) => {
    const floorplan = floorplans.find(fp => fp.id === floorplanId);
    if (!floorplan) return;

    try {
      if (floorplan.url && propertyId) {
        // Delete from property_media table
        const { error: dbError } = await supabase
          .from('property_media')
          .delete()
          .eq('property_id', propertyId)
          .eq('url', floorplan.url)
          .eq('media_type', 'floorplan');

        if (dbError) throw dbError;

        // Delete from storage
        const fileName = floorplan.url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('property-photos')
            .remove([`${propertyId}/floorplans/${fileName}`]);
        }
      }

      const updatedFloorplans = floorplans.filter(fp => fp.id !== floorplanId);
      setFloorplans(updatedFloorplans);
      updateFormData('floorplans', updatedFloorplans);

      toast({
        title: "Floorplan Removed",
        description: "Floorplan has been successfully removed.",
      });

    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to remove floorplan.",
        variant: "destructive",
      });
    }
  };

  const updateFloorplanTitle = (floorplanId: string, title: string) => {
    const updatedFloorplans = floorplans.map(fp => 
      fp.id === floorplanId ? { ...fp, title } : fp
    );
    setFloorplans(updatedFloorplans);
    updateFormData('floorplans', updatedFloorplans);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Images & Media</h2>
        <p className="text-muted-foreground">Upload photos and media files for your property</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUploader 
            propertyId={propertyId}
            photos={formData.photos || []}
            onPhotosChange={(photos) => updateFormData('photos', photos)}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Upload up to 20 high-quality photos of your property. The first photo will be used as the main image.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Floorplans
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <Label htmlFor="floorplan-upload" className="cursor-pointer">
              <span className="text-sm font-medium">Drop floorplan images here or click to browse</span>
              <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, PDF files</p>
            </Label>
            <Input
              id="floorplan-upload"
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => e.target.files && handleFloorplanUpload(e.target.files)}
            />
          </div>

          {/* Floorplan List */}
          {floorplans.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Uploaded Floorplans</h4>
              {floorplans.map((floorplan) => (
                <div key={floorplan.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileImage className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <Input
                      value={floorplan.title}
                      onChange={(e) => updateFloorplanTitle(floorplan.id, e.target.value)}
                      placeholder="Floorplan title"
                      className="text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {floorplan.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(floorplan.url, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFloorplan(floorplan.id)}
                      disabled={floorplan.uploading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {floorplan.uploading && (
                    <div className="text-xs text-muted-foreground">Uploading...</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Upload floor plans, layout diagrams, or architectural drawings to help guests visualize your property.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Virtual Tour & Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Virtual tour and video upload functionality coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}