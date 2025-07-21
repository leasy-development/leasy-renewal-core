
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
          {/* Enhanced Header - Fixed overlapping issues */}
          <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-4 lg:px-6">
              {/* Left Section - Fixed spacing */}
              <div className="flex items-center gap-3">
                <SidebarTrigger className="h-9 w-9 shrink-0" />
                <div className="hidden lg:block">
                  <QuickActionMenu />
                </div>
              </div>

              {/* Center Section - Page Title (responsive) */}
              {pageTitle && (
                <div className="hidden md:block flex-1 max-w-md mx-4">
                  <h1 className="text-lg font-semibold text-foreground truncate text-center">
                    {pageTitle}
                  </h1>
                </div>
              )}

              {/* Right Section - Fixed responsive spacing */}
              <div className="flex items-center gap-2">
                {/* Custom Header Actions */}
                {headerActions && (
                  <div className="hidden md:flex items-center gap-2">
                    {headerActions}
                  </div>
                )}

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative h-9 w-9 shrink-0">
                  <Bell className="h-4 w-4" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
                  >
                    3
                  </Badge>
                  <span className="sr-only">Benachrichtigungen</span>
                </Button>

                {/* Settings Quick Access */}
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Einstellungen</span>
                </Button>

                {/* Language & Theme Toggle */}
                <div className="flex items-center gap-1">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>

                {/* User Info - Hidden on mobile to prevent overlap */}
                <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-border">
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {user?.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Premium Account
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-primary">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Breadcrumb Section */}
            {showBreadcrumb && (
              <div className="border-t bg-muted/20 px-4 lg:px-6 py-3">
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
              fullWidth ? "p-0" : "p-4 lg:p-6",
              className
            )}
          >
            {/* Page Header (if not shown in breadcrumb) */}
            {(pageTitle || pageDescription) && !showBreadcrumb && (
              <div className="mb-8">
                {pageTitle && (
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight mb-2">
                    {pageTitle}
                  </h1>
                )}
                {pageDescription && (
                  <p className="text-muted-foreground text-base lg:text-lg">
                    {pageDescription}
                  </p>
                )}
              </div>
            )}

            {/* Page Content */}
            <div className={cn(
              "space-y-6 lg:space-y-8",
              fullWidth && "h-full"
            )}>
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t bg-muted/20 px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2 lg:gap-4">
                <span>© 2024 Leasy</span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:inline">Version 2.0 Beta</span>
                <span className="hidden lg:inline">•</span>
                <span className="hidden lg:inline">AI-Powered Real Estate Management</span>
              </div>
              <div className="flex items-center gap-2 lg:gap-4">
                <span className="hidden md:inline">Status: </span>
                <div className="flex items-center gap-1">
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
