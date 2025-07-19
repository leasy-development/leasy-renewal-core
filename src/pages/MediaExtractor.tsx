import { MediaURLExtractor } from '@/components/MediaURLExtractor';
import MediaProcessor from '@/components/MediaProcessor';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MediaExtractor() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Media Management Center</h1>
          <p className="text-muted-foreground mt-2">
            Auto-fetch media from CSV uploads, process existing properties, and manage media files across your portfolio.
          </p>
        </div>
        
        <Tabs defaultValue="processor" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="processor">Media Processor</TabsTrigger>
            <TabsTrigger value="extractor">URL Extractor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="processor" className="mt-6">
            <MediaProcessor />
          </TabsContent>
          
          <TabsContent value="extractor" className="mt-6">
            <MediaURLExtractor />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}