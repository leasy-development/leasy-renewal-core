import { MediaURLExtractor } from '@/components/MediaURLExtractor';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function MediaExtractor() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Media URL Extractor</h1>
          <p className="text-muted-foreground mt-2">
            Extract and download image URLs from your existing property descriptions and convert them to proper media files.
          </p>
        </div>
        
        <MediaURLExtractor />
      </div>
    </DashboardLayout>
  );
}