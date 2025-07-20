import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Search, AlertTriangle, Loader2, Eye, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  detectGlobalDuplicates,
  saveDuplicateGroups,
  getPendingDuplicateGroups,
  type GlobalDuplicateGroup 
} from '@/services/globalDuplicateDetection';

const Duplicates = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [pendingGroups, setPendingGroups] = useState<GlobalDuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const { toast } = useToast();

  const loadPendingGroups = async () => {
    try {
      setIsLoading(true);
      const groups = await getPendingDuplicateGroups();
      setPendingGroups(groups);
    } catch (error) {
      console.error('Error loading pending groups:', error);
      toast({
        title: "Laden fehlgeschlagen",
        description: "Pending Duplikate konnten nicht geladen werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runDuplicateDetection = async () => {
    setIsScanning(true);
    setScanResults([]);
    
    try {
      toast({
        title: "Scan gestartet",
        description: "Duplikat-Erkennung läuft..."
      });

      const matches = await detectGlobalDuplicates();
      setScanResults(matches);
      
      if (matches.length === 0) {
        toast({
          title: "Keine Duplikate gefunden",
          description: "Es wurden keine neuen Duplikate erkannt."
        });
      } else {
        await saveDuplicateGroups(matches);
        toast({
          title: "Duplikate erkannt",
          description: `${matches.length} potentielle Duplikat-Gruppen gefunden.`
        });
        await loadPendingGroups();
      }

      // Add to scan history
      setScanHistory(prev => [
        {
          timestamp: new Date(),
          found: matches.length,
          status: 'completed'
        },
        ...prev.slice(0, 4) // Keep last 5 scans
      ]);
      
    } catch (error) {
      console.error('Error during duplicate detection:', error);
      toast({
        title: "Scan fehlgeschlagen",
        description: "Die Duplikat-Erkennung konnte nicht abgeschlossen werden.",
        variant: "destructive"
      });
      
      setScanHistory(prev => [
        {
          timestamp: new Date(),
          found: 0,
          status: 'failed'
        },
        ...prev.slice(0, 4)
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    loadPendingGroups();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Duplikat-Erkennung</h1>
        <p className="text-muted-foreground">
          Erkenne und verwalte doppelte Immobilien-Einträge automatisch
        </p>
      </div>

      <Tabs defaultValue="scanner" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Review
            {pendingGroups.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingGroups.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Scan-Historie</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Copy className="h-5 w-5" />
                <span>Duplikat-Scanner</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Duplikat-Erkennung</h3>
                <p className="text-muted-foreground mb-6">
                  Intelligente Erkennung von doppelten Immobilien-Einträgen basierend auf Adresse, Bildern und Eigenschaften.
                </p>
                
                <Button 
                  onClick={runDuplicateDetection} 
                  disabled={isScanning}
                  size="lg"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scan läuft...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Scan starten
                    </>
                  )}
                </Button>

                {scanResults.length > 0 && (
                  <Alert className="mt-6 text-left">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Scan abgeschlossen:</strong> {scanResults.length} potentielle Duplikat-Gruppen gefunden.
                      Wechsel zur "Pending Review" Tab um sie zu überprüfen.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : pendingGroups.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <Eye className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-medium">Keine Pending Duplikate</h3>
                  <p className="text-muted-foreground">
                    Momentan müssen keine Duplikat-Gruppen überprüft werden.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{pendingGroups.length} Duplikat-Gruppen</strong> benötigen Überprüfung. 
                  Gehe zum Admin-Bereich für detaillierte Verwaltung.
                </AlertDescription>
              </Alert>

              {pendingGroups.map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Duplikat-Gruppe #{group.id.slice(-8)}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {group.confidence_score}% Konfidenz
                        </Badge>
                        <Badge variant="outline">
                          {group.properties?.length || 0} Immobilien
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {group.properties?.slice(0, 2).map((property, index) => (
                        <div key={property.id} className="p-3 border rounded-lg">
                          <h4 className="font-medium text-sm mb-1">{property.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {property.street_number} {property.street_name}<br />
                            {property.zip_code} {property.city}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Erkannt am {new Date(group.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Scan-Historie</CardTitle>
            </CardHeader>
            <CardContent>
              {scanHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Noch keine Scans durchgeführt</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scanHistory.map((scan, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(scan.status)}
                        <div>
                          <p className="text-sm font-medium">
                            {scan.timestamp.toLocaleDateString()} um {scan.timestamp.toLocaleTimeString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {scan.found} Duplikate gefunden
                          </p>
                        </div>
                      </div>
                      <Badge variant={scan.status === 'completed' ? 'default' : 'destructive'}>
                        {scan.status === 'completed' ? 'Erfolgreich' : 'Fehlgeschlagen'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Duplicates;