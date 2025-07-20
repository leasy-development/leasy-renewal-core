import { ReactNode } from "react";
import { EnhancedDashboardLayout } from "@/components/navigation/EnhancedDashboardLayout";

interface DashboardLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  pageDescription?: string;
}

export function DashboardLayout({ 
  children, 
  pageTitle, 
  pageDescription 
}: DashboardLayoutProps) {
  return (
    <EnhancedDashboardLayout
      pageTitle={pageTitle}
      pageDescription={pageDescription}
    >
      {children}
    </EnhancedDashboardLayout>
  );
}