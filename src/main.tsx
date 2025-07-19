import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from "@/components/AuthProvider";
import { ReactQueryProvider } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import "@/lib/pwa"; // Initialize PWA features

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ReactQueryProvider>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </ReactQueryProvider>
  </StrictMode>
);
