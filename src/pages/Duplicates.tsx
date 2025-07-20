import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Search, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Duplicates = () => {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Duplikat-Erkennung</h1>
        <p className="text-muted-foreground">
          Erkenne und verwalte doppelte Immobilien-Einträge automatisch
        </p>
      </div>

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
            <p className="text-muted-foreground mb-4">
              Intelligente Erkennung von doppelten Immobilien-Einträgen basierend auf Adresse, Bildern und Eigenschaften.
            </p>
            <Button variant="outline" disabled>
              <Search className="h-4 w-4 mr-2" />
              Scan starten (Bald verfügbar)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Duplicates;