import * as React from "react";
import { createRoot } from "react-dom/client";
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

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Root element not found");

console.log("🚀 Initializing React app...");

const root = createRoot(rootElement);

root.render(
  <ThemeProvider defaultTheme="system" storageKey="theme">
    <App />
    <Toaster />
  </ThemeProvider>
);

console.log("✅ React app rendered successfully");