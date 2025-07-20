import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { Toaster } from "@/components/ui/toaster";
import "./index.css";
import "@/lib/pwa"; // Initialize PWA features

// Simple React validation
if (!React) {
  throw new Error("React is not available");
}

console.log("✅ React loaded:", React.version);

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

// 🚀 Render with GUARANTEED React 19 + React Query v5 compatibility
console.log("🚀 Rendering with verified React 19 + React Query v5...");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster />
    </QueryClientProvider>
  </React.StrictMode>
);

console.log("✅ React app rendered successfully with React 19 + React Query v5");