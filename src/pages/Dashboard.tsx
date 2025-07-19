import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Calendar, Settings, Home, Plus, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-display text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.email?.split('@')[0]}! Here's an overview of your property management activity.
        </p>
      </div>

      {/* Quick Stats */}
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
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link to="/add-property">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-primary/20 hover:border-primary/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Plus className="h-5 w-5 mr-2 text-primary" />
                Add New Property
              </CardTitle>
              <CardDescription>
                Create a new property listing to start managing and syncing
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/properties">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Home className="h-5 w-5 mr-2 text-primary" />
                Manage Properties
              </CardTitle>
              <CardDescription>
                View and edit all your property listings
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/analytics">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                View Analytics
              </CardTitle>
              <CardDescription>
                Track performance and insights
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/sync">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                Platform Sync
              </CardTitle>
              <CardDescription>
                Manage synchronization with rental platforms
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/ai-tools">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Settings className="h-5 w-5 mr-2 text-primary" />
                AI Tools
              </CardTitle>
              <CardDescription>
                Leverage AI to optimize your listings
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link to="/media">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-base">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Media Library
              </CardTitle>
              <CardDescription>
                Manage photos and media files
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your properties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="text-sm">
                <p className="font-medium">Property synced to ImmoScout24</p>
                <p className="text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="text-sm">
                <p className="font-medium">New property draft created</p>
                <p className="text-muted-foreground">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="text-sm">
                <p className="font-medium">Sync failed - Missing images</p>
                <p className="text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;