import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PhotoUploader from "@/components/PhotoUploader";

interface MediaSectionProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export function MediaSection({ formData, updateFormData }: MediaSectionProps) {
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