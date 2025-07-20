import * as React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/lib/theme";
import "./index.css";
import "@/lib/pwa"; // Initialize PWA features
import './lib/i18n'; // Initialize i18n

// Defensive React check
if (!React || typeof React.createElement !== 'function') {
  throw new Error("React is not properly loaded");
}

// Create QueryClient with React Query v5 configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // React Query v5 uses gcTime instead of cacheTime
    },
    mutations: {
      retry: 0,
    }
  },
});

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Root element not found");

console.log("🚀 Initializing React app...");

const root = createRoot(rootElement);

root.render(
  <ThemeProvider defaultTheme="system" storageKey="theme">
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster />
    </QueryClientProvider>
  </ThemeProvider>
);

console.log("✅ React app rendered successfully");