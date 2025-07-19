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
  Image,
  Brain,
  MessageSquare
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Properties", url: "/properties", icon: Home },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const toolsItems = [
  { title: "Sync", url: "/sync", icon: RefreshCw },
  { title: "AI Tools", url: "/ai-tools", icon: Bot },
  { title: "Media", url: "/media", icon: Images },
  { title: "Media Extractor", url: "/media-extractor", icon: Download },
];

const settingsItems = [
  { title: "Account", url: "/account", icon: Settings },
  { title: "Team", url: "/team", icon: Users, disabled: true },
  { title: "Bookings", url: "/bookings", icon: Calendar, disabled: true },
];

const adminItems = [
  { title: "Duplicate Detection", url: "/admin/duplicates", icon: Shield },
  { title: "AI Settings", url: "/admin/ai-settings", icon: Brain },
  { title: "AI Prompts", url: "/admin/prompts", icon: MessageSquare },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar
      className={isCollapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      {/* Header with Logo */}
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">L</span>
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold text-foreground">Leasy</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Add Property Button */}
        <div className="p-4">
          <SidebarMenuButton asChild>
            <NavLink to="/add-property">
              <Button className="w-full justify-start" size={isCollapsed ? "icon" : "default"}>
                <Plus className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">Add Property</span>}
              </Button>
            </NavLink>
          </SidebarMenuButton>
        </div>

        <Separator />

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Show only for admin users */}
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild disabled={item.disabled}>
                    <NavLink 
                      to={item.url} 
                      className={item.disabled ? "opacity-50 cursor-not-allowed" : getNavCls}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && (
                        <span>
                          {item.title}
                          {item.disabled && <span className="text-xs ml-2">(Soon)</span>}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with User Info and Sign Out */}
      <SidebarFooter className="border-t p-4">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground mb-2">
            {user?.email?.split('@')[0]}
          </div>
        )}
        <SidebarMenuButton asChild>
          <Button 
            variant="ghost" 
            size={isCollapsed ? "icon" : "sm"}
            onClick={handleSignOut}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}