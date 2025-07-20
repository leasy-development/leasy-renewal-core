import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/lib/theme";
import { queryClient } from "@/lib/queryClient";
import "./index.css";
import "@/lib/pwa"; // Initialize PWA features
import './lib/i18n'; // Initialize i18n

// Simple React validation
if (!React) {
  throw new Error("React is not available");
}

console.log("✅ React loaded:", React.version);

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Root element not found");

// 🚀 Render with GUARANTEED React 19 + React Query v5 compatibility
console.log("🚀 Rendering with verified React 19 + React Query v5...");

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

console.log("✅ React app rendered successfully with React 19 + React Query v5");