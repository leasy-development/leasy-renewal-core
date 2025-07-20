import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity,
  Zap,
  RefreshCw,
  Shield
} from 'lucide-react';
import { errorMonitoringService, DetectedError } from '@/services/errorMonitoringService';
import { toast } from 'sonner';

export function ErrorMonitoringDashboard() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [errorStatus, setErrorStatus] = useState({
    total: 0,
    fixed: 0,
    critical: 0,
    recent: [] as DetectedError[]
  });
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Check initial monitoring status
    setIsMonitoring(errorMonitoringService.isCurrentlyMonitoring());
    updateErrorStatus();

    // Update status every 10 seconds
    const interval = setInterval(updateErrorStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateErrorStatus = () => {
    const status = errorMonitoringService.getErrorStatus();
    setErrorStatus(status);
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      errorMonitoringService.stopMonitoring();
      setIsMonitoring(false);
      toast("Error Monitoring Stopped", {
        description: "Automatic error detection has been disabled."
      });
    } else {
      errorMonitoringService.startMonitoring();
      setIsMonitoring(true);
      toast("Error Monitoring Started", {
        description: "Now automatically detecting and fixing errors."
      });
    }
  };

  const runManualScan = async () => {
    setIsScanning(true);
    try {
      await errorMonitoringService.triggerManualScan();
      updateErrorStatus();
      toast("Manual Scan Completed", {
        description: "Error detection scan has been completed."
      });
    } catch (error) {
      toast("Scan Failed", {
        description: "Manual error scan could not be completed."
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Error Monitoring</h2>
          <p className="text-muted-foreground">
            Automatic error detection and fixing system
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={isMonitoring}
              onCheckedChange={toggleMonitoring}
              id="monitoring-toggle"
            />
            <label htmlFor="monitoring-toggle" className="text-sm font-medium">
              Auto-Monitor
            </label>
          </div>
          <Button
            onClick={runManualScan}
            disabled={isScanning}
            variant="outline"
            size="sm"
          >
            {isScanning ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Manual Scan
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorStatus.total}</div>
            <p className="text-xs text-muted-foreground">
              Detected in monitoring session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Fixed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{errorStatus.fixed}</div>
            <p className="text-xs text-muted-foreground">
              Automatically resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorStatus.critical}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitoring Status</CardTitle>
            <Activity className={`h-4 w-4 ${isMonitoring ? 'text-green-500' : 'text-gray-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isMonitoring ? 'Active' : 'Inactive'}
            </div>
            <p className="text-xs text-muted-foreground">
              {isMonitoring ? 'Monitoring every 30s' : 'Manual monitoring only'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
          <CardDescription>
            Latest errors detected in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorStatus.recent.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-green-600">No Recent Errors</p>
              <p className="text-muted-foreground">System is running smoothly</p>
            </div>
          ) : (
            <div className="space-y-4">
              {errorStatus.recent.map((error) => (
                <div
                  key={error.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg"
                >
                  <div className={`p-2 rounded-full ${getSeverityColor(error.severity)}`}>
                    {getSeverityIcon(error.severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {error.type}
                      </Badge>
                      <Badge 
                        variant={error.fixed ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {error.fixed ? 'Fixed' : 'Open'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm font-medium text-foreground mt-1">
                      {error.message}
                    </p>
                    
                    {error.fixApplied && (
                      <p className="text-xs text-green-600 mt-1">
                        🔧 {error.fixApplied}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>Source: {error.source}</span>
                      <span>
                        {new Date(error.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-Fix Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Fix Capabilities</CardTitle>
          <CardDescription>
            Types of errors that can be automatically resolved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Authentication Issues</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Session refresh failures</li>
                <li>• Token expiration</li>
                <li>• Login state inconsistencies</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Database Access</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• RLS policy violations</li>
                <li>• Connection issues</li>
                <li>• Permission errors</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">AI Services</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Queue processing failures</li>
                <li>• Generation timeouts</li>
                <li>• Service unavailability</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Network Issues</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Connection timeouts</li>
                <li>• Request failures</li>
                <li>• Edge function errors</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}