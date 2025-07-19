import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/lib/errorBoundary";
import "@/lib/pwa"; // Initialize PWA features

// Critical: Ensure React is fully available before proceeding
if (!React || !React.useEffect || !React.useState || !React.createContext) {
  throw new Error("React hooks are not available. This might be a version compatibility issue.");
}

console.log("React verification:", {
  React: !!React,
  useEffect: !!React.useEffect,
  useState: !!React.useState,
  createContext: !!React.createContext
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Simple render without QueryClient to isolate the issue
createRoot(rootElement).render(
  <ErrorBoundary>
    <StrictMode>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </StrictMode>
  </ErrorBoundary>
);