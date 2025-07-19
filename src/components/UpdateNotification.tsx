import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, RefreshCw, Download } from 'lucide-react';
import { useVersionCheck } from '@/services/versionService';
import { useAuth } from '@/components/AuthProvider';

export const UpdateNotification: React.FC = () => {
  const { user } = useAuth();
  const { hasUpdate, newVersion, refreshApp, dismissUpdate } = useVersionCheck();

  // Only show for authenticated users
  if (!user || !hasUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className="border-primary bg-primary/5 shadow-lg">
        <Download className="h-4 w-4" />
        <AlertDescription className="pr-8">
          <div className="space-y-2">
            <div className="font-medium">New version available!</div>
            <div className="text-sm text-muted-foreground">
              Version {newVersion} is ready with the latest features and improvements.
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={refreshApp}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Update Now
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={dismissUpdate}
                className="h-8"
              >
                Later
              </Button>
            </div>
          </div>
        </AlertDescription>
        <Button
          variant="ghost"
          size="sm"
          onClick={dismissUpdate}
          className="absolute top-2 right-2 h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </Alert>
    </div>
  );
};