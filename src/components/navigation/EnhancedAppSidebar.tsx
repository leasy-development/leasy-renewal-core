import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Home, 
  BarChart3, 
  Settings, 
  Users, 
  Calendar, 
  Plus,
  RefreshCw,
  Bot,
  Images,
  LogOut,
  Shield,
  Download,
  Brain,
  MessageSquare,
  Building,
  Upload,
  Copy,
  Lightbulb,
  Search,
  FileText,
  Camera,
  Languages,
  Zap,
  Eye,
  UserCog,
  HelpCircle,
  Bell,
  Star,
  Layers,
  Filter,
  MapPin,
  TrendingUp,
  Activity,
  Archive,
  ChevronRight,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

// Navigation Types
interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  badge?: string;
  isNew?: boolean;
  disabled?: boolean;
  description?: string;
  shortcut?: string;
  subItems?: SubNavItem[];
}

interface SubNavItem {
  title: string;
  url: string;
  icon?: React.ComponentType<any>;
  badge?: string;
  isNew?: boolean;
  disabled?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
  description?: string;
}

// Enhanced Navigation Structure
const getNavigationSections = (t: any): NavSection[] => [
  {
    label: t('nav.dashboard'),
    description: "Main functions and dashboard",
    items: [
      { 
        title: t('nav.dashboard'), 
        url: "/dashboard", 
        icon: Home,
        description: "Central overview and statistics",
        shortcut: "⌘D"
      },
      { 
        title: "Immobilien", 
        url: "/properties", 
        icon: Building,
        description: "Verwalte deine Immobilienportfolio",
        shortcut: "⌘P",
        subItems: [
          { title: "Alle Immobilien", url: "/properties", icon: Building },
          { title: "Neue Immobilie", url: "/add-property", icon: Plus, isNew: true },
          { title: "Duplikate", url: "/duplicates", icon: Copy },
          { title: "Archiv", url: "/properties?filter=archived", icon: Archive }
        ]
      },
      { 
        title: "Analytics", 
        url: "/analytics", 
        icon: BarChart3,
        description: "Leistungskennzahlen und Berichte",
        badge: "Pro"
      },
    ]
  },
  {
    label: "AI-Powered Tools",
    description: "Künstliche Intelligenz für Immobilien",
    items: [
      { 
        title: "AI Assistent", 
        url: "/ai-tools", 
        icon: Brain,
        description: "Intelligente Textgenerierung und Optimierung",
        isNew: true,
        badge: "⚡",
        subItems: [
          { title: "Beschreibungen", url: "/ai-tools?tool=description", icon: FileText },
          { title: "Titel Generator", url: "/ai-tools?tool=title", icon: Lightbulb },
          { title: "SEO Optimierung", url: "/ai-tools?tool=seo", icon: TrendingUp, isNew: true },
          { title: "Übersetzungen", url: "/translations", icon: Languages }
        ]
      },
      { 
        title: "Bulk Optimizer", 
        url: "/ai-optimization", 
        icon: Zap,
        description: "Massenoptimierung mit KI",
        isNew: true,
        badge: "Neu"
      },
      { 
        title: "Media Intelligence", 
        url: "/media", 
        icon: Camera,
        description: "Automatische Bildkategorisierung und -optimierung",
        subItems: [
          { title: "Medien-Galerie", url: "/media", icon: Images },
          { title: "Bulk Upload", url: "/media?action=bulk", icon: Upload },
          { title: "URL Extraktor", url: "/media-extractor", icon: Download },
          { title: "Kategorisierung", url: "/media?view=categories", icon: Layers, badge: "AI" }
        ]
      },
    ]
  },
  {
    label: "Import & Sync",
    description: "Datenimport und Synchronisation",
    items: [
      { 
        title: "CSV Import", 
        url: "/import-csv", 
        icon: Upload,
        description: "Massendatenimport mit intelligentem Mapping",
        badge: "Smart"
      },
      { 
        title: "Sync & Export", 
        url: "/sync", 
        icon: RefreshCw,
        description: "Synchronisation mit externen Plattformen"
      },
    ]
  },
  {
    label: "Verwaltung",
    description: "Konto und Systemeinstellungen",
    items: [
      { 
        title: "Konto", 
        url: "/account", 
        icon: UserCog,
        description: "Persönliche Einstellungen und Profil"
      },
      { 
        title: "Team", 
        url: "/team", 
        icon: Users, 
        disabled: true,
        description: "Teamverwaltung und Berechtigungen",
        badge: "Bald"
      },
      { 
        title: "Bookings", 
        url: "/bookings", 
        icon: Calendar, 
        disabled: true,
        description: "Buchungskalender und Reservierungen",
        badge: "Bald"
      },
    ]
  },
  {
    label: "Admin Tools",
    description: "Erweiterte Administratorfunktionen",
    items: [
      { 
        title: "Duplikat-Detection", 
        url: "/admin/duplicates", 
        icon: Shield,
        description: "Globale Duplikatserkennung und -verwaltung",
        badge: "System"
      },
      { 
        title: "AI Settings", 
        url: "/admin/ai-settings", 
        icon: Settings,
        description: "KI-Modell und Prompt-Konfiguration"
      },
      { 
        title: "Prompt Manager", 
        url: "/admin/prompts", 
        icon: MessageSquare,
        description: "Verwaltung von AI-Prompts und Templates"
      },
    ]
  }
];

export function EnhancedAppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const currentPath = location.pathname;
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    [t('nav.dashboard')]: true,
    [t('ai.tools')]: true
  });
  
  const navigationSections = getNavigationSections(t);
  
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/properties" && currentPath.startsWith("/properties")) return true;
    return currentPath === path || currentPath.startsWith(path + "?");
  };

  const toggleSection = (sectionLabel: string) => {
    if (!isCollapsed) {
      setExpandedSections(prev => ({
        ...prev,
        [sectionLabel]: !prev[sectionLabel]
      }));
    }
  };

  const toggleItem = (itemTitle: string) => {
    if (!isCollapsed) {
      setExpandedItems(prev => ({
        ...prev,
        [itemTitle]: !prev[itemTitle]
      }));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const NavItemComponent = ({ item, isSubItem = false }: { item: NavItem | SubNavItem, isSubItem?: boolean }) => {
    const hasSubItems = 'subItems' in item && item.subItems && item.subItems.length > 0;
    const isItemExpanded = expandedItems[item.title];
    const itemIsActive = isActive(item.url);

    const handleClick = (e: React.MouseEvent) => {
      if (hasSubItems && !isCollapsed) {
        e.preventDefault();
        toggleItem(item.title);
      }
    };

    return (
      <>
        <SidebarMenuItem>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton asChild disabled={item.disabled}>
                <NavLink 
                  to={item.url} 
                  onClick={handleClick}
                  className={cn(
                    "group transition-all duration-200 relative overflow-hidden",
                    "flex items-center justify-center",
                    itemIsActive 
                      ? "bg-primary/10 text-primary border-r-2 border-primary font-medium" 
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                    item.disabled && "opacity-50 cursor-not-allowed",
                    isSubItem && !isCollapsed && "pl-8 text-sm",
                    isCollapsed && "w-10 h-10 p-0 justify-center",
                    !isCollapsed && "px-3 py-2 justify-start",
                    "hover:shadow-sm"
                  )}
                >
                  {isCollapsed ? (
                    <item.icon className="h-4 w-4 shrink-0" />
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 shrink-0" />
                        <div className="flex items-center gap-2">
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <Badge 
                              variant={item.isNew ? "default" : "secondary"} 
                              className={cn(
                                "text-xs px-1.5 py-0.5",
                                item.isNew && "bg-green-500 text-white",
                                item.badge === "⚡" && "bg-yellow-500 text-black"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                          {item.isNew && !item.badge && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          )}
                        </div>
                      </div>
                      
                      {hasSubItems && (
                        <div className="ml-auto">
                          {isItemExpanded ? (
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {itemIsActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 bg-primary/5 rounded-md"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </NavLink>
              </SidebarMenuButton>
            </TooltipTrigger>
            {isCollapsed && 'description' in item && (
              <TooltipContent side="right" className="ml-2 z-50">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                {'shortcut' in item && item.shortcut && (
                  <div className="text-xs text-muted-foreground mt-1">
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">{item.shortcut}</kbd>
                  </div>
                )}
              </TooltipContent>
            )}
          </Tooltip>
        </SidebarMenuItem>

        {hasSubItems && 'subItems' in item && !isCollapsed && (
          <AnimatePresence>
            {isItemExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {item.subItems?.map((subItem) => (
                  <NavItemComponent key={subItem.title} item={subItem} isSubItem />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </>
    );
  };

  return (
    <Sidebar
      className={cn(
        "transition-all duration-300 border-r bg-card/50 backdrop-blur-sm",
        isCollapsed ? "w-16" : "w-72"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg shrink-0">
              <span className="text-primary-foreground font-bold text-lg">L</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground">Leasy</span>
                <div className="flex items-center space-x-2">
                  <div className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                    BETA
                  </div>
                  <div className="bg-green-500/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full text-xs font-medium">
                    AI-Powered
                  </div>
                </div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        <div className="p-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                asChild
                className={cn(
                  "w-full transition-all duration-200 shadow-md hover:shadow-lg",
                  "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                  isCollapsed && "aspect-square p-0"
                )}
                size={isCollapsed ? "icon" : "default"}
              >
                <NavLink to="/add-property">
                  <Plus className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="ml-2">Neue Immobilie</span>}
                  {!isCollapsed && <Sparkles className="h-3 w-3 ml-auto text-primary-foreground/70" />}
                </NavLink>
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="z-50">
                <div className="font-medium">Neue Immobilie</div>
                <div className="text-xs text-muted-foreground">Schnell hinzufügen</div>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        <Separator className="mx-4" />

        <div className="space-y-2 p-2">
          {navigationSections.map((section) => {
            const isSectionExpanded = expandedSections[section.label] ?? section.defaultOpen ?? true;
            
            return (
              <SidebarGroup key={section.label}>
                {!isCollapsed && (
                  <div 
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/50 rounded-md transition-colors group"
                    onClick={() => toggleSection(section.label)}
                  >
                    <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {section.label}
                    </SidebarGroupLabel>
                    <div className="flex items-center space-x-1">
                      {isSectionExpanded ? (
                        <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                      )}
                    </div>
                  </div>
                )}
                
                <AnimatePresence>
                  {(isSectionExpanded || isCollapsed) && (
                    <motion.div
                      initial={!isCollapsed ? { height: 0, opacity: 0 } : {}}
                      animate={!isCollapsed ? { height: "auto", opacity: 1 } : {}}
                      exit={!isCollapsed ? { height: 0, opacity: 0 } : {}}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                          {section.items.map((item) => (
                            <NavItemComponent key={item.title} item={item} />
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </SidebarGroup>
            );
          })}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t bg-muted/20 p-4">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground mb-2 px-3">
            {user?.email?.split('@')[0]}
          </div>
        )}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size={isCollapsed ? "icon" : "sm"}
              onClick={handleSignOut}
              className={cn(
                "w-full transition-colors hover:bg-destructive/10 hover:text-destructive",
                isCollapsed ? "aspect-square p-0 justify-center" : "justify-start"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right" className="z-50">
              <div className="font-medium">Abmelden</div>
            </TooltipContent>
          )}
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  );
}
