import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Search, AlertTriangle, Loader2, Eye, CheckCircle, Clock, AlertCircle, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  detectGlobalDuplicates,
  saveDuplicateGroups,
  getPendingDuplicateGroups,
  type GlobalDuplicateGroup 
} from '@/services/globalDuplicateDetection';
import {
  detectDuplicatesWithAI,
  saveAIDuplicateGroups,
  getAIDetectionStats,
  type AIDetectionResult
} from '@/services/aiDuplicateDetection';

const Duplicates = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isAIScanning, setIsAIScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [aiScanResults, setAIScanResults] = useState<AIDetectionResult[]>([]);
  const [pendingGroups, setPendingGroups] = useState<GlobalDuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [aiStats, setAIStats] = useState<any>(null);
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
        description: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
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

  const runAIDuplicateDetection = async () => {
    setIsAIScanning(true);
    setAIScanResults([]);
    setScanProgress(0);
    
    try {
      toast({
        title: "🧠 AI-Scan gestartet",
        description: "KI-gestützte Duplikatserkennung läuft..."
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setScanProgress(prev => Math.min(prev + 10, 90));
      }, 1000);

      const result = await detectDuplicatesWithAI();
      clearInterval(progressInterval);
      setScanProgress(100);
      
      setAIScanResults(result.matches);
      
      if (result.matches.length === 0) {
        toast({
          title: "🎯 Keine KI-Duplikate gefunden",
          description: "Die KI hat keine hochwahrscheinlichen Duplikate erkannt."
        });
      } else {
        await saveAIDuplicateGroups(result.matches);
        toast({
          title: "✨ KI-Duplikate erkannt",
          description: `${result.matches.length} KI-verifizierte Duplikat-Gruppen gefunden.`
        });
        await loadPendingGroups();
      }

      // Add to scan history with AI flag
      setScanHistory(prev => [
        {
          timestamp: new Date(),
          found: result.matches.length,
          status: 'completed',
          type: 'ai',
          analyzed: result.total_analyzed
        },
        ...prev.slice(0, 4)
      ]);
      
    } catch (error) {
      console.error('Error during AI duplicate detection:', error);
      toast({
        title: "🚫 KI-Scan fehlgeschlagen",
        description: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        variant: "destructive"
      });
      
      setScanHistory(prev => [
        {
          timestamp: new Date(),
          found: 0,
          status: 'failed',
          type: 'ai'
        },
        ...prev.slice(0, 4)
      ]);
    } finally {
      setIsAIScanning(false);
      setScanProgress(0);
    }
  };

  const loadAIStats = async () => {
    try {
      const stats = await getAIDetectionStats();
      setAIStats(stats);
    } catch (error) {
      console.error('Error loading AI stats:', error);
    }
  };

  useEffect(() => {
    loadPendingGroups();
    loadAIStats();
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
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Scanner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Standard-Scanner</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Regel-basierte Erkennung</h3>
                  <p className="text-muted-foreground mb-6 text-sm">
                    Klassische Duplikaterkennung basierend auf Adresse und Eigenschaften.
                  </p>
                  
                  <Button 
                    onClick={runDuplicateDetection} 
                    disabled={isScanning || isAIScanning}
                    variant="outline"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Scannt...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Standard-Scan
                      </>
                    )}
                  </Button>

                  {scanResults.length > 0 && (
                    <Alert className="mt-4 text-left">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>Standard-Scan:</strong> {scanResults.length} Gruppen gefunden.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Scanner */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>KI-Scanner</span>
                  <Badge variant="secondary" className="ml-2">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">KI-gestützte Analyse</h3>
                  <p className="text-muted-foreground mb-6 text-sm">
                    Intelligente semantische Analyse von Texten und erweiterte Duplikaterkennung.
                  </p>
                  
                  {isAIScanning && scanProgress > 0 && (
                    <div className="mb-4">
                      <Progress value={scanProgress} className="mb-2" />
                      <p className="text-xs text-muted-foreground">
                        KI analysiert Immobilien... {scanProgress}%
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={runAIDuplicateDetection} 
                    disabled={isScanning || isAIScanning}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isAIScanning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        KI analysiert...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        KI-Scan starten
                      </>
                    )}
                  </Button>

                  {aiScanResults.length > 0 && (
                    <Alert className="mt-4 text-left">
                      <Sparkles className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>KI-Scan:</strong> {aiScanResults.length} KI-verifizierte Gruppen gefunden.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Stats */}
          {aiStats && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>KI-Statistiken (Letzte 30 Tage)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{aiStats.total_ai_detections}</div>
                    <div className="text-xs text-muted-foreground">KI-Analysen</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{aiStats.high_confidence_matches}</div>
                    <div className="text-xs text-muted-foreground">Hohe Konfidenz</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{aiStats.avg_confidence}%</div>
                    <div className="text-xs text-muted-foreground">Ø Konfidenz</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{aiStats.recommendations.merge}</div>
                    <div className="text-xs text-muted-foreground">Merge-Empfehlungen</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {scan.timestamp.toLocaleDateString()} um {scan.timestamp.toLocaleTimeString()}
                            </p>
                            {scan.type === 'ai' && (
                              <Badge variant="secondary" className="text-xs">
                                <Brain className="h-3 w-3 mr-1" />
                                KI
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {scan.found} Duplikate gefunden
                            {scan.analyzed && ` • ${scan.analyzed} Immobilien analysiert`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={scan.status === 'completed' ? 'default' : 'destructive'}>
                          {scan.status === 'completed' ? 'Erfolgreich' : 'Fehlgeschlagen'}
                        </Badge>
                      </div>
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