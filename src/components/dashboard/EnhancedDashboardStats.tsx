import React, { useState, useEffect } from 'react';
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Bot,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  Zap,
  Eye
} from 'lucide-react';

interface PropertyProgress {
  propertyId: string;
  title: string;
  completeness: number;
  missingFields: string[];
  aiOptimized: boolean;
  mediaCount: number;
  lastUpdated: string;
}

interface DashboardStatsProps {
  propertyStats: {
    total: number;
    active: number;
    draft: number;
    synced: number;
  };
  aiStats: {
    optimized: number;
    pending: number;
    generated: number;
  };
  syncStats: {
    successRate: number;
    lastSync: string;
    failures: number;
  };
  recentProgress: PropertyProgress[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  propertyStats,
  aiStats,
  syncStats,
  recentProgress
}) => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    description: string;
    color: 'primary' | 'success' | 'warning' | 'ai';
    trend?: 'up' | 'down' | 'stable';
  }> = ({ title, value, change, icon, description, color, trend }) => {
    const getColorClasses = () => {
      switch (color) {
        case 'success':
          return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-400';
        case 'warning':
          return 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400';
        case 'ai':
          return 'ai-card border-blue-200 hover:border-blue-400';
        default:
          return 'bg-gradient-card border-border hover:border-primary/40';
      }
    };

    return (
      <Card className={`hover-lift transition-all duration-300 ${getColorClasses()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-xl ${
              color === 'success' ? 'bg-green-100' :
              color === 'warning' ? 'bg-amber-100' :
              color === 'ai' ? 'bg-blue-100' :
              'bg-primary/10'
            }`}>
              {icon}
            </div>
            {trend && (
              <div className={`flex items-center space-x-1 text-sm ${
                trend === 'up' ? 'text-green-600' :
                trend === 'down' ? 'text-red-600' :
                'text-muted-foreground'
              }`}>
                {trend === 'up' && <TrendingUp className="h-4 w-4" />}
                {trend === 'down' && <TrendingDown className="h-4 w-4" />}
                {change && <span>{change > 0 ? '+' : ''}{change}%</span>}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold">{value}</CardTitle>
            <CardDescription className="text-sm">{title}</CardDescription>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </CardHeader>
      </Card>
    );
  };

  const PropertyProgressCard: React.FC<{ property: PropertyProgress }> = ({ property }) => (
    <Card className="hover-lift transition-all duration-300 bg-gradient-card border-border hover:border-primary/40">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-semibold line-clamp-2 mb-2">
              {property.title}
            </CardTitle>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Vollständigkeit</span>
                  <span className="font-medium">{property.completeness}%</span>
                </div>
                <Progress value={property.completeness} className="h-2" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {property.aiOptimized ? (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      <Zap className="h-3 w-3 mr-1" />
                      AI Optimiert
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <Bot className="h-3 w-3 mr-1" />
                      Nicht optimiert
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {property.mediaCount} Medien
                </div>
              </div>

              {property.missingFields.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Fehlende Felder:</p>
                  <div className="flex flex-wrap gap-1">
                    {property.missingFields.slice(0, 2).map((field, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                    {property.missingFields.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{property.missingFields.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <div className={`space-y-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Overview Stats */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Dashboard Übersicht</h2>
            <p className="text-muted-foreground">Aktuelle Kennzahlen und Performance-Metriken</p>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="h-3 w-3 mr-1" />
            Live-Daten
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Immobilien"
            value={propertyStats.total}
            change={8}
            icon={<Users className="h-5 w-5 text-primary" />}
            description={`${propertyStats.active} aktiv, ${propertyStats.draft} Entwürfe`}
            color="primary"
            trend="up"
          />
          
          <StatCard
            title="AI Optimierungen"
            value={aiStats.optimized}
            change={12}
            icon={<Bot className="h-5 w-5 text-blue-600" />}
            description={`${aiStats.generated} generiert, ${aiStats.pending} ausstehend`}
            color="ai"
            trend="up"
          />
          
          <StatCard
            title="Sync-Erfolg"
            value={`${syncStats.successRate}%`}
            change={2}
            icon={<CheckCircle className="h-5 w-5 text-green-600" />}
            description={`Letzte Sync: ${syncStats.lastSync}`}
            color="success"
            trend="up"
          />
          
          <StatCard
            title="Synchronisiert"
            value={propertyStats.synced}
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            description={`${propertyStats.total - propertyStats.synced} noch nicht synced`}
            color="success"
          />
        </div>
      </div>

      <Separator />

      {/* Recent Property Progress */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Immobilien-Fortschritt</h3>
            <p className="text-muted-foreground">Aktuelle Bearbeitungsstände deiner wichtigsten Immobilien</p>
          </div>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Alle anzeigen
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentProgress.map((property) => (
            <PropertyProgressCard key={property.propertyId} property={property} />
          ))}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover-lift bg-gradient-ai border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Bot className="h-5 w-5" />
              AI-Empfehlungen
            </CardTitle>
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Bulk-Optimierung verfügbar</p>
                  <p className="text-xs text-muted-foreground">{propertyStats.total - aiStats.optimized} Immobilien können optimiert werden</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Übersetzungen generieren</p>
                  <p className="text-xs text-muted-foreground">Erweitere deine Reichweite auf internationale Märkte</p>
                </div>
              </div>
            </CardContent>
          </CardHeader>
        </Card>

        <Card className="hover-lift bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="h-5 w-5" />
              Benötigt Aufmerksamkeit
            </CardTitle>
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{syncStats.failures} Sync-Fehler</p>
                  <p className="text-xs text-muted-foreground">Überprüfe die Verbindungseinstellungen</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Duplikate erkannt</p>
                  <p className="text-xs text-muted-foreground">Bereinige doppelte Einträge für bessere Performance</p>
                </div>
              </div>
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};