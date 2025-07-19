import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
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

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            <Route path="/update-password" element={<UpdatePassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
);

export default App;
