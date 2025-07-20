import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  FileText, 
  Layout, 
  Maximize2, 
  Minimize2,
  Eye,
  Code
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FloorplanViewerProps {
  propertyId: string;
}

interface FloorplanData {
  id: string;
  file_url: string;
  parsed_rooms: any;
  parsed_dimensions: any;
  created_at: string;
}

interface RoomData {
  name: string;
  type: string;
  area?: number;
  dimensions?: {
    length?: number;
    width?: number;
    unit?: string;
  };
  features?: string[];
}

const FloorplanViewer: React.FC<FloorplanViewerProps> = ({ propertyId }) => {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Fetch floorplan data
  const { data: floorplans, isLoading } = useQuery({
    queryKey: ['floorplans', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floorplan_files')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FloorplanData[];
    }
  });

  const currentFloorplan = floorplans?.[0];

  // Parse room data
  const rooms: RoomData[] = React.useMemo(() => {
    if (!currentFloorplan?.parsed_rooms) return [];
    
    try {
      const roomsData = typeof currentFloorplan.parsed_rooms === 'string' 
        ? JSON.parse(currentFloorplan.parsed_rooms)
        : currentFloorplan.parsed_rooms;
      
      return Array.isArray(roomsData) ? roomsData : [];
    } catch {
      return [];
    }
  }, [currentFloorplan?.parsed_rooms]);

  // Parse dimensions data
  const dimensions = React.useMemo(() => {
    if (!currentFloorplan?.parsed_dimensions) return {};
    
    try {
      return typeof currentFloorplan.parsed_dimensions === 'string'
        ? JSON.parse(currentFloorplan.parsed_dimensions)
        : currentFloorplan.parsed_dimensions;
    } catch {
      return {};
    }
  }, [currentFloorplan?.parsed_dimensions]);

  // Handle room hover
  const handleRoomHover = (roomName: string | null) => {
    setSelectedRoom(roomName);
    // Here you could highlight the room on the floorplan
  };

  // Export JSON data
  const exportJSON = () => {
    if (!currentFloorplan) return;
    
    const exportData = {
      floorplan_id: currentFloorplan.id,
      property_id: propertyId,
      rooms,
      dimensions,
      created_at: currentFloorplan.created_at
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `floorplan-${propertyId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculate total area
  const totalArea = React.useMemo(() => {
    return rooms.reduce((sum, room) => sum + (room.area || 0), 0);
  }, [rooms]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Floorplan Viewer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentFloorplan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Floorplan Viewer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Layout className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No floorplan available for this property.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Layout className="w-5 h-5" />
              Floorplan Viewer
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRawData(!showRawData)}
              >
                <Code className="w-4 h-4 mr-2" />
                {showRawData ? 'Hide' : 'Show'} Raw Data
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportJSON}
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4 mr-2" />
                ) : (
                  <Maximize2 className="w-4 h-4 mr-2" />
                )}
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className={`grid gap-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-6 grid-cols-1 lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {/* Floorplan Image */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Interactive Floorplan</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative bg-muted aspect-[4/3] overflow-hidden">
              <img
                ref={imageRef}
                src={currentFloorplan.file_url}
                alt="Property floorplan"
                className="w-full h-full object-contain cursor-crosshair"
                onMouseMove={(e) => {
                  // Here you could implement room detection based on cursor position
                  // For now, we'll just show the selected room
                }}
              />
              
              {/* Room highlight overlay (placeholder) */}
              {selectedRoom && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge variant="default" className="animate-pulse">
                    {selectedRoom}
                  </Badge>
                </div>
              )}
              
              {/* Image controls */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button size="sm" variant="secondary" asChild>
                  <a 
                    href={currentFloorplan.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Data Table */}
        <Card className={isFullscreen ? 'lg:col-span-2' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Room Analysis</CardTitle>
              {totalArea > 0 && (
                <Badge variant="outline">
                  Total: {totalArea.toFixed(1)} m²
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead>Features</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room, index) => (
                    <TableRow 
                      key={index}
                      className={`cursor-pointer transition-colors ${
                        selectedRoom === room.name ? 'bg-muted' : 'hover:bg-muted/50'
                      }`}
                      onMouseEnter={() => handleRoomHover(room.name)}
                      onMouseLeave={() => handleRoomHover(null)}
                    >
                      <TableCell className="font-medium">
                        {room.name || `Room ${index + 1}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {room.type || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {room.area ? `${room.area} m²` : '-'}
                      </TableCell>
                      <TableCell>
                        {room.dimensions ? (
                          <span className="text-sm">
                            {room.dimensions.length && room.dimensions.width
                              ? `${room.dimensions.length}×${room.dimensions.width}${room.dimensions.unit || 'm'}`
                              : '-'
                            }
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {room.features && room.features.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {room.features.slice(0, 2).map((feature, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {room.features.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{room.features.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {rooms.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No room data available. Upload a floorplan to see analysis.
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Raw Data View */}
      {showRawData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Raw OCR Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Parsed Rooms</h4>
                <ScrollArea className="h-64">
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(currentFloorplan.parsed_rooms, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Parsed Dimensions</h4>
                <ScrollArea className="h-64">
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(currentFloorplan.parsed_dimensions, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FloorplanViewer;