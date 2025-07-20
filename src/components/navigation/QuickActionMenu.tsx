import React, { useState } from 'react';
import { 
  Plus, 
  Brain, 
  Upload, 
  FileText, 
  Search, 
  Command,
  Zap,
  Camera,
  Copy,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  keywords: string[];
  shortcut?: string;
  category: 'create' | 'ai' | 'tools' | 'navigation' | 'help';
  badge?: string;
  isNew?: boolean;
}

interface QuickActionMenuProps {
  className?: string;
}

export function QuickActionMenu({ className }: QuickActionMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    // Create Actions
    {
      id: 'add-property',
      title: 'Neue Immobilie',
      description: 'Erstelle eine neue Immobilie',
      icon: Plus,
      action: () => navigate('/add-property'),
      keywords: ['neue', 'immobilie', 'hinzufügen', 'erstellen', 'property'],
      shortcut: '⌘N',
      category: 'create'
    },
    {
      id: 'csv-import',
      title: 'CSV Import',
      description: 'Importiere Immobilien aus CSV-Datei',
      icon: FileText,
      action: () => navigate('/import-csv'),
      keywords: ['csv', 'import', 'bulk', 'massenimport', 'datei'],
      shortcut: '⌘I',
      category: 'create'
    },
    {
      id: 'media-upload',
      title: 'Medien hochladen',
      description: 'Bilder und Videos hinzufügen',
      icon: Upload,
      action: () => navigate('/media?action=upload'),
      keywords: ['medien', 'bilder', 'upload', 'hochladen', 'fotos'],
      category: 'create'
    },

    // AI Actions
    {
      id: 'ai-description',
      title: 'AI Beschreibung',
      description: 'Generiere automatische Beschreibungen',
      icon: Brain,
      action: () => navigate('/ai-tools?tool=description'),
      keywords: ['ai', 'beschreibung', 'text', 'generieren', 'automatisch'],
      shortcut: '⌘D',
      category: 'ai',
      badge: '⚡',
      isNew: true
    },
    {
      id: 'ai-optimize',
      title: 'Bulk Optimizer',
      description: 'Optimiere mehrere Immobilien mit AI',
      icon: Zap,
      action: () => navigate('/ai-optimization'),
      keywords: ['ai', 'optimization', 'bulk', 'massenoptimierung', 'verbessern'],
      category: 'ai',
      badge: 'Neu',
      isNew: true
    },
    {
      id: 'ai-title',
      title: 'AI Titel Generator',
      description: 'Automatische Titel-Generierung',
      icon: Brain,
      action: () => navigate('/ai-tools?tool=title'),
      keywords: ['ai', 'titel', 'headline', 'generieren'],
      category: 'ai'
    },

    // Tools
    {
      id: 'duplicate-check',
      title: 'Duplikat-Check',
      description: 'Prüfe auf doppelte Einträge',
      icon: Copy,
      action: () => navigate('/duplicates'),
      keywords: ['duplikat', 'doppelt', 'prüfen', 'check'],
      category: 'tools'
    },
    {
      id: 'media-intelligence',
      title: 'Media Intelligence',
      description: 'Automatische Bildkategorisierung',
      icon: Camera,
      action: () => navigate('/media?view=categories'),
      keywords: ['media', 'bilder', 'kategorisierung', 'ai', 'intelligent'],
      category: 'tools'
    },
    {
      id: 'url-extractor',
      title: 'URL Extraktor',
      description: 'Extrahiere Medien von URLs',
      icon: Upload,
      action: () => navigate('/media-extractor'),
      keywords: ['url', 'extractor', 'medien', 'download'],
      category: 'tools'
    },

    // Navigation
    {
      id: 'properties',
      title: 'Immobilien-Übersicht',
      description: 'Alle deine Immobilien anzeigen',
      icon: Plus,
      action: () => navigate('/properties'),
      keywords: ['immobilien', 'overview', 'liste', 'übersicht'],
      category: 'navigation'
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'Leistungskennzahlen und Berichte',
      icon: Plus,
      action: () => navigate('/analytics'),
      keywords: ['analytics', 'berichte', 'statistiken', 'kennzahlen'],
      category: 'navigation'
    },
    {
      id: 'account',
      title: 'Konto-Einstellungen',
      description: 'Persönliche Einstellungen verwalten',
      icon: Settings,
      action: () => navigate('/account'),
      keywords: ['konto', 'einstellungen', 'profil', 'account'],
      category: 'navigation'
    },

    // Help
    {
      id: 'help',
      title: 'Hilfe & Support',
      description: 'Dokumentation und Support',
      icon: HelpCircle,
      action: () => window.open('/help', '_blank'),
      keywords: ['hilfe', 'help', 'support', 'dokumentation', 'fragen'],
      category: 'help'
    }
  ];

  // Keyboard shortcut handler
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const categoryLabels = {
    create: 'Erstellen',
    ai: 'AI-Tools',
    tools: 'Tools',
    navigation: 'Navigation',
    help: 'Hilfe'
  };

  const categoryIcons = {
    create: Plus,
    ai: Brain,
    tools: Settings,
    navigation: Search,
    help: HelpCircle
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={cn(
          "relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2",
          className
        )}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Quick Actions...</span>
        <span className="sr-only">Quick Actions öffnen</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Suche nach Aktionen..." />
        <CommandList>
          <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
          
          {Object.entries(categoryLabels).map(([category, label]) => {
            const categoryActions = quickActions.filter(action => action.category === category);
            if (categoryActions.length === 0) return null;

            const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons];

            return (
              <React.Fragment key={category}>
                <CommandGroup heading={
                  <div className="flex items-center space-x-2">
                    <CategoryIcon className="h-4 w-4" />
                    <span>{label}</span>
                  </div>
                }>
                  {categoryActions.map((action) => (
                    <CommandItem
                      key={action.id}
                      value={`${action.title} ${action.description} ${action.keywords.join(' ')}`}
                      onSelect={() => {
                        setOpen(false);
                        action.action();
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3">
                          <action.icon className="h-4 w-4" />
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{action.title}</span>
                              {action.badge && (
                                <Badge 
                                  variant={action.isNew ? "default" : "secondary"}
                                  className={cn(
                                    "text-xs px-1.5 py-0.5",
                                    action.isNew && "bg-green-500 text-white",
                                    action.badge === "⚡" && "bg-yellow-500 text-black"
                                  )}
                                >
                                  {action.badge}
                                </Badge>
                              )}
                              {action.isNew && !action.badge && (
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {action.description}
                            </span>
                          </div>
                        </div>
                        {action.shortcut && (
                          <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 flex">
                            {action.shortcut}
                          </kbd>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </React.Fragment>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}

// Floating Action Button for mobile
export function FloatingQuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const primaryActions = [
    {
      title: 'Neue Immobilie',
      icon: Plus,
      action: () => navigate('/add-property'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'AI Beschreibung',
      icon: Brain,
      action: () => navigate('/ai-tools?tool=description'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Media Upload',
      icon: Upload,
      action: () => navigate('/media?action=upload'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'CSV Import',
      icon: FileText,
      action: () => navigate('/import-csv'),
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      <div className="relative">
        {/* Action Buttons */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 space-y-3">
            {primaryActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-full shadow-lg",
                    action.color
                  )}
                  onClick={() => {
                    action.action();
                    setIsOpen(false);
                  }}
                >
                  <action.icon className="h-5 w-5" />
                  <span className="sr-only">{action.title}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Main Button */}
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          onClick={() => setIsOpen(!isOpen)}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="h-6 w-6" />
          </motion.div>
          <span className="sr-only">Quick Actions</span>
        </Button>
      </div>
    </div>
  );
}