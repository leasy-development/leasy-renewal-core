import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, BarChart3 } from "lucide-react";

const Sync = () => {
  const syncPlatforms = [
    { name: "ImmoScout24", status: "connected", lastSync: "2 hours ago", properties: 8 },
    { name: "Immowelt", status: "connected", lastSync: "1 day ago", properties: 5 },
    { name: "eBay Kleinanzeigen", status: "error", lastSync: "3 days ago", properties: 0 },
    { name: "Airbnb", status: "pending", lastSync: "Never", properties: 0 },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-display text-foreground mb-2">Platform Sync</h1>
          <p className="text-muted-foreground">
            Manage synchronization with rental platforms and track sync status.
          </p>
        </div>
        <Button className="flex items-center space-x-2" size="lg">
          <RefreshCw className="h-5 w-5" />
          <span>Sync All</span>
        </Button>
      </div>

      {/* Sync Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Platforms</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">2 connected, 1 error, 1 pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Synced Properties</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">13</div>
            <p className="text-xs text-muted-foreground">Across all platforms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Syncs</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {syncPlatforms.map((platform) => (
          <Card key={platform.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  {getStatusIcon(platform.status)}
                  <span>{platform.name}</span>
                </CardTitle>
                {getStatusBadge(platform.status)}
              </div>
              <CardDescription>
                Last sync: {platform.lastSync} • {platform.properties} properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
                <Button variant="ghost" size="sm">
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Sync Activity</CardTitle>
          <CardDescription>Latest synchronization events across all platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div className="text-sm">
                <p className="font-medium">ImmoScout24 sync completed successfully</p>
                <p className="text-muted-foreground">8 properties updated • 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <XCircle className="h-4 w-4 text-red-500" />
              <div className="text-sm">
                <p className="font-medium">eBay Kleinanzeigen sync failed</p>
                <p className="text-muted-foreground">Authentication error • 3 days ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div className="text-sm">
                <p className="font-medium">Immowelt sync completed</p>
                <p className="text-muted-foreground">5 properties updated • 1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sync;