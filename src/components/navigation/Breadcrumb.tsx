import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<any>;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}

// Route mapping for automatic breadcrumb generation
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [
    { label: 'Dashboard', href: '/dashboard', icon: Home, isActive: true }
  ],
  '/properties': [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Immobilien', href: '/properties', isActive: true }
  ],
  '/add-property': [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Immobilien', href: '/properties' },
    { label: 'Neue Immobilie', isActive: true }
  ],
  '/ai-tools': [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'AI Tools', href: '/ai-tools', isActive: true }
  ],
  '/media': [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Media Intelligence', href: '/media', isActive: true }
  ],
  '/import-csv': [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'CSV Import', href: '/import-csv', isActive: true }
  ],
  '/account': [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Konto-Einstellungen', href: '/account', isActive: true }
  ],
  '/analytics': [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Analytics', href: '/analytics', isActive: true }
  ],
  '/admin/duplicates': [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Admin', href: '/admin' },
    { label: 'Duplikat-Detection', href: '/admin/duplicates', isActive: true }
  ],
  '/admin/ai-settings': [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Admin', href: '/admin' },
    { label: 'AI Settings', href: '/admin/ai-settings', isActive: true }
  ],
  '/admin/prompts': [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Admin', href: '/admin' },
    { label: 'Prompt Manager', href: '/admin/prompts', isActive: true }
  ]
};

export function Breadcrumb({ items, separator, className }: BreadcrumbProps) {
  const location = useLocation();
  
  // Use provided items or generate from current path
  const breadcrumbItems = items || routeMapping[location.pathname] || [
    { label: 'Dashboard', href: '/dashboard', icon: Home }
  ];

  const defaultSeparator = separator || <ChevronRight className="h-4 w-4 text-muted-foreground" />;

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center space-x-2 text-sm", className)}
    >
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const isFirst = index === 0;
          
          return (
            <li key={index} className="flex items-center space-x-2">
              {/* Separator */}
              {!isFirst && (
                <span className="text-muted-foreground" aria-hidden="true">
                  {defaultSeparator}
                </span>
              )}
              
              {/* Breadcrumb Item */}
              {item.href && !item.isActive ? (
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center space-x-1 transition-colors hover:text-primary",
                    "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.icon && isFirst && (
                    <item.icon className="h-4 w-4" />
                  )}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex items-center space-x-1",
                    item.isActive 
                      ? "text-foreground font-medium" 
                      : "text-muted-foreground"
                  )}
                  aria-current={item.isActive ? "page" : undefined}
                >
                  {item.icon && isFirst && (
                    <item.icon className="h-4 w-4" />
                  )}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Enhanced breadcrumb with additional context
export function EnhancedBreadcrumb({ 
  items, 
  className,
  showPageTitle = true,
  pageTitle,
  pageDescription 
}: BreadcrumbProps & {
  showPageTitle?: boolean;
  pageTitle?: string;
  pageDescription?: string;
}) {
  const location = useLocation();
  
  const breadcrumbItems = items || routeMapping[location.pathname] || [
    { label: 'Dashboard', href: '/dashboard', icon: Home }
  ];

  const currentPageTitle = pageTitle || breadcrumbItems[breadcrumbItems.length - 1]?.label || 'Unbekannte Seite';

  return (
    <div className={cn("space-y-3", className)}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} />
      
      {/* Page Header */}
      {showPageTitle && (
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {currentPageTitle}
          </h1>
          {pageDescription && (
            <p className="text-muted-foreground">
              {pageDescription}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Hook to easily set breadcrumb items from components
export function useBreadcrumb(items: BreadcrumbItem[]) {
  const location = useLocation();
  
  React.useEffect(() => {
    // This could be extended to use a context to dynamically update breadcrumbs
    // For now, we're using static mapping
  }, [items, location.pathname]);
  
  return { items };
}