import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ImportCSV = () => {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">CSV Import</h1>
        <p className="text-muted-foreground">
          Importiere deine Immobilien aus CSV-Dateien mit intelligenter Feld-Zuordnung
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>CSV Import Tool</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">CSV Import Feature</h3>
            <p className="text-muted-foreground mb-4">
              Diese Funktion wird in Kürze verfügbar sein. Sie ermöglicht den Import von Immobilien-Daten aus CSV-Dateien.
            </p>
            <Button variant="outline" disabled>
              <Upload className="h-4 w-4 mr-2" />
              Bald verfügbar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportCSV;