import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Images, Upload, Grid, Folder, FileImage, Video, Download, Search, 
  MoreVertical, Eye, Tag, Trash2, Move, ExternalLink, TrendingUp, 
  TrendingDown, Bot, CheckCircle, Plus, Lightbulb, Zap, Filter,
  BarChart3, Calendar, MapPin, Maximize2, Copy, FolderOpen
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const Media = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  // Real-time media stats query
  const { data: mediaStats, isLoading: statsLoading } = useQuery({
    queryKey: ['media-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get total media count and types
      const { data: allMedia, error: mediaError } = await supabase
        .from('property_media')
        .select(`
          id,
          media_type,
          created_at,
          property_id,
          properties!inner(user_id)
        `)
        .eq('properties.user_id', user.id);

      if (mediaError) throw mediaError;

      // Get properties count
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id')
        .eq('user_id', user.id);

      if (propError) throw propError;

      // Calculate stats
      const totalImages = allMedia?.filter(m => m.media_type === 'photo').length || 0;
      const totalFloorplans = allMedia?.filter(m => m.media_type === 'floorplan').length || 0;
      const totalVideos = allMedia?.filter(m => m.media_type === 'video').length || 0;
      const propertiesWithMedia = new Set(allMedia?.map(m => m.property_id)).size;
      const coveragePercent = properties?.length ? Math.round((propertiesWithMedia / properties.length) * 100) : 0;
      
      // Calculate storage (mock calculation)
      const totalFiles = allMedia?.length || 0;
      const estimatedStorage = (totalFiles * 2.5).toFixed(1); // Assume avg 2.5MB per file
      
      // Week over week change (mock)
      const thisWeekUploads = allMedia?.filter(m => {
        const uploadDate = new Date(m.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return uploadDate > weekAgo;
      }).length || 0;

      return {
        totalImages,
        totalFloorplans,
        totalVideos,
        estimatedStorage,
        propertiesWithMedia,
        totalProperties: properties?.length || 0,
        coveragePercent,
        thisWeekUploads,
        lastMonthVideos: totalVideos > 3 ? 3 : totalVideos
      };
    },
    enabled: !!user,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Real-time property folders query
  const { data: propertyFolders } = useQuery({
    queryKey: ['property-folders', user?.id, sortBy],
    queryFn: async () => {
      if (!user) return [];

      const { data: properties, error } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          city,
          updated_at,
          property_media(id, media_type, created_at)
        `)
        .eq('user_id', user.id)
        .order(sortBy === 'recent' ? 'updated_at' : 'title', { ascending: sortBy !== 'recent' });

      if (error) throw error;

      return properties?.map(property => ({
        id: property.id,
        name: property.title,
        city: property.city || 'Unknown',
        totalFiles: property.property_media?.length || 0,
        photos: property.property_media?.filter(m => m.media_type === 'photo').length || 0,
        floorplans: property.property_media?.filter(m => m.media_type === 'floorplan').length || 0,
        lastModified: property.updated_at,
        thumbnail: property.property_media?.[0] ? 'photo' : null
      })) || [];
    },
    enabled: !!user
  });

  // Recent uploads query
  const { data: recentUploads } = useQuery({
    queryKey: ['recent-uploads', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: media, error } = await supabase
        .from('property_media')
        .select(`
          id,
          url,
          title,
          media_type,
          created_at,
          properties!inner(title, user_id)
        `)
        .eq('properties.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return media?.map(item => ({
        id: item.id,
        name: item.title || 'Untitled',
        property: item.properties.title,
        type: item.media_type,
        uploaded: new Date(item.created_at).toLocaleDateString(),
        url: item.url
      })) || [];
    },
    enabled: !!user
  });

  // Smart insights
  const getSmartInsights = () => {
    if (!mediaStats || !propertyFolders) return [];

    const insights = [];
    
    // Missing media check
    const propertiesWithoutMedia = mediaStats.totalProperties - mediaStats.propertiesWithMedia;
    if (propertiesWithoutMedia > 0) {
      insights.push({
        type: 'warning',
        message: `${propertiesWithoutMedia} properties are missing photos`,
        action: 'Add Photos',
        icon: Upload
      });
    }

    // Low coverage check
    if (mediaStats.coveragePercent < 100) {
      insights.push({
        type: 'info',
        message: `${mediaStats.coveragePercent}% media coverage. Aim for 100%!`,
        action: 'Complete Coverage',
        icon: CheckCircle
      });
    }

    // Floorplan suggestion
    if (mediaStats.totalFloorplans < mediaStats.totalProperties * 0.5) {
      insights.push({
        type: 'suggestion',
        message: 'Consider adding floorplans to improve property listings',
        action: 'Add Floorplans',
        icon: Grid
      });
    }

    return insights;
  };

  const insights = getSmartInsights();

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleBulkAction = (action: string) => {
    toast({
      title: "Bulk Action",
      description: `${action} action applied to ${selectedFiles.length} files`,
    });
    setSelectedFiles([]);
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 lg:px-8 py-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Images className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Smart Media Library</h1>
            </div>
            <p className="text-muted-foreground">
              AI-powered media management for your property portfolio
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedFiles.length > 0 && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{selectedFiles.length} selected</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction("Move")}>
                      <Move className="h-4 w-4 mr-2" />
                      Move to Folder
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("Tag")}>
                      <Tag className="h-4 w-4 mr-2" />
                      Add Tags
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("Delete")}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Files
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction("Download")}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            <Button className="flex items-center space-x-2" size="lg">
              <Upload className="h-5 w-5" />
              <span>Upload Media</span>
            </Button>
          </div>
        </div>

        {/* Real-time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="hover-scale cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Images</CardTitle>
                  <FileImage className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mediaStats?.totalImages || 0}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    +{mediaStats?.thisWeekUploads || 0} this week
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total number of property photos uploaded</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="hover-scale cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                  <Folder className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mediaStats?.estimatedStorage || 0} GB</div>
                  <div className="flex items-center space-x-2">
                    <Progress value={((parseFloat(mediaStats?.estimatedStorage || '0')) / 10) * 100} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground">of 10 GB</span>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Storage usage across all media files</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="hover-scale cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Floorplans</CardTitle>
                  <Grid className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mediaStats?.totalFloorplans || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {mediaStats?.totalFloorplans === 0 ? 'Upload your first floorplan' : 'Architectural layouts'}
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Property floorplans and layouts</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="hover-scale cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Media Coverage</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mediaStats?.coveragePercent || 0}%</div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{mediaStats?.propertiesWithMedia || 0} of {mediaStats?.totalProperties || 0} properties</span>
                    <Progress value={mediaStats?.coveragePercent || 0} className="w-16 h-2" />
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Percentage of properties with media files</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Smart Assistant */}
        {insights.length > 0 && (
          <Card className="mb-8 border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-blue-500" />
                <span>Smart Media Assistant</span>
              </CardTitle>
              <CardDescription>AI-powered insights and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <Alert key={index} className={`border-l-4 ${
                    insight.type === 'warning' ? 'border-l-orange-500' : 
                    insight.type === 'info' ? 'border-l-blue-500' : 'border-l-green-500'
                  }`}>
                    <insight.icon className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>{insight.message}</span>
                      <Button variant="outline" size="sm">
                        {insight.action}
                      </Button>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Media</TabsTrigger>
              <TabsTrigger value="folders">Property Folders</TabsTrigger>
              <TabsTrigger value="floorplans">Floorplans</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search media files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy('recent')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Most Recent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('title')}>
                    <Grid className="h-4 w-4 mr-2" />
                    Alphabetical
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <TabsContent value="folders" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {propertyFolders?.map((folder) => (
                <Card key={folder.id} className="hover-scale cursor-pointer transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <FolderOpen className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">{folder.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {folder.city}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Gallery
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Property
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download All
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Files</span>
                        <Badge variant="secondary">{folder.totalFiles}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Photos</span>
                        <span>{folder.photos}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Floorplans</span>
                        <span>{folder.floorplans}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Updated {new Date(folder.lastModified).toLocaleDateString()}
                      </p>
                      <Button variant="ghost" size="sm" className="w-full mt-2">
                        Open Folder
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                  <div className="space-y-3">
                    {recentUploads?.map((file) => (
                      <div key={file.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          checked={selectedFiles.includes(file.id)}
                          onCheckedChange={() => toggleFileSelection(file.id)}
                        />
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded flex items-center justify-center">
                            {file.type === 'photo' && <FileImage className="h-4 w-4 text-white" />}
                            {file.type === 'floorplan' && <Grid className="h-4 w-4 text-white" />}
                            {file.type === 'video' && <Video className="h-4 w-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{file.property}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-muted-foreground">{file.uploaded}</p>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Full Screen
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Property
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Tag className="h-4 w-4 mr-2" />
                                Add Tags
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy URL
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                  <CardDescription>Power user tools and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="flex items-center space-x-2 h-auto p-4">
                      <Upload className="h-5 w-5" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Bulk Upload</p>
                        <p className="text-xs text-muted-foreground">Multiple files</p>
                      </div>
                    </Button>
                    
                    <Button variant="outline" className="flex items-center space-x-2 h-auto p-4">
                      <Grid className="h-5 w-5" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Auto-Organize</p>
                        <p className="text-xs text-muted-foreground">AI sorting</p>
                      </div>
                    </Button>
                    
                    <Button variant="outline" className="flex items-center space-x-2 h-auto p-4">
                      <Download className="h-5 w-5" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Export All</p>
                        <p className="text-xs text-muted-foreground">Backup files</p>
                      </div>
                    </Button>
                    
                    <Button variant="outline" className="flex items-center space-x-2 h-auto p-4">
                      <Maximize2 className="h-5 w-5" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Gallery View</p>
                        <p className="text-xs text-muted-foreground">Visual browse</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="floorplans" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Grid className="h-5 w-5" />
                  <span>Property Floorplans</span>
                </CardTitle>
                <CardDescription>Architectural layouts and property blueprints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Grid className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Floorplans Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Upload architectural drawings and layouts to help guests visualize your properties
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload First Floorplan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Upload Trends</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">This Week</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={75} className="w-20" />
                        <span className="text-sm font-medium">{mediaStats?.thisWeekUploads || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Week</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={45} className="w-20" />
                        <span className="text-sm font-medium">12</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">This Month</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={90} className="w-20" />
                        <span className="text-sm font-medium">87</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5" />
                    <span>Optimization Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">High-quality images boost bookings by 30%</p>
                        <p className="text-xs text-muted-foreground">Upload photos in 4K resolution</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Add floorplans for premium listings</p>
                        <p className="text-xs text-muted-foreground">Helps guests understand layout</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Consistent uploads maintain engagement</p>
                        <p className="text-xs text-muted-foreground">Add new photos monthly</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default Media;