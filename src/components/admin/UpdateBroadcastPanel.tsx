import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Radio, Clock, User, Calendar } from 'lucide-react';
import { 
  broadcastUpdateNotification, 
  getLastUpdateInfo,
  type UpdateNotificationPayload 
} from '@/services/updateNotificationService';

export const UpdateBroadcastPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Neue App-Version verfügbar - Verbesserungen und Bugfixes');
  const [delay, setDelay] = useState(5);
  const [version, setVersion] = useState('');
  const [lastUpdate, setLastUpdate] = useState<UpdateNotificationPayload | null>(null);
  const { toast } = useToast();

  const loadLastUpdateInfo = async () => {
    try {
      const info = await getLastUpdateInfo();
      setLastUpdate(info);
    } catch (error) {
      console.error('Error loading last update info:', error);
    }
  };

  useEffect(() => {
    loadLastUpdateInfo();
  }, []);

  const handleBroadcast = async () => {
    if (!message.trim()) {
      toast({
        title: "Nachricht erforderlich",
        description: "Bitte gib eine Nachricht für die Benutzer ein.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await broadcastUpdateNotification(message, delay, version || undefined);
      
      toast({
        title: "✅ Update-Benachrichtigung gesendet",
        description: `Alle eingeloggten Benutzer werden in ${delay} Sekunden automatisch aktualisiert.`
      });

      // Reload last update info
      await loadLastUpdateInfo();
      
      // Clear form
      setMessage('Neue App-Version verfügbar - Verbesserungen und Bugfixes');
      setVersion('');
      
    } catch (error) {
      console.error('Error broadcasting update:', error);
      toast({
        title: "Broadcast fehlgeschlagen",
        description: "Die Update-Benachrichtigung konnte nicht gesendet werden.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Update-Benachrichtigung senden
          </CardTitle>
          <CardDescription>
            Benachrichtige alle eingeloggten Benutzer über ein App-Update und löse eine automatische Seitenaktualisierung aus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="message">Nachricht für Benutzer</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="z.B. Neue Features verfügbar..."
                rows={3}
              />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delay">Verzögerung (Sekunden)</Label>
                <Input
                  id="delay"
                  type="number"
                  min="1"
                  max="60"
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Zeit bis zur automatischen Aktualisierung
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="version">Versionsnummer (optional)</Label>
                <Input
                  id="version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="z.B. v1.2.3"
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleBroadcast} 
            disabled={isLoading || !message.trim()}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sende Benachrichtigung...
              </>
            ) : (
              <>
                <Radio className="h-4 w-4 mr-2" />
                Update-Benachrichtigung senden
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {lastUpdate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Letzte Update-Benachrichtigung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="outline">Gesendet</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Zeitpunkt:</span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(lastUpdate.timestamp).toLocaleString('de-DE')}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ausgelöst von:</span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {lastUpdate.triggered_by}
                </div>
              </div>
              
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium">Nachricht:</span>
                <span className="text-sm text-muted-foreground max-w-xs text-right">
                  {lastUpdate.message}
                </span>
              </div>
              
              {lastUpdate.version && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Version:</span>
                  <Badge variant="secondary">{lastUpdate.version}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};