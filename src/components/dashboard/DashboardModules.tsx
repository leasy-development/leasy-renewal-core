import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Home, 
  Plus, 
  Upload, 
  Brain, 
  Images, 
  Copy, 
  TrendingUp, 
  Settings,
  Bot,
  Wand2,
  Languages,
  Camera,
  FileText,
  Eye,
  Zap,
  Search,
  Users,
  Shield,
  Database,
  Cpu,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  status?: 'new' | 'beta' | 'premium';
  progress?: number;
  tooltip: string;
  category: 'primary' | 'ai' | 'media' | 'admin';
  onClick?: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ 
  title, 
  description, 
  icon, 
  href, 
  status, 
  progress, 
  tooltip, 
  category,
  onClick 
}) => {
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'ai':
        return 'border-blue-200 hover:border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50';
      case 'media':
        return 'border-purple-200 hover:border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50';
      case 'admin':
        return 'border-orange-200 hover:border-orange-400 bg-gradient-to-br from-orange-50 to-red-50';
      default:
        return 'border-border hover:border-primary/40 bg-gradient-to-br from-muted/50 to-background';
    }
  };

  const cardContent = (
    <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${getCategoryStyle(category)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {icon}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {title}
                {status && (
                  <Badge variant={status === 'new' ? 'default' : 'secondary'} className="text-xs">
                    {status}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            </div>
          </div>
        </div>
        {progress !== undefined && (
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{progress}% vollständig</p>
          </div>
        )}
      </CardHeader>
    </Card>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {onClick ? (
          <div onClick={onClick}>
            {cardContent}
          </div>
        ) : (
          <Link to={href}>
            {cardContent}
          </Link>
        )}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};

interface DashboardModulesProps {
  userRole?: 'user' | 'admin' | 'moderator';
  recentlyUsed?: string[];
}

export const DashboardModules: React.FC<DashboardModulesProps> = ({ 
  userRole = 'user',
  recentlyUsed = []
}) => {
  const propertyModules: ModuleCardProps[] = [
    {
      title: 'Neue Immobilie',
      description: 'Erstelle eine neue Immobilie und starte die Verwaltung',
      icon: <Plus className="h-5 w-5 text-primary" />,
      href: '/add-property',
      tooltip: 'Füge eine neue Immobilie hinzu und beginne mit der automatischen Optimierung und Synchronisation',
      category: 'primary'
    },
    {
      title: 'Meine Immobilien',
      description: 'Verwalte alle deine Immobilien-Einträge',
      icon: <Home className="h-5 w-5 text-primary" />,
      href: '/properties',
      tooltip: 'Übersicht aller deiner Immobilien mit Bearbeitungs- und Verwaltungsoptionen',
      category: 'primary'
    }
  ];

  const importModules: ModuleCardProps[] = [
    {
      title: 'CSV Import',
      description: 'Importiere Immobilien aus CSV-Dateien',
      icon: <Upload className="h-5 w-5 text-primary" />,
      href: '/import-csv',
      tooltip: 'Lade CSV-Dateien hoch und mappe automatisch Felder zu deinen Immobilien-Daten',
      category: 'primary'
    },
    {
      title: 'URL Extraktor',
      description: 'Extrahiere Medien von Immobilien-URLs',
      icon: <Search className="h-5 w-5 text-primary" />,
      href: '/media-extractor',
      tooltip: 'Gib Immobilien-URLs ein und extrahiere automatisch alle Bilder und Medien',
      category: 'media'
    }
  ];

  const aiModules: ModuleCardProps[] = [
    {
      title: 'AI Beschreibung',
      description: 'Generiere perfekte Exposé-Texte automatisch',
      icon: <FileText className="h-5 w-5 text-blue-600" />,
      href: '/ai-tools?tool=description',
      status: 'new',
      tooltip: 'KI erstellt automatisch ansprechende und SEO-optimierte Immobilienbeschreibungen basierend auf deinen Daten',
      category: 'ai'
    },
    {
      title: 'Smart Titel Generator',
      description: 'Erstelle ansprechende Immobilien-Titel',
      icon: <Wand2 className="h-5 w-5 text-blue-600" />,
      href: '/ai-tools?tool=title',
      tooltip: 'Generiere automatisch optimierte Titel die Aufmerksamkeit erzeugen und wichtige Keywords enthalten',
      category: 'ai'
    },
    {
      title: 'Bulk Optimizer',
      description: 'Optimiere mehrere Immobilien gleichzeitig',
      icon: <Zap className="h-5 w-5 text-blue-600" />,
      href: '/ai-optimization',
      status: 'beta',
      tooltip: 'Wähle mehrere Immobilien aus und lasse sie automatisch von der KI optimieren - Titel, Beschreibung, Meta-Tags',
      category: 'ai'
    },
    {
      title: 'Übersetzungs-Manager',
      description: 'Übersetze Immobilien in mehrere Sprachen',
      icon: <Languages className="h-5 w-5 text-blue-600" />,
      href: '/translations',
      tooltip: 'Automatische Übersetzung deiner Immobilien-Daten in verschiedene Sprachen für internationale Märkte',
      category: 'ai'
    },
    {
      title: 'AI Validator',
      description: 'Prüfe Datenqualität automatisch',
      icon: <Eye className="h-5 w-5 text-blue-600" />,
      href: '/ai-tools?tool=validator',
      tooltip: 'KI überprüft deine Immobilien-Daten auf Vollständigkeit, Plausibilität und Optimierungspotential',
      category: 'ai'
    }
  ];

  const mediaModules: ModuleCardProps[] = [
    {
      title: 'Medien-Bibliothek',
      description: 'Verwalte Bilder und Medien-Dateien',
      icon: <Images className="h-5 w-5 text-purple-600" />,
      href: '/media',
      tooltip: 'Zentrale Verwaltung aller Bilder, Videos und Dokumente mit automatischer Kategorisierung',
      category: 'media'
    },
    {
      title: 'Alt-Text Generator',
      description: 'Generiere automatisch Alt-Texte für Bilder',
      icon: <Camera className="h-5 w-5 text-purple-600" />,
      href: '/ai-tools?tool=alt-text',
      status: 'new',
      tooltip: 'KI analysiert deine Bilder und erstellt automatisch beschreibende Alt-Texte für bessere SEO',
      category: 'media'
    },
    {
      title: 'Bild-Kategorisierer',
      description: 'Sortiere Bilder automatisch nach Räumen',
      icon: <Bot className="h-5 w-5 text-purple-600" />,
      href: '/ai-tools?tool=categorizer',
      tooltip: 'Automatische Erkennung und Kategorisierung von Bildern (Schlafzimmer, Küche, Bad, etc.)',
      category: 'media'
    }
  ];

  const optimizationModules: ModuleCardProps[] = [
    {
      title: 'Duplikat-Erkennung',
      description: 'Erkenne und verwalte doppelte Einträge',
      icon: <Copy className="h-5 w-5 text-orange-600" />,
      href: '/duplicates',
      tooltip: 'Intelligente Erkennung von Duplikaten basierend auf Adresse, Bildern und Immobilien-Eigenschaften',
      category: 'primary'
    },
    {
      title: 'Analytics',
      description: 'Überwache Performance und Kennzahlen',
      icon: <TrendingUp className="h-5 w-5 text-green-600" />,
      href: '/analytics',
      tooltip: 'Detaillierte Analysen zu deinen Immobilien, Sync-Status und Optimierungsfortschritt',
      category: 'primary'
    }
  ];

  const adminModules: ModuleCardProps[] = [
    {
      title: 'User Management',
      description: 'Verwalte Benutzer und Berechtigungen',
      icon: <Users className="h-5 w-5 text-orange-600" />,
      href: '/admin/users',
      tooltip: 'Verwalte Benutzerkonten, weise Rollen zu und überwache Aktivitäten',
      category: 'admin'
    },
    {
      title: 'Duplikat-Verwaltung',
      description: 'Globale Duplikat-Erkennung und -Verwaltung',
      icon: <Shield className="h-5 w-5 text-orange-600" />,
      href: '/admin/duplicates',
      tooltip: 'Systemweite Duplikat-Erkennung mit Admin-Tools zur Lösung von Konflikten',
      category: 'admin'
    },
    {
      title: 'AI Einstellungen',
      description: 'Konfiguriere KI-Modelle und Prompts',
      icon: <Cpu className="h-5 w-5 text-orange-600" />,
      href: '/admin/ai-settings',
      tooltip: 'Verwalte KI-Prompts, Modell-Einstellungen und überwache KI-Performance',
      category: 'admin'
    },
    {
      title: 'System Monitoring',
      description: 'Überwache Systemgesundheit und Logs',
      icon: <Activity className="h-5 w-5 text-orange-600" />,
      href: '/admin/monitoring',
      tooltip: 'Echtzeit-Monitoring von API-Calls, Errors und Performance-Metriken',
      category: 'admin'
    },
    {
      title: 'Prompt-Verwaltung',
      description: 'Bearbeite und teste AI Prompts',
      icon: <Database className="h-5 w-5 text-orange-600" />,
      href: '/admin/prompts',
      tooltip: 'Erstelle, bearbeite und teste KI-Prompts für verschiedene Anwendungsfälle',
      category: 'admin'
    }
  ];

  const isRecentlyUsed = (href: string) => recentlyUsed.includes(href);

  const ModuleSection: React.FC<{
    title: string;
    modules: ModuleCardProps[];
    icon: React.ReactNode;
    showForRole?: boolean;
  }> = ({ title, modules, icon, showForRole = true }) => {
    if (!showForRole) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          {icon}
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module, index) => (
            <div key={index} className="relative">
              {isRecentlyUsed(module.href) && (
                <Badge className="absolute -top-2 -right-2 z-10 bg-green-500 text-white">
                  Zuletzt genutzt
                </Badge>
              )}
              <ModuleCard {...module} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <ModuleSection
        title="Immobilien-Verwaltung"
        modules={propertyModules}
        icon={<Home className="h-6 w-6 text-primary" />}
      />

      <ModuleSection
        title="Import & Datenerfassung"
        modules={importModules}
        icon={<Upload className="h-6 w-6 text-primary" />}
      />

      <ModuleSection
        title="🧠 AI-Assistent"
        modules={aiModules}
        icon={<Brain className="h-6 w-6 text-blue-600" />}
      />

      <ModuleSection
        title="🖼️ Medien & Floorplans"
        modules={mediaModules}
        icon={<Images className="h-6 w-6 text-purple-600" />}
      />

      <ModuleSection
        title="Optimierungen"
        modules={optimizationModules}
        icon={<TrendingUp className="h-6 w-6 text-green-600" />}
      />

      <ModuleSection
        title="🛠️ Admin-Bereich"
        modules={adminModules}
        icon={<Settings className="h-6 w-6 text-orange-600" />}
        showForRole={userRole === 'admin'}
      />
    </div>
  );
};