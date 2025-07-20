import * as React from "react";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EnhancedErrorBoundary } from "@/components/EnhancedErrorBoundary";
import { ErrorBoundary } from "@/lib/errorBoundary";
import { UpdateNotification } from "@/components/UpdateNotification";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { errorMonitoringService } from "@/services/errorMonitoringService";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AddProperty from "./pages/AddProperty";
import Properties from "./pages/Properties";
import Sync from "./pages/Sync";
import AITools from "./pages/AITools";
import Media from "./pages/Media";
import NotFound from "./pages/NotFound";
import AccountSettings from "./pages/AccountSettings";
import Analytics from "./pages/Analytics";
import UpdatePassword from "./pages/UpdatePassword";
import AdminDuplicates from "./pages/AdminDuplicates";
import AdminAISettings from "./pages/AdminAISettings";
import TranslationDashboard from "./pages/TranslationDashboard";
import AIOptimizationDashboard from "./pages/AIOptimizationDashboard";
import MediaExtractor from "./pages/MediaExtractor";
import AdminPromptManager from "@/components/AdminPromptManager";
import ImportCSV from "./pages/ImportCSV";
import Duplicates from "./pages/Duplicates";
import ErrorMonitoring from "./pages/ErrorMonitoring";
import DeepSource from "./pages/DeepSource";
import { CacheStatusDebugger } from "./components/CacheStatusDebugger";

const AppContent = () => {
  const { isUpdateAvailable, refreshCountdown } = useAutoRefresh();

  // Start error monitoring when app loads
  useEffect(() => {
    errorMonitoringService.startMonitoring();
    
    return () => {
      errorMonitoringService.stopMonitoring();
    };
  }, []);

  const handleRefreshNow = () => {
    window.location.reload();
  };

  const handleCancelRefresh = () => {
    // Refresh cancellation is handled inside the hook
  };

  return (
    <>
      <UpdateNotification
        isVisible={isUpdateAvailable}
        countdown={refreshCountdown}
        onRefreshNow={handleRefreshNow}
        onCancel={handleCancelRefresh}
      />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/properties" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Properties />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add-property" 
          element={
            <ProtectedRoute>
              <AddProperty />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/edit-property/:id" 
          element={
            <ProtectedRoute>
              <AddProperty />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/sync" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Sync />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ai-tools" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AITools />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/import-csv" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ImportCSV />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/duplicates" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Duplicates />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/error-monitoring" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ErrorMonitoring />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/deepsource" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DeepSource />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/media" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Media />
              </DashboardLayout>
             </ProtectedRoute>
           } 
         />
         <Route 
           path="/media-extractor" 
           element={
             <ProtectedRoute>
               <DashboardLayout>
                 <MediaExtractor />
               </DashboardLayout>
             </ProtectedRoute>
           } 
         />
        <Route 
          path="/account" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AccountSettings />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Analytics />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/translations" 
          element={
            <ProtectedRoute>
              <TranslationDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ai-optimization" 
          element={
            <ProtectedRoute>
              <AIOptimizationDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/ai-settings"
          element={
            <ProtectedRoute>
              <AdminAISettings />
            </ProtectedRoute>
          } 
        />
         <Route 
           path="/admin/duplicates" 
           element={
             <ProtectedRoute>
               <AdminDuplicates />
             </ProtectedRoute>
           } 
         />
         <Route 
           path="/admin/prompts" 
           element={
             <ProtectedRoute>
               <DashboardLayout>
                 <AdminPromptManager />
               </DashboardLayout>
             </ProtectedRoute>
           } 
         />
         <Route path="/update-password" element={<UpdatePassword />} />
         
         {/* Debug routes (development only) */}
         {import.meta.env.DEV && (
           <Route 
             path="/debug/cache" 
             element={
               <ProtectedRoute>
                 <DashboardLayout>
                   <CacheStatusDebugger />
                 </DashboardLayout>
               </ProtectedRoute>
             } 
           />
         )}
         
         {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
         <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <EnhancedErrorBoundary>
      <ErrorBoundary>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ErrorBoundary>
    </EnhancedErrorBoundary>
  );
};

export default App;
