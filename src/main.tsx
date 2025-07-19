import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "@/lib/errorBoundary";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/components/AuthProvider";
import "./index.css";
import "@/lib/pwa"; // Initialize PWA features

// 🔐 Critical: Check React import is not null before proceeding
if (!React || !React.useEffect) {
  throw new Error("React not initialized correctly. useEffect is undefined.");
}

// Additional safety checks for React hooks
if (typeof React.useEffect !== 'function' || typeof React.useState !== 'function') {
  throw new Error("React hooks are not available. This might be a version compatibility issue.");
}

console.log("✅ React hooks verification passed:", {
  React: !!React,
  useEffect: typeof React.useEffect,
  useState: typeof React.useState,
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Create QueryClient with safe defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    }
  },
});

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster richColors position="bottom-right" />
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);