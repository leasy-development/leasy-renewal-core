
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDevTools } from '@/lib/devtools';
import { performanceMonitor } from '@/lib/performance';
import { logger } from '@/lib/logger';
import config from '@/lib/config';
import { X, Activity, Database, FileText, Settings } from 'lucide-react';

export const DevToolsPanel: React.FC = () => {
  const { isOpen, activeTab, toggle, setActiveTab } = useDevTools();
  const [performanceMetrics, setPerformanceMetrics] = useState(performanceMonitor.getMetrics());
  const [cacheStats, setCacheStats] = useState(performanceMonitor.getCacheStats());

  const refreshMetrics = () => {
    setPerformanceMetrics(performanceMonitor.getMetrics());
    setCacheStats(performanceMonitor.getCacheStats());
  };

  if (!config.features.enableDebugTools || !isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-background border border-border rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">Dev Tools</h3>
        <Button variant="ghost" size="sm" onClick={toggle}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance" className="text-xs">
            <Activity className="h-3 w-3 mr-1" />
            Perf
          </TabsTrigger>
          <TabsTrigger value="cache" className="text-xs">
            <Database className="h-3 w-3 mr-1" />
            Cache
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="config" className="text-xs">
            <Settings className="h-3 w-3 mr-1" />
            Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="p-3 h-80">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Performance Metrics</span>
              <Button variant="outline" size="sm" onClick={refreshMetrics}>
                Refresh
              </Button>
            </div>
            
            <ScrollArea className="h-64">
              {performanceMetrics.length === 0 ? (
                <p className="text-xs text-muted-foreground">No metrics recorded</p>
              ) : (
                performanceMetrics.slice(-10).map((metric, index) => (
                  <div key={index} className="p-2 border-b border-border last:border-b-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Load Time</span>
                      <Badge variant="secondary" className="text-xs">
                        {metric.loadTime.toFixed(2)}ms
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="cache" className="p-3 h-80">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Cache Statistics</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  performanceMonitor.clearCache();
                  refreshMetrics();
                }}
              >
                Clear
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Card>
                <CardContent className="p-2">
                  <div className="text-xs text-muted-foreground">Cache Size</div>
                  <div className="text-lg font-bold">{cacheStats.size}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2">
                  <div className="text-xs text-muted-foreground">Keys</div>
                  <div className="text-lg font-bold">{cacheStats.keys.length}</div>
                </CardContent>
              </Card>
            </div>

            <ScrollArea className="h-40">
              {cacheStats.keys.map((key, index) => (
                <div key={index} className="p-1 text-xs border-b border-border last:border-b-0">
                  {key}
                </div>
              ))}
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="p-3 h-80">
          <div className="space-y-2">
            <span className="text-xs font-medium">Recent Logs</span>
            <ScrollArea className="h-64">
              <div className="text-xs text-muted-foreground">
                Check console for detailed logs
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="config" className="p-3 h-80">
          <ScrollArea className="h-64">
            <div className="space-y-2">
              <div className="text-xs">
                <div className="font-medium">Environment</div>
                <Badge variant="outline">{config.app.environment}</Badge>
              </div>
              
              <div className="text-xs">
                <div className="font-medium">Version</div>
                <Badge variant="outline">{config.app.version}</Badge>
              </div>
              
              <div className="text-xs">
                <div className="font-medium">Debug Mode</div>
                <Badge variant={config.app.debug ? "default" : "secondary"}>
                  {config.app.debug ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="text-xs">
                <div className="font-medium">Performance Monitoring</div>
                <Badge variant={config.performance.enableMetrics ? "default" : "secondary"}>
                  {config.performance.enableMetrics ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
