import { useState } from "react";
import { EnhancedPropertyList } from "@/components/EnhancedPropertyList";
import { BulkUploadModal } from "@/components/BulkUploadModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Home, BarChart3, Calendar, Settings, Upload } from "lucide-react";
import { Link } from "react-router-dom";

const Properties = () => {
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleBulkUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-display text-foreground mb-2">Properties</h1>
          <p className="text-muted-foreground">
            Manage all your properties and track their performance.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsBulkUploadOpen(true)}
            className="flex items-center space-x-2"
            size="lg"
          >
            <Upload className="h-5 w-5" />
            <span>Bulk Upload</span>
          </Button>
          <Link to="/add-property">
            <Button className="flex items-center space-x-2" size="lg">
              <Plus className="h-5 w-5" />
              <span>Add Property</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Listings</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+3 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Success Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Properties</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Property List */}
      <EnhancedPropertyList key={refreshTrigger} />

      {/* Bulk Upload Modal */}
      <BulkUploadModal 
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onSuccess={handleBulkUploadSuccess}
      />
    </div>
  );
};

export default Properties;