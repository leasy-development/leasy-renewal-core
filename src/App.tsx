import * as React from "react";
import { Suspense, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EnhancedErrorBoundary } from "@/components/EnhancedErrorBoundary";
import { UpdateNotification } from "@/components/UpdateNotification";
import { DevToolsPanel } from "@/components/DevToolsPanel";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { errorMonitoringService } from "@/services/errorMonitoringService";
import { LoadingFallback } from "@/components/LoadingFallback";
import { ErrorFallback } from "@/components/ErrorFallback";
import { devTools } from "@/lib/devtools";
import { performanceMonitor } from "@/lib/performance";
import config from "@/lib/config";

// Import non-lazy loaded components
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { CacheStatusDebugger } from "./components/CacheStatusDebugger";
import AdminPromptManager from "@/components/AdminPromptManager";

// Import lazy loaded components
import {
  Dashboard,
  Properties,
  AddProperty,
  AITools,
  Analytics,
  Media,
  MediaExtractor,
  ImportCSV,
  Duplicates,
  ErrorMonitoring,
  AccountSettings,
  Sync,
  TranslationDashboard,
  AIOptimizationDashboard,
  AdminDuplicates,
  AdminAISettings,
  UpdatePassword,
  DeepSourceDashboard,
  DeepSourceReports,
  RobustnessDemo,
  MappingTest,
} from "@/components/LazyRoutes";

const AppContent = () => {
  const { isUpdateAvailable, refreshCountdown } = useAutoRefresh();

  // Start error monitoring and dev tools when app loads
  useEffect(() => {
    errorMonitoringService.startMonitoring();
    
    // Initialize dev tools in development
    if (config.features.enableDebugTools) {
      devTools.init();
    }
    
    // Start performance monitoring
    if (config.performance.enableMetrics) {
      const endMeasurement = performanceMonitor.startMeasurement('App Mount');
      return () => {
        endMeasurement();
        errorMonitoringService.stopMonitoring();
      };
    }
    
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
      
      {/* Dev Tools Panel - only shown in development */}
      {config.features.enableDebugTools && <DevToolsPanel />}
      
      <Routes>
        <Route path="/" element={<Index />} />
        
        {/* Protected routes with lazy loading */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <Dashboard />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        
        
        
        <Route 
          path="/properties" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <Properties />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/add-property" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AddProperty />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/edit-property/:id" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AddProperty />
              </Suspense>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/ai-tools" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <AITools />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <Analytics />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/media" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <Media />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/account" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <AccountSettings />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/sync" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <Sync />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/import-csv" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <ImportCSV />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/duplicates" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <Duplicates />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/error-monitoring" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <ErrorMonitoring />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/media-extractor" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <MediaExtractor />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/translations" 
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <TranslationDashboard />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ai-optimization" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <AIOptimizationDashboard />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/ai-settings"
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <AdminAISettings />
              </Suspense>
            </ProtectedRoute>
          } 
        />
         <Route 
           path="/admin/duplicates" 
           element={
             <ProtectedRoute>
               <Suspense fallback={<LoadingFallback />}>
                 <AdminDuplicates />
               </Suspense>
             </ProtectedRoute>
           } 
         />
         <Route 
           path="/admin/prompts" 
           element={
             <ProtectedRoute>
               <DashboardLayout>
                 <Suspense fallback={<LoadingFallback />}>
                   <AdminPromptManager />
                 </Suspense>
               </DashboardLayout>
             </ProtectedRoute>
           } 
         />
         <Route path="/update-password" element={<Suspense fallback={<LoadingFallback />}><UpdatePassword /></Suspense>} />
         
         {/* DeepSource Dashboard Route */}
         <Route 
           path="/deepsource" 
           element={
             <ProtectedRoute>
               <DashboardLayout>
                 <Suspense fallback={<LoadingFallback />}>
                   <DeepSourceDashboard />
                 </Suspense>
               </DashboardLayout>
             </ProtectedRoute>
           } 
         />
         
         {/* DeepSource Reports Route */}
         <Route 
           path="/deepsource/reports" 
           element={
             <ProtectedRoute>
               <DashboardLayout>
                 <Suspense fallback={<LoadingFallback />}>
                   <DeepSourceReports />
                 </Suspense>
               </DashboardLayout>
             </ProtectedRoute>
           } 
         />
         
         {/* Demo and Testing Routes */}
         <Route 
           path="/demo/robustness" 
           element={
             <ProtectedRoute>
               <DashboardLayout>
                 <Suspense fallback={<LoadingFallback />}>
                   <RobustnessDemo />
                 </Suspense>
               </DashboardLayout>
             </ProtectedRoute>
           } 
         />
         
         <Route 
           path="/demo/mapping" 
           element={
             <ProtectedRoute>
               <DashboardLayout>
                 <Suspense fallback={<LoadingFallback />}>
                   <MappingTest />
                 </Suspense>
               </DashboardLayout>
             </ProtectedRoute>
           } 
         />
          
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

        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <EnhancedErrorBoundary>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </EnhancedErrorBoundary>
    </ErrorBoundary>
  );
};

export default App;
