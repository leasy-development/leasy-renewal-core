import React, { useState, useEffect } from 'react';
import { useAuth } from "@/components/AuthProvider";
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Home, 
  Upload, 
  Brain, 
  Images, 
  Copy, 
  TrendingUp, 
  Settings,
  Clock,
  Search,
  Filter,
  Star,
  MoreHorizontal,
  Sparkles
} from 'lucide-react';

// Import the enhanced components
import { DashboardStats } from '@/components/dashboard/EnhancedDashboardStats';
import { DashboardModules } from '@/components/dashboard/DashboardModules';
import { QuickActions } from '@/components/dashboard/EnhancedQuickActions';

const OptimizedDashboard = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'moderator'>('user');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([
    '/ai-tools?tool=description',
    '/media',
    '/properties'
  ]);

  // Enhanced mock data with real-world scenarios
  const propertyStats = {
    total: 24,
    active: 19,
    draft: 5,
    synced: 16
  };

  const aiStats = {
    optimized: 14,
    pending: 3,
    generated: 47
  };

  const syncStats = {
    successRate: 96,
    lastSync: '15 min',
    failures: 1
  };

  const propertyProgress = [
    {
      propertyId: '1',
      title: 'Moderne 3-Zimmer Wohnung in Berlin Mitte',
      completeness: 92,
      missingFields: ['Meta-Beschreibung'],
      aiOptimized: true,
      mediaCount: 12,
      lastUpdated: '2024-01-20T10:30:00Z'
    },
    {
      propertyId: '2', 
      title: 'Gemütliches Studio in Prenzlauer Berg',
      completeness: 67,
      missingFields: ['AI-Beschreibung', 'Alt-Texte', 'Übersetzung'],
      aiOptimized: false,
      mediaCount: 6,
      lastUpdated: '2024-01-19T15:45:00Z'
    },
    {
      propertyId: '3',
      title: 'Luxuriöse Penthouse-Wohnung in Charlottenburg',
      completeness: 98,
      missingFields: [],
      aiOptimized: true,
      mediaCount: 18,
      lastUpdated: '2024-01-20T09:15:00Z'
    }
  ];

  useEffect(() => {
    // Enhanced role detection
    const checkUserRole = async () => {
      if (user?.email?.includes('admin') || user?.email?.includes('test')) {
        setUserRole('admin');
      }
    };
    checkUserRole();
  }, [user]);

  const TabSection: React.FC<{
    value: string;
    title: string;
    description: string;
    children: React.ReactNode;
    isEmpty?: boolean;
  }> = ({ value, title, description, children, isEmpty = false }) => (
    <TabsContent value={value} className="space-y-8 animate-in fade-in-0 duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          {title}
          {value === 'ai' && <Sparkles className="h-6 w-6 text-blue-600" />}
        </h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
          <div className="p-4 rounded-full bg-muted">
            <MoreHorizontal className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Noch keine Inhalte</h3>
            <p className="text-muted-foreground max-w-md">
              Dieser Bereich wird bald mit spezifischen Tools und Features für {title.toLowerCase()} gefüllt.
            </p>
          </div>
        </div>
      ) : (
        children
      )}
    </TabsContent>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
          {/* Enhanced Welcome Header */}
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Willkommen zurück, {user?.email?.split('@')[0]}! 👋
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  Ihr intelligentes Immobilien-Management-Dashboard mit KI-gestützten Tools für maximale Effizienz.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                  <Clock className="h-3 w-3 mr-1" />
                  Zuletzt aktiv: vor 2 min
                </Badge>
                {userRole === 'admin' && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 px-3 py-1">
                    <Settings className="h-3 w-3 mr-1" />
                    Super Admin
                  </Badge>
                )}
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Ready
                </Badge>
              </div>
            </div>

            {/* Enhanced Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-gradient-card rounded-xl border shadow-soft">
              <div className="flex items-center gap-3 flex-1">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Durchsuche alle Tools, Immobilien und Features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent text-base focus-visible:ring-0"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Star className="h-4 w-4 mr-2" />
                  Favoriten
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Enhanced Dashboard Stats */}
          <DashboardStats
            propertyStats={propertyStats}
            aiStats={aiStats}
            syncStats={syncStats}
            recentProgress={propertyProgress}
          />

          <Separator />

          {/* Enhanced Quick Actions */}
          <QuickActions />

          <Separator />

          {/* Enhanced Tabbed Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-flex h-12 p-1 bg-muted/30 rounded-lg">
              <TabsTrigger value="overview" className="flex items-center space-x-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Übersicht</span>
              </TabsTrigger>
              <TabsTrigger value="properties" className="flex items-center space-x-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Immobilien</span>
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center space-x-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Import</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center space-x-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">AI-Tools</span>
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center space-x-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Images className="h-4 w-4" />
                <span className="hidden sm:inline">Medien</span>
              </TabsTrigger>
              <TabsTrigger value="optimize" className="flex items-center space-x-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Optimierung</span>
              </TabsTrigger>
              {userRole === 'admin' && (
                <TabsTrigger value="admin" className="flex items-center space-x-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
              )}
            </TabsList>

            <div className="mt-8">
              <TabSection
                value="overview"
                title="Alle Module & Features"
                description="Vollständiger Zugriff auf alle verfügbaren Tools und KI-Features für professionelles Immobilien-Management."
              >
                <DashboardModules userRole={userRole} recentlyUsed={recentlyUsed} />
              </TabSection>

              <TabSection
                value="properties"
                title="Immobilien-Verwaltung"
                description="Verwalte, bearbeite und optimiere deine Immobilien-Portfolio mit intelligenten Tools."
              >
                <DashboardModules userRole={userRole} recentlyUsed={recentlyUsed} />
              </TabSection>

              <TabSection
                value="import"
                title="Import & Zuordnung" 
                description="Importiere Daten aus verschiedenen Quellen und nutze intelligente Feld-Zuordnung."
              >
                <DashboardModules userRole={userRole} recentlyUsed={recentlyUsed} />
              </TabSection>

              <TabSection
                value="ai"
                title="KI-Assistent"
                description="Nutze modernste KI-Technologie zur automatischen Optimierung deiner Immobilien-Daten."
              >
                <DashboardModules userRole={userRole} recentlyUsed={recentlyUsed} />
              </TabSection>

              <TabSection
                value="media"
                title="Medien & Floorplans"
                description="Intelligente Verwaltung und Kategorisierung aller Medien-Dateien mit KI-Unterstützung."
              >
                <DashboardModules userRole={userRole} recentlyUsed={recentlyUsed} />
              </TabSection>

              <TabSection
                value="optimize"
                title="Optimierungen"
                description="Analysiere und verbessere die Performance deiner Immobilien-Daten."
              >
                <DashboardModules userRole={userRole} recentlyUsed={recentlyUsed} />
              </TabSection>

              {userRole === 'admin' && (
                <TabSection
                  value="admin"
                  title="Admin-Bereich"
                  description="Erweiterte Administrative Tools für System-Management und Benutzer-Verwaltung."
                >
                  <DashboardModules userRole={userRole} recentlyUsed={recentlyUsed} />
                </TabSection>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default OptimizedDashboard;