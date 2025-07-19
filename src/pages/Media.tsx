import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Images, Upload, Grid, Folder, FileImage, Video, Download } from "lucide-react";

const Media = () => {
  const mediaStats = [
    { title: "Total Images", value: "1,247", icon: FileImage, change: "+45 this week" },
    { title: "Storage Used", value: "2.8 GB", icon: Folder, change: "of 10 GB plan" },
    { title: "Videos", value: "23", icon: Video, change: "+3 this month" },
    { title: "Properties with Media", value: "12", icon: Grid, change: "100% coverage" }
  ];

  const recentUploads = [
    { name: "apartment_bedroom_1.jpg", property: "Modern Apartment Berlin", size: "2.4 MB", uploaded: "2 hours ago" },
    { name: "kitchen_view.jpg", property: "Cozy Studio Munich", size: "1.8 MB", uploaded: "5 hours ago" },
    { name: "balcony_sunset.jpg", property: "Penthouse Hamburg", size: "3.2 MB", uploaded: "1 day ago" },
    { name: "living_room_wide.jpg", property: "Family House Dresden", size: "2.1 MB", uploaded: "2 days ago" }
  ];

  const mediaLibrary = [
    { folder: "Berlin Apartments", count: 156, lastModified: "2 hours ago" },
    { folder: "Munich Studios", count: 89, lastModified: "1 day ago" },
    { folder: "Hamburg Properties", count: 234, lastModified: "3 days ago" },
    { folder: "Dresden Houses", count: 67, lastModified: "1 week ago" }
  ];

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Images className="h-8 w-8 text-primary" />
            <h1 className="text-display text-foreground">Media Library</h1>
          </div>
          <p className="text-muted-foreground">
            Manage photos, videos, and other media files for your properties.
          </p>
        </div>
        <Button className="flex items-center space-x-2" size="lg">
          <Upload className="h-5 w-5" />
          <span>Upload Media</span>
        </Button>
      </div>

      {/* Media Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {mediaStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Media Library Folders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Folder className="h-5 w-5" />
              <span>Media Folders</span>
            </CardTitle>
            <CardDescription>Organized by property location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mediaLibrary.map((folder, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center space-x-3">
                    <Folder className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{folder.folder}</p>
                      <p className="text-sm text-muted-foreground">{folder.count} files</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{folder.lastModified}</p>
                    <Button variant="ghost" size="sm">
                      Open
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Uploads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Recent Uploads</span>
            </CardTitle>
            <CardDescription>Latest media files added to your library</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUploads.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileImage className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.property}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{file.size}</p>
                    <p className="text-xs text-muted-foreground">{file.uploaded}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common media management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="flex items-center space-x-2 h-auto p-4">
              <Upload className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Bulk Upload</p>
                <p className="text-xs text-muted-foreground">Upload multiple files</p>
              </div>
            </Button>
            
            <Button variant="outline" className="flex items-center space-x-2 h-auto p-4">
              <Grid className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Organize</p>
                <p className="text-xs text-muted-foreground">Sort and categorize</p>
              </div>
            </Button>
            
            <Button variant="outline" className="flex items-center space-x-2 h-auto p-4">
              <Download className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Download All</p>
                <p className="text-xs text-muted-foreground">Backup media files</p>
              </div>
            </Button>
            
            <Button variant="outline" className="flex items-center space-x-2 h-auto p-4">
              <Images className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Gallery View</p>
                <p className="text-xs text-muted-foreground">Browse visually</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Media;