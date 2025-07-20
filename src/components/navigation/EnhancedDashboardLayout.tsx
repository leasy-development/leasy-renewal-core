import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { EnhancedAppSidebar } from "@/components/navigation/EnhancedAppSidebar";
import { EnhancedBreadcrumb } from "@/components/navigation/Breadcrumb";
import { QuickActionMenu, FloatingQuickActions } from "@/components/navigation/QuickActionMenu";
import { Button } from "@/components/ui/button";
import { Bell, Settings } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

interface EnhancedDashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  showBreadcrumb?: boolean;
  headerActions?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export function EnhancedDashboardLayout({
  children,
  pageTitle,
  pageDescription,
  showBreadcrumb = true,
  headerActions,
  fullWidth = false,
  className
}: EnhancedDashboardLayoutProps) {
  const { user } = useAuth();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Enhanced Sidebar */}
        <EnhancedAppSidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Enhanced Header */}
          <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-6">
              {/* Left Section */}
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="h-8 w-8" />
                
                {/* Quick Action Menu */}
                <QuickActionMenu className="hidden md:flex" />
              </div>

              {/* Center Section - Page Title (on smaller screens) */}
              {pageTitle && (
                <div className="hidden md:block">
                  <h1 className="text-lg font-semibold text-foreground">
                    {pageTitle}
                  </h1>
                </div>
              )}

              {/* Right Section */}
              <div className="flex items-center space-x-3">
                {/* Custom Header Actions */}
                {headerActions}

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                  >
                    3
                  </Badge>
                  <span className="sr-only">Benachrichtigungen</span>
                </Button>

                {/* Settings Quick Access */}
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Einstellungen</span>
                </Button>

                {/* Language & Theme Toggle */}
                <div className="flex items-center space-x-2">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>

                {/* User Info */}
                <div className="hidden md:flex items-center space-x-3 pl-3 border-l">
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {user?.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Premium Account
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Breadcrumb Section */}
            {showBreadcrumb && (
              <div className="border-t bg-muted/20 px-6 py-3">
                <EnhancedBreadcrumb 
                  pageTitle={pageTitle}
                  pageDescription={pageDescription}
                  showPageTitle={false}
                />
              </div>
            )}
          </header>

          {/* Main Content */}
          <main 
            className={cn(
              "flex-1 overflow-auto",
              fullWidth ? "p-0" : "p-6",
              className
            )}
          >
            {/* Page Header (if not shown in breadcrumb) */}
            {(pageTitle || pageDescription) && !showBreadcrumb && (
              <div className="mb-8">
                {pageTitle && (
                  <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
                    {pageTitle}
                  </h1>
                )}
                {pageDescription && (
                  <p className="text-muted-foreground text-lg">
                    {pageDescription}
                  </p>
                )}
              </div>
            )}

            {/* Page Content */}
            <div className={cn(
              "space-y-6",
              fullWidth && "h-full"
            )}>
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t bg-muted/20 px-6 py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-4">
                <span>© 2024 Leasy</span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline">Version 2.0 Beta</span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline">AI-Powered Real Estate Management</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="hidden md:inline">Status: </span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium">Online</span>
                </div>
              </div>
            </div>
          </footer>
        </div>

        {/* Floating Quick Actions for Mobile */}
        <FloatingQuickActions />
      </div>
    </SidebarProvider>
  );
}

// Alternative compact layout for specific pages
export function CompactDashboardLayout({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <EnhancedAppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md h-14">
            <div className="flex h-full items-center justify-between px-4">
              <div className="flex items-center space-x-3">
                <SidebarTrigger className="h-7 w-7" />
                <QuickActionMenu />
              </div>
              <div className="flex items-center space-x-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </div>
          </header>
          
          <main className={cn("flex-1 overflow-auto", className)}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}