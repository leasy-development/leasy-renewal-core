import React, { useState } from 'react';
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
const navigationSections: NavSection[] = [
  {
    label: "Übersicht",
    description: "Hauptfunktionen und Dashboard",
    items: [
      { 
        title: "Dashboard", 
        url: "/dashboard", 
        icon: Home,
        description: "Zentrale Übersicht und Statistiken",
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

// Quick Actions for floating menu
const quickActions = [
  { title: "Neue Immobilie", url: "/add-property", icon: Plus, color: "bg-blue-500" },
  { title: "AI Beschreibung", url: "/ai-tools?tool=description", icon: Brain, color: "bg-purple-500" },
  { title: "Media Upload", url: "/media?action=upload", icon: Upload, color: "bg-green-500" },
  { title: "CSV Import", url: "/import-csv", icon: FileText, color: "bg-orange-500" },
];

export function EnhancedAppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    "Übersicht": true,
    "AI-Powered Tools": true
  });
  
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/properties" && currentPath.startsWith("/properties")) return true;
    return currentPath === path || currentPath.startsWith(path + "?");
  };

  const toggleSection = (sectionLabel: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionLabel]: !prev[sectionLabel]
    }));
  };

  const toggleItem = (itemTitle: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemTitle]: !prev[itemTitle]
    }));
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
                    itemIsActive 
                      ? "bg-primary/10 text-primary border-r-2 border-primary font-medium" 
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                    item.disabled && "opacity-50 cursor-not-allowed",
                    isSubItem && "pl-8 text-sm",
                    "hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <item.icon className={cn(
                        "h-4 w-4 transition-colors duration-200",
                        itemIsActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )} />
                      {!isCollapsed && (
                        <div className="flex items-center space-x-2">
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
                      )}
                    </div>
                    
                    {hasSubItems && !isCollapsed && (
                      <div className="ml-auto">
                        {isItemExpanded ? (
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Active indicator */}
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
              <TooltipContent side="right" className="ml-2">
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

        {/* Sub-items */}
        {hasSubItems && 'subItems' in item && (
          <AnimatePresence>
            {(isItemExpanded || isCollapsed) && (
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
      {/* Enhanced Header */}
      <SidebarHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
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
          {!isCollapsed && <ThemeToggle />}
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        {/* Quick Add Button */}
        <div className="p-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                asChild
                className={cn(
                  "w-full transition-all duration-200 shadow-md hover:shadow-lg",
                  "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                )}
                size={isCollapsed ? "icon" : "default"}
              >
                <NavLink to="/add-property">
                  <Plus className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Neue Immobilie</span>}
                  {!isCollapsed && <Sparkles className="h-3 w-3 ml-auto text-primary-foreground/70" />}
                </NavLink>
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                <div className="font-medium">Neue Immobilie</div>
                <div className="text-xs text-muted-foreground">Schnell hinzufügen</div>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        <Separator className="mx-4" />

        {/* Navigation Sections */}
        <div className="space-y-2 p-2">
          {navigationSections.map((section) => {
            const isSectionExpanded = expandedSections[section.label] ?? section.defaultOpen ?? true;
            
            return (
              <SidebarGroup key={section.label}>
                <div 
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/50 rounded-md transition-colors",
                    !isCollapsed && "group"
                  )}
                  onClick={() => !isCollapsed && toggleSection(section.label)}
                >
                  <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {isCollapsed ? section.label.charAt(0) : section.label}
                  </SidebarGroupLabel>
                  {!isCollapsed && (
                    <div className="flex items-center space-x-1">
                      {isSectionExpanded ? (
                        <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                      )}
                    </div>
                  )}
                </div>
                
                <AnimatePresence>
                  {(isSectionExpanded || isCollapsed) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
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

      {/* Enhanced Footer */}
      <SidebarFooter className="border-t bg-muted/20 p-4">
        {!isCollapsed && (
          <div className="space-y-3">
            {/* User Info */}
            <div className="flex items-center space-x-3 px-2 py-2 bg-background/50 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {user?.email?.split('@')[0]}
                </div>
                <div className="text-xs text-muted-foreground">
                  Premium Account
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-background/50 rounded-lg p-2 text-center">
                <div className="font-medium text-foreground">12</div>
                <div className="text-muted-foreground">Properties</div>
              </div>
              <div className="bg-background/50 rounded-lg p-2 text-center">
                <div className="font-medium text-green-600">98%</div>
                <div className="text-muted-foreground">AI Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Sign Out Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size={isCollapsed ? "icon" : "sm"}
              onClick={handleSignOut}
              className="w-full justify-start mt-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              <div className="font-medium">Abmelden</div>
            </TooltipContent>
          )}
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  );
}