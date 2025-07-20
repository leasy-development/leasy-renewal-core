import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/lib/theme";
import { cacheManager } from "@/lib/cacheManager";
import "./index.css";
import "@/lib/pwa";
import './lib/i18n';

// Add app version meta tag for cache management
const appVersion = import.meta.env.VITE_APP_VERSION || Date.now().toString();
const metaTag = document.createElement('meta');
metaTag.name = 'app-version';
metaTag.content = appVersion;
document.head.appendChild(metaTag);

// Initialize cache management system
cacheManager.initialize().catch(console.error);

// Create QueryClient with React Query v5 configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 0,
    }
  },
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);