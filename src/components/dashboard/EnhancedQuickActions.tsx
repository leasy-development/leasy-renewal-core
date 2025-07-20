import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Brain, 
  Zap, 
  Camera, 
  Copy, 
  TrendingUp, 
  Users,
  Upload,
  FileText,
  Languages,
  Bot,
  Shield,
  Activity,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { userPreferencesService } from '@/services/userPreferencesService';
import { useAuth } from '@/components/AuthProvider';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  category: 'primary' | 'ai' | 'media' | 'admin';
  isNew?: boolean;
  estimatedTime?: string;
}

export const QuickActions: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const trackUsage = async (actionId: string, actionName: string) => {
    if (user?.id) {
      setIsLoading(true);
      await userPreferencesService.trackFeatureUsage(
        user.id,
        actionId,
        actionName,
        actionId.includes('ai') ? 'ai' : 'property'
      );
      setIsLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'add-property',
      title: 'Neue Immobilie',
      description: 'Starte mit einer neuen Immobilie',
      icon: <Plus className="h-5 w-5 text-white" />,
      href: '/add-property',
      category: 'primary',
      estimatedTime: '5 min'
    },
    {
      id: 'ai-description',
      title: 'AI Beschreibung',
      description: 'Generiere perfekte Exposé-Texte',
      icon: <Brain className="h-5 w-5 text-white" />,
      href: '/ai-tools?tool=description',
      category: 'ai',
      isNew: true,
      estimatedTime: '2 min'
    },
    {
      id: 'bulk-optimizer',
      title: 'Bulk Optimizer',
      description: 'Optimiere mehrere Immobilien',
      icon: <Zap className="h-5 w-5 text-white" />,
      href: '/ai-optimization',
      category: 'ai',
      estimatedTime: '10 min'
    },
    {
      id: 'media-upload',
      title: 'Medien hochladen',
      description: 'Bilder & Videos verwalten',
      icon: <Camera className="h-5 w-5 text-white" />,
      href: '/media',
      category: 'media',
      estimatedTime: '3 min'
    },
    {
      id: 'duplicate-check',
      title: 'Duplikat-Check',
      description: 'Prüfe auf doppelte Einträge',
      icon: <Copy className="h-5 w-5 text-white" />,
      href: '/duplicates',
      category: 'primary',
      estimatedTime: '5 min'
    },
    {
      id: 'csv-import',
      title: 'CSV Import',
      description: 'Importiere aus Tabellen',
      icon: <Upload className="h-5 w-5 text-white" />,
      href: '/import-csv',
      category: 'primary',
      estimatedTime: '15 min'
    }
  ];

  const getActionStyle = (category: string) => {
    switch (category) {
      case 'ai':
        return 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-ai';
      case 'media':
        return 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-media';
      case 'admin':
        return 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700';
      default:
        return 'bg-gradient-primary hover:shadow-elegant';
    }
  };

  const ActionCard: React.FC<{ action: QuickAction }> = ({ action }) => (
    <Link 
      to={action.href}
      onClick={() => trackUsage(action.id, action.title)}
      className="group"
    >
      <Card className={`
        hover-lift cursor-pointer transition-all duration-300 
        ${getActionStyle(action.category)}
        border-0 text-white overflow-hidden relative
      `}>
        <CardHeader className="pb-3 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors duration-300">
                {action.icon}
              </div>
              <div className="flex-1">
                <CardTitle className="text-base text-white group-hover:text-white/90 transition-colors duration-300 flex items-center gap-2">
                  {action.title}
                  {action.isNew && (
                    <Badge className="bg-green-400 text-green-900 text-xs px-2 py-0.5">
                      Neu
                    </Badge>
                  )}
                  {action.category === 'ai' && <span className="text-yellow-300">⚡</span>}
                </CardTitle>
                <CardDescription className="text-white/80 text-sm group-hover:text-white/70 transition-colors duration-300">
                  {action.description}
                </CardDescription>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
          </div>
          
          {action.estimatedTime && (
            <div className="flex items-center gap-1 mt-2">
              <Clock className="h-3 w-3 text-white/60" />
              <span className="text-xs text-white/60">{action.estimatedTime}</span>
            </div>
          )}

          {/* Decorative overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </CardHeader>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Schnellzugriff</h2>
          <p className="text-muted-foreground">Die wichtigsten Aktionen für deinen Arbeitsablauf</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {quickActions.length} Aktionen verfügbar
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {quickActions.map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
      </div>

      {/* Recent Activity Hint */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-slate-600" />
            <CardTitle className="text-slate-900 text-lg">Produktivitäts-Tipp</CardTitle>
          </div>
          <CardContent className="p-0">
            <p className="text-slate-700 text-sm">
              Nutze <kbd className="px-2 py-1 bg-white rounded text-xs font-mono">Strg + K</kbd> um schnell zwischen Tools zu wechseln. 
              Häufig genutzte Features werden automatisch nach oben sortiert.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1">
                <Brain className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-slate-600">AI-Tools</span>
              </div>
              <div className="flex items-center gap-1">
                <Camera className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-slate-600">Medien</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-xs text-slate-600">Analytics</span>
              </div>
            </div>
          </CardContent>
        </CardHeader>
      </Card>
    </div>
  );
};