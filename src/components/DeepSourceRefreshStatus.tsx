
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface RefreshStatusProps {
  isRefreshing: boolean;
  progress: number;
  message: string;
  lastUpdated?: Date;
  demoMode?: boolean;
}

export function DeepSourceRefreshStatus({ 
  isRefreshing, 
  progress, 
  message, 
  lastUpdated,
  demoMode = false 
}: RefreshStatusProps) {
  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-card border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isRefreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          ) : progress === 100 ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-orange-600" />
          )}
          <span className="text-sm font-medium">{message}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {demoMode && (
            <Badge variant="outline" className="text-amber-600 border-amber-200">
              Demo Mode
            </Badge>
          )}
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              {formatLastUpdated(lastUpdated)}
            </span>
          )}
        </div>
      </div>
      
      {isRefreshing && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
