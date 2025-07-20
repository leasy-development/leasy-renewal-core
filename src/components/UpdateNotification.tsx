import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UpdateNotificationProps {
  isVisible: boolean;
  countdown: number;
  onCancel: () => void;
  onRefreshNow: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  isVisible,
  countdown,
  onCancel,
  onRefreshNow
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
      <Alert className="border-primary bg-primary/5">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium text-foreground mb-1">
              🔄 App-Update verfügbar
            </div>
            <div className="text-sm text-muted-foreground">
              Automatische Aktualisierung in{' '}
              <Badge variant="secondary" className="font-mono">
                {countdown}s
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              size="sm"
              onClick={onRefreshNow}
              className="h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Jetzt
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};