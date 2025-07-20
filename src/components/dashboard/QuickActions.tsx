import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Zap, 
  Brain, 
  Upload, 
  RefreshCw, 
  Search,
  Clock,
  Star,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  category: 'create' | 'ai' | 'optimize' | 'sync';
  isPrimary?: boolean;
  isNew?: boolean;
  estimatedTime?: string;
}

interface RecentActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'error';
  icon: React.ReactNode;
}

interface QuickActionsProps {
  recentActivities?: RecentActivity[];
  quickActions?: QuickAction[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  recentActivities = [],
  quickActions = []
}) => {
  const defaultQuickActions: QuickAction[] = [
    {
      id: 'add-property',
      title: 'Neue Immobilie',
      description: 'Schnell eine neue Immobilie hinzufügen',
      icon: <Plus className="h-4 w-4" />,
      href: '/add-property',
      category: 'create',
      isPrimary: true,
      estimatedTime: '5 min'
    },
    {
      id: 'ai-optimize',
      title: 'AI Bulk Optimizer',
      description: 'Mehrere Immobilien automatisch optimieren',
      icon: <Zap className="h-4 w-4" />,
      href: '/ai-optimization',
      category: 'ai',
      isNew: true,
      estimatedTime: '2 min'
    },
    {
      id: 'generate-description',
      title: 'AI Beschreibung',
      description: 'Perfekte Exposé-Texte generieren',
      icon: <Brain className="h-4 w-4" />,
      href: '/ai-tools?tool=description',
      category: 'ai',
      estimatedTime: '30 sek'
    },
    {
      id: 'csv-import',
      title: 'CSV Import',
      description: 'Immobilien aus Tabelle importieren',
      icon: <Upload className="h-4 w-4" />,
      href: '/import-csv',
      category: 'create',
      estimatedTime: '3 min'
    },
    {
      id: 'sync-properties',
      title: 'Sync starten',
      description: 'Alle Immobilien synchronisieren',
      icon: <RefreshCw className="h-4 w-4" />,
      href: '/sync',
      category: 'sync',
      estimatedTime: '1 min'
    },
    {
      id: 'find-duplicates',
      title: 'Duplikate finden',
      description: 'Doppelte Einträge automatisch erkennen',
      icon: <Search className="h-4 w-4" />,
      href: '/duplicates',
      category: 'optimize',
      estimatedTime: '2 min'
    }
  ];

  const defaultRecentActivities: RecentActivity[] = [
    {
      id: '1',
      action: 'AI Beschreibung generiert',
      description: 'Moderne 3-Zimmer Wohnung in Mitte',
      timestamp: '2 Stunden',
      status: 'success',
      icon: <Brain className="h-4 w-4 text-blue-600" />
    },
    {
      id: '2',
      action: 'Immobilie synchronisiert',
      description: 'ImmoScout24 & WG-Gesucht',
      timestamp: '5 Stunden',
      status: 'success',
      icon: <RefreshCw className="h-4 w-4 text-green-600" />
    },
    {
      id: '3',
      action: 'CSV Import',
      description: '12 neue Immobilien importiert',
      timestamp: '1 Tag',
      status: 'success',
      icon: <Upload className="h-4 w-4 text-purple-600" />
    },
    {
      id: '4',
      action: 'Duplikat erkannt',
      description: 'Ähnliche Immobilie gefunden',
      timestamp: '2 Tage',
      status: 'pending',
      icon: <Search className="h-4 w-4 text-orange-600" />
    }
  ];

  const actions = quickActions.length > 0 ? quickActions : defaultQuickActions;
  const activities = recentActivities.length > 0 ? recentActivities : defaultRecentActivities;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ai': return 'bg-blue-100 text-blue-800';
      case 'create': return 'bg-green-100 text-green-800';
      case 'optimize': return 'bg-purple-100 text-purple-800';
      case 'sync': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>Schnellaktionen</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {actions.map((action) => (
              <Link key={action.id} to={action.href}>
                <div className={`
                  p-3 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer
                  ${action.isPrimary ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}
                `}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${action.isPrimary ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {action.icon}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm">{action.title}</h4>
                          {action.isNew && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                              Neu
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                        {action.estimatedTime && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{action.estimatedTime}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <span>Letzte Aktivitäten</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id}>
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(activity.status)}`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {activity.icon}
                      <p className="text-sm font-medium truncate">{activity.action}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">vor {activity.timestamp}</p>
                  </div>
                </div>
                {index < activities.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Link to="/activity">
              <Button variant="outline" size="sm" className="w-full">
                Alle Aktivitäten anzeigen
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};