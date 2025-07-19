import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "@/lib/pwa"; // Initialize PWA features

// 🔐 CRITICAL: React validation before any other imports
console.log("🔍 Initial React validation:", {
  React: !!React,
  useEffect: !!React?.useEffect,
  useState: !!React?.useState,
});

if (!React) {
  throw new Error("❌ React module is null or undefined");
}

if (!React.useEffect || typeof React.useEffect !== 'function') {
  throw new Error("❌ React.useEffect is not available or not a function");
}

// Only import these AFTER React validation passes
import App from "./App";
import { ErrorBoundary } from "@/lib/errorBoundary";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/components/AuthProvider";

// Final verification before component initialization
console.log("✅ Pre-component React verification passed");

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Create a simple QueryClient to avoid complex initialization issues
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 0,
    }
  },
});

console.log("🚀 Initializing React app...");

// Create the root with error handling
try {
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
  
  console.log("✅ React app rendered successfully");
} catch (error) {
  console.error("❌ Failed to render React app:", error);
  
  // Fallback: try rendering without QueryClient
  try {
    console.log("🔄 Attempting fallback render without QueryClient...");
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <AuthProvider>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h1>Application Error</h1>
              <p>There was an issue starting the application. Please refresh the page.</p>
              <button onClick={() => window.location.reload()}>Refresh</button>
            </div>
          </AuthProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (fallbackError) {
    console.error("❌ Fallback render also failed:", fallbackError);
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: sans-serif;">
        <h1>Critical Error</h1>
        <p>Unable to start the React application.</p>
        <button onclick="window.location.reload()">Reload Page</button>
      </div>
    `;
  }
}