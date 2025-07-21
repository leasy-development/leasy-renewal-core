import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  TrendingUp, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  Images
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  progress?: number;
  status?: 'success' | 'warning' | 'error' | 'info';
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  progress,
  status 
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-destructive';
      case 'info': return 'text-ai-purple';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-success';
      case 'down': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={getStatusColor(status)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className={`text-xs ${getTrendColor(trend.direction)} mt-1`}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.value}
          </p>
        )}
        {progress !== undefined && (
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{progress}% abgeschlossen</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface PropertyProgress {
  propertyId: string;
  title: string;
  completeness: number;
  missingFields: string[];
  aiOptimized: boolean;
}

interface DashboardStatsProps {
  propertyStats?: {
    total: number;
    active: number;
    draft: number;
    synced: number;
  };
  aiStats?: {
    optimized: number;
    pending: number;
    generated: number;
  };
  syncStats?: {
    successRate: number;
    lastSync: string;
    failures: number;
  };
  recentProgress?: PropertyProgress[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  propertyStats = { total: 0, active: 0, draft: 0, synced: 0 },
  aiStats = { optimized: 0, pending: 0, generated: 0 },
  syncStats = { successRate: 0, lastSync: 'Nie', failures: 0 },
  recentProgress = []
}) => {
  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Aktive Immobilien"
          value={propertyStats.active}
          subtitle={`${propertyStats.total} gesamt`}
          icon={<Home className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+2 diese Woche'
          }}
          status="success"
        />

        <StatCard
          title="AI-Optimierte"
          value={aiStats.optimized}
          subtitle={`${aiStats.pending} in Warteschlange`}
          icon={<Brain className="h-4 w-4" />}
          progress={Math.round((aiStats.optimized / Math.max(propertyStats.total, 1)) * 100)}
          status="info"
        />

        <StatCard
          title="Sync Erfolgsrate"
          value={`${syncStats.successRate}%`}
          subtitle={`Letzter Sync: ${syncStats.lastSync}`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{
            direction: syncStats.failures === 0 ? 'up' : 'down',
            value: `${syncStats.failures} Fehler`
          }}
          status={syncStats.successRate >= 90 ? 'success' : 'warning'}
        />

        <StatCard
          title="Entwürfe"
          value={propertyStats.draft}
          subtitle="Benötigen Aufmerksamkeit"
          icon={<AlertTriangle className="h-4 w-4" />}
          status={propertyStats.draft > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* AI Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="AI Generierungen heute"
          value={aiStats.generated}
          subtitle="Beschreibungen, Titel, Alt-Texte"
          icon={<Zap className="h-4 w-4" />}
          trend={{
            direction: 'up',
            value: '+15% vs. gestern'
          }}
          status="info"
        />

        <StatCard
          title="Medien verarbeitet"
          value="247"
          subtitle="Bilder kategorisiert und optimiert"
          icon={<Images className="h-4 w-4" />}
          status="success"
        />

        <StatCard
          title="Duplikate gefunden"
          value="3"
          subtitle="Benötigen Überprüfung"
          icon={<AlertTriangle className="h-4 w-4" />}
          status={3 > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Property Progress Tracker */}
      {recentProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Fortschritt Tracker</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProgress.slice(0, 5).map((property) => (
                <div key={property.propertyId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{property.title}</h4>
                      <div className="flex items-center space-x-2">
                        {property.aiOptimized && (
          <Badge variant="secondary" className="bg-ai-purple-bg text-ai-purple border-ai-purple/20">
            <Brain className="h-3 w-3 mr-1" />
            AI
          </Badge>
                        )}
                        <span className="text-sm font-medium">{property.completeness}%</span>
                      </div>
                    </div>
                    <Progress value={property.completeness} className="h-2 mb-2" />
                    {property.missingFields.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-xs text-muted-foreground">Fehlt:</span>
                        {property.missingFields.slice(0, 3).map((field, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                        {property.missingFields.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{property.missingFields.length - 3} mehr
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};