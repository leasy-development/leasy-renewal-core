import React, { useState, useEffect } from 'react';
import { useAuth } from "@/components/AuthProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardModules } from '@/components/dashboard/DashboardModules';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Separator } from '@/components/ui/separator';
import { 
  Home, 
  Upload, 
  Brain, 
  Images, 
  Copy, 
  TrendingUp, 
  Settings,
  Clock
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'moderator'>('user');
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([
    '/ai-tools?tool=description',
    '/media',
    '/properties'
  ]);

  // Mock data - in real app, fetch from API
  const propertyStats = {
    total: 15,
    active: 12,
    draft: 3,
    synced: 8
  };

  const aiStats = {
    optimized: 9,
    pending: 2,
    generated: 24
  };

  const syncStats = {
    successRate: 94,
    lastSync: '2 Stunden',
    failures: 1
  };

  const propertyProgress = [
    {
      propertyId: '1',
      title: 'Moderne 3-Zimmer Wohnung in Mitte',
      completeness: 85,
      missingFields: ['Meta-Beschreibung', 'Alt-Texte'],
      aiOptimized: true
    },
    {
      propertyId: '2', 
      title: 'Gemütliches Studio in Prenzlauer Berg',
      completeness: 60,
      missingFields: ['AI-Beschreibung', 'Kategorisierung', 'Übersetzung'],
      aiOptimized: false
    },
    {
      propertyId: '3',
      title: 'Luxuriöse 4-Zimmer Wohnung in Charlottenburg',
      completeness: 95,
      missingFields: ['Floorplan'],
      aiOptimized: true
    }
  ];

  useEffect(() => {
    // Check user role - in real app, fetch from auth context or API
    const checkUserRole = async () => {
      // Mock admin check
      if (user?.email?.includes('admin')) {
        setUserRole('admin');
      }
    };
    checkUserRole();
  }, [user]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Willkommen zurück, {user?.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-muted-foreground">
              Hier ist dein Leasy-Dashboard mit allen Tools und Funktionen für optimales Immobilien-Management.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Clock className="h-3 w-3 mr-1" />
              Zuletzt aktiv: vor 5 min
            </Badge>
            {userRole === 'admin' && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                <Settings className="h-3 w-3 mr-1" />
                Super Admin
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Dashboard Stats */}
      <DashboardStats
        propertyStats={propertyStats}
        aiStats={aiStats}
        syncStats={syncStats}
        recentProgress={propertyProgress}
      />

      <Separator />

      {/* Quick Actions */}
      <QuickActions />

      <Separator />

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Übersicht</span>
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center space-x-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Immobilien</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">AI-Tools</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center space-x-2">
            <Images className="h-4 w-4" />
            <span className="hidden sm:inline">Medien</span>
          </TabsTrigger>
          <TabsTrigger value="optimize" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Optimierung</span>
          </TabsTrigger>
          {userRole === 'admin' && (
            <TabsTrigger value="admin" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
          )}
        </TabsList>

        <div className="mt-8">
          <TabsContent value="overview" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Alle Module & Features</h2>
              <p className="text-muted-foreground mb-6">
                Zugriff auf alle verfügbaren Tools und KI-Features für dein Immobilien-Management.
              </p>
              <DashboardModules userRole={userRole} recentlyUsed={recentlyUsed} />
            </div>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <DashboardModules userRole={userRole} recentlyUsed={recentlyUsed} />
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <DashboardModules userRole={userRole} recentlyUsed={recentlyUsed} />
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <DashboardModules userRole={userRole} recentlyUsed={recentlyUsed} />
          </TabsContent>

          <TabsContent value="media" className="space-y-6">
            <DashboardModules userRole={userRole} recentlyUsed={recentlyUsed} />
          </TabsContent>

          <TabsContent value="optimize" className="space-y-6">
            <DashboardModules userRole={userRole} recentlyUsed={recentlyUsed} />
          </TabsContent>

          {userRole === 'admin' && (
            <TabsContent value="admin" className="space-y-6">
              <DashboardModules userRole={userRole} recentlyUsed={recentlyUsed} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default Dashboard;