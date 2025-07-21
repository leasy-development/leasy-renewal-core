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
        return 'ai-card hover-lift border-ai-purple/20 hover:border-ai-purple/40 hover:shadow-ai transition-all duration-300';
      case 'media':
        return 'media-card hover-lift border-ai-purple/20 hover:border-ai-purple/40 hover:shadow-media transition-all duration-300';
      case 'admin':
        return 'admin-card hover-lift border-ai-orange/20 hover:border-ai-orange/40 transition-all duration-300';
      default:
        return 'hover-lift border-border hover:border-primary/40 bg-gradient-card transition-all duration-300';
    }
  };

  const cardContent = (
    <Card className={`cursor-pointer group h-full min-h-[180px] flex flex-col ${getCategoryStyle(category)}`}>
      <CardHeader className="p-4 relative overflow-hidden flex-1 flex flex-col">
        <div className="flex items-start justify-between flex-1">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 flex-shrink-0 ${
              category === 'ai' ? 'bg-ai-purple-bg hover:bg-ai-purple-bg/80' :
              category === 'media' ? 'bg-ai-purple-bg hover:bg-ai-purple-bg/80' :
              category === 'admin' ? 'bg-ai-orange-bg hover:bg-ai-orange-bg/80' :
              'bg-primary/10 group-hover:bg-primary/20'
            }`}>
              {React.cloneElement(icon as React.ReactElement, {
                className: `h-5 w-5 transition-colors duration-300 ${
                  category === 'ai' ? 'text-ai-purple group-hover:text-ai-purple/80' :
                  category === 'media' ? 'text-ai-purple group-hover:text-ai-purple/80' :
                  category === 'admin' ? 'text-ai-orange group-hover:text-ai-orange/80' :
                  'text-primary group-hover:text-primary/80'
                }`
              } as any)}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 group-hover:text-foreground/90 transition-colors duration-300 line-clamp-1">
                {title}
                {category === 'ai' && <span className="text-ai-purple flex-shrink-0">⚡</span>}
                {status && (
                  <Badge 
                    variant={status === 'new' ? 'default' : 'secondary'} 
                    className={`text-xs transition-all duration-300 flex-shrink-0 ${
                      status === 'new' ? 'bg-success/10 text-success hover:bg-success/20' :
                      'bg-warning/10 text-warning hover:bg-warning/20'
                    }`}
                  >
                    {status}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs group-hover:text-muted-foreground/80 transition-colors duration-300 line-clamp-3">
                {description}
              </CardDescription>
            </div>
          </div>
        </div>
        {progress !== undefined && (
          <div className="mt-auto pt-3 space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress}% vollständig</span>
              <span className="text-primary font-medium">{progress >= 80 ? '✓ Optimiert' : 'In Bearbeitung'}</span>
            </div>
          </div>
        )}
        
        {/* Decorative gradient overlay for hover effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />
      </CardHeader>
    </Card>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {onClick ? (
          <div onClick={onClick} className="relative">
            {cardContent}
          </div>
        ) : (
          <Link to={href} className="relative block">
            {cardContent}
          </Link>
        )}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs bg-background/95 backdrop-blur-sm border shadow-lg">
        <div className="p-2">
          <p className="font-medium text-sm mb-1">{title}</p>
          <p className="text-xs text-muted-foreground">{tooltip}</p>
           {category === 'ai' && (
             <div className="flex items-center gap-1 mt-2 text-xs text-ai-purple">
               <span>⚡</span>
               <span>KI-gestützt</span>
             </div>
           )}
        </div>
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
      icon: <FileText className="h-5 w-5 text-ai-purple" />,
      href: '/ai-tools?tool=description',
      status: 'new',
      tooltip: 'KI erstellt automatisch ansprechende und SEO-optimierte Immobilienbeschreibungen basierend auf deinen Daten',
      category: 'ai'
    },
    {
      title: 'Smart Titel Generator',
      description: 'Erstelle ansprechende Immobilien-Titel',
      icon: <Wand2 className="h-5 w-5 text-ai-purple" />,
      href: '/ai-tools?tool=title',
      tooltip: 'Generiere automatisch optimierte Titel die Aufmerksamkeit erzeugen und wichtige Keywords enthalten',
      category: 'ai'
    },
    {
      title: 'Bulk Optimizer',
      description: 'Optimiere mehrere Immobilien gleichzeitig',
      icon: <Zap className="h-5 w-5 text-ai-purple" />,
      href: '/ai-optimization',
      status: 'beta',
      tooltip: 'Wähle mehrere Immobilien aus und lasse sie automatisch von der KI optimieren - Titel, Beschreibung, Meta-Tags',
      category: 'ai'
    },
    {
      title: 'Übersetzungs-Manager',
      description: 'Übersetze Immobilien in mehrere Sprachen',
      icon: <Languages className="h-5 w-5 text-ai-purple" />,
      href: '/translations',
      tooltip: 'Automatische Übersetzung deiner Immobilien-Daten in verschiedene Sprachen für internationale Märkte',
      category: 'ai'
    },
    {
      title: 'AI Validator',
      description: 'Prüfe Datenqualität automatisch',
      icon: <Eye className="h-5 w-5 text-ai-purple" />,
      href: '/ai-tools?tool=validator',
      tooltip: 'KI überprüft deine Immobilien-Daten auf Vollständigkeit, Plausibilität und Optimierungspotential',
      category: 'ai'
    }
  ];

  const mediaModules: ModuleCardProps[] = [
    {
      title: 'Medien-Bibliothek',
      description: 'Verwalte Bilder und Medien-Dateien',
      icon: <Images className="h-5 w-5 text-ai-purple" />,
      href: '/media',
      tooltip: 'Zentrale Verwaltung aller Bilder, Videos und Dokumente mit automatischer Kategorisierung',
      category: 'media'
    },
    {
      title: 'Alt-Text Generator',
      description: 'Generiere automatisch Alt-Texte für Bilder',
      icon: <Camera className="h-5 w-5 text-ai-purple" />,
      href: '/ai-tools?tool=alt-text',
      status: 'new',
      tooltip: 'KI analysiert deine Bilder und erstellt automatisch beschreibende Alt-Texte für bessere SEO',
      category: 'media'
    },
    {
      title: 'Bild-Kategorisierer',
      description: 'Sortiere Bilder automatisch nach Räumen',
      icon: <Bot className="h-5 w-5 text-ai-purple" />,
      href: '/ai-tools?tool=categorizer',
      tooltip: 'Automatische Erkennung und Kategorisierung von Bildern (Schlafzimmer, Küche, Bad, etc.)',
      category: 'media'
    }
  ];

  const optimizationModules: ModuleCardProps[] = [
    {
      title: 'Duplikat-Erkennung',
      description: 'Erkenne und verwalte doppelte Einträge',
      icon: <Copy className="h-5 w-5 text-foreground" />,
      href: '/duplicates',
      tooltip: 'Intelligente Erkennung von Duplikaten basierend auf Adresse, Bildern und Immobilien-Eigenschaften',
      category: 'primary'
    },
    {
      title: 'Analytics',
      description: 'Überwache Performance und Kennzahlen',
      icon: <TrendingUp className="h-5 w-5 text-success" />,
      href: '/analytics',
      tooltip: 'Detaillierte Analysen zu deinen Immobilien, Sync-Status und Optimierungsfortschritt',
      category: 'primary'
    }
  ];

  const adminModules: ModuleCardProps[] = [
    {
      title: 'User Management',
      description: 'Verwalte Benutzer und Berechtigungen',
      icon: <Users className="h-5 w-5 text-ai-orange" />,
      href: '/admin/users',
      tooltip: 'Verwalte Benutzerkonten, weise Rollen zu und überwache Aktivitäten',
      category: 'admin'
    },
    {
      title: 'Duplikat-Verwaltung',
      description: 'Globale Duplikat-Erkennung und -Verwaltung',
      icon: <Shield className="h-5 w-5 text-ai-orange" />,
      href: '/admin/duplicates',
      tooltip: 'Systemweite Duplikat-Erkennung mit Admin-Tools zur Lösung von Konflikten',
      category: 'admin'
    },
    {
      title: 'AI Einstellungen',
      description: 'Konfiguriere KI-Modelle und Prompts',
      icon: <Cpu className="h-5 w-5 text-ai-orange" />,
      href: '/admin/ai-settings',
      tooltip: 'Verwalte KI-Prompts, Modell-Einstellungen und überwache KI-Performance',
      category: 'admin'
    },
    {
      title: 'System Monitoring',
      description: 'Überwache Systemgesundheit und Logs',
      icon: <Activity className="h-5 w-5 text-ai-orange" />,
      href: '/admin/monitoring',
      tooltip: 'Echtzeit-Monitoring von API-Calls, Errors und Performance-Metriken',
      category: 'admin'
    },
    {
      title: 'Prompt-Verwaltung',
      description: 'Bearbeite und teste AI Prompts',
      icon: <Database className="h-5 w-5 text-ai-orange" />,
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon}
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            {modules.length} {modules.length === 1 ? 'Tool' : 'Tools'}
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module, index) => (
            <div key={index} className="relative group h-full min-h-[180px]">
              {isRecentlyUsed(module.href) && (
                <Badge className="absolute -top-2 -right-2 z-20 bg-success text-success-foreground text-xs px-2 py-1 rounded-full shadow-lg animate-pulse">
                  <span className="mr-1">🕒</span>
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
        icon={<Brain className="h-6 w-6 text-ai-purple" />}
      />

      <ModuleSection
        title="🖼️ Medien & Floorplans"
        modules={mediaModules}
        icon={<Images className="h-6 w-6 text-ai-purple" />}
      />

      <ModuleSection
        title="Optimierungen"
        modules={optimizationModules}
        icon={<TrendingUp className="h-6 w-6 text-success" />}
      />

      <ModuleSection
        title="🛠️ Admin-Bereich"
        modules={adminModules}
        icon={<Settings className="h-6 w-6 text-ai-orange" />}
        showForRole={userRole === 'admin'}
      />
    </div>
  );
};