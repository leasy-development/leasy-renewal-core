/// <reference types="vite/client" />
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "./lib/errorBoundary";
import { AuthProvider } from "./components/AuthProvider";
import { Toaster } from "sonner";
import App from "./App";
import "./index.css";
import "./lib/pwa"; // Initialize PWA features

// Enhanced error safety checks
if (!React) {
  throw new Error("React is not available");
}

if (!ReactDOM) {
  throw new Error("ReactDOM is not available");
}

// Create query client with improved error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    }
  },
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster 
            richColors 
            position="bottom-right" 
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);