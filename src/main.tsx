import * as React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/lib/theme";
import "./index.css";
import "@/lib/pwa"; // Initialize PWA features
import './lib/i18n'; // Initialize i18n

// Create a minimal React app first to test React loading
const MinimalApp = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <div style={{ padding: '20px', fontSize: '18px' }}>
        <h1>React Loading Test</h1>
        <p>If you can see this, React is working correctly.</p>
        <p>React version: {React.version}</p>
      </div>
      <Toaster />
    </ThemeProvider>
  );
};

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("Root element not found");

console.log("🚀 Testing minimal React app...");

const root = createRoot(rootElement);
root.render(<MinimalApp />);