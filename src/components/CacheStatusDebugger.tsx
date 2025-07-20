import React, { useState, useEffect } from 'react';
import { cacheManager } from '@/lib/cacheManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Download,
  Bug
} from 'lucide-react';

interface CacheInfo {
  version: string;
  cacheNames: string[];
  serviceWorkers: number;
  storageUsed: number;
  errorReports: number;
  lastCleared: string | null;
}

export const CacheStatusDebugger: React.FC = () => {
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  const loadCacheInfo = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const info: CacheInfo = {
        version: document.querySelector('meta[name="app-version"]')?.getAttribute('content') || 'unknown',
        cacheNames: 'caches' in window ? await caches.keys() : [],
        serviceWorkers: 'serviceWorker' in navigator ? 
          (await navigator.serviceWorker.getRegistrations()).length : 0,
        storageUsed: await getStorageUsage(),
        errorReports: getErrorReportsCount(),
        lastCleared: localStorage.getItem('last-cache-clear')
      };
      
      setCacheInfo(info);
    } catch (error) {
      console.error('Failed to load cache info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStorageUsage = async (): Promise<number> => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  };

  const getErrorReportsCount = (): number => {
    try {
      const reports = JSON.parse(localStorage.getItem('error-reports') || '[]');
      return reports.length;
    } catch {
      return 0;
    }
  };

  const handleClearCache = async (): Promise<void> => {
    setIsLoading(true);
    setLastAction('Clearing cache...');
    
    try {
      await cacheManager.clearAllCaches();
      localStorage.setItem('last-cache-clear', new Date().toISOString());
      setLastAction('Cache cleared successfully');
      await loadCacheInfo();
    } catch (error) {
      setLastAction(`Failed to clear cache: ${error}`);
      console.error('Failed to clear cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadErrorReports = (): void => {
    try {
      const reports = JSON.parse(localStorage.getItem('error-reports') || '[]');
      const blob = new Blob([JSON.stringify(reports, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-reports-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setLastAction('Error reports downloaded');
    } catch (error) {
      setLastAction(`Failed to download reports: ${error}`);
      console.error('Failed to download error reports:', error);
    }
  };

  const clearErrorReports = (): void => {
    localStorage.removeItem('error-reports');
    setLastAction('Error reports cleared');
    loadCacheInfo();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    loadCacheInfo();
    
    // Refresh info every 30 seconds
    const interval = setInterval(loadCacheInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!cacheInfo) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          Loading cache information...
        </CardContent>
      </Card>
    );
  }

  const hasIssues = cacheInfo.cacheNames.length > 5 || 
                   cacheInfo.serviceWorkers > 1 || 
                   cacheInfo.errorReports > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {hasIssues ? (
                <AlertCircle className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              Cache Status
            </CardTitle>
            <CardDescription>
              Monitor and manage application cache
            </CardDescription>
          </div>
          <Button 
            onClick={loadCacheInfo} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">App Version:</span>
              <Badge variant="outline">{cacheInfo.version}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cache Stores:</span>
              <Badge variant={cacheInfo.cacheNames.length > 5 ? "destructive" : "secondary"}>
                {cacheInfo.cacheNames.length}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Service Workers:</span>
              <Badge variant={cacheInfo.serviceWorkers > 1 ? "destructive" : "secondary"}>
                {cacheInfo.serviceWorkers}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Storage Used:</span>
              <span className="text-sm">{formatBytes(cacheInfo.storageUsed)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Error Reports:</span>
              <Badge variant={cacheInfo.errorReports > 0 ? "destructive" : "secondary"}>
                {cacheInfo.errorReports}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Cleared:</span>
              <span className="text-xs text-muted-foreground">
                {formatDate(cacheInfo.lastCleared)}
              </span>
            </div>
          </div>
        </div>

        {cacheInfo.cacheNames.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Active Caches:</h4>
            <div className="flex flex-wrap gap-1">
              {cacheInfo.cacheNames.map(name => (
                <Badge key={name} variant="outline" className="text-xs">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button 
              onClick={handleClearCache}
              disabled={isLoading}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Caches
            </Button>
            
            {cacheInfo.errorReports > 0 && (
              <>
                <Button 
                  onClick={downloadErrorReports}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Reports
                </Button>
                
                <Button 
                  onClick={clearErrorReports}
                  variant="outline"
                  size="sm"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Clear Reports
                </Button>
              </>
            )}
          </div>
          
          {lastAction && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              {lastAction}
            </div>
          )}
        </div>

        {hasIssues && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <h4 className="text-sm font-medium text-destructive mb-1">Issues Detected:</h4>
            <ul className="text-xs text-destructive space-y-1">
              {cacheInfo.cacheNames.length > 5 && (
                <li>• Too many cache stores ({cacheInfo.cacheNames.length})</li>
              )}
              {cacheInfo.serviceWorkers > 1 && (
                <li>• Multiple service workers registered ({cacheInfo.serviceWorkers})</li>
              )}
              {cacheInfo.errorReports > 0 && (
                <li>• {cacheInfo.errorReports} error report(s) stored</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};