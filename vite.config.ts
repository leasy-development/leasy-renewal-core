import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Build-time React verification plugin
function reactVerificationPlugin() {
  return {
    name: 'react-verification',
    buildStart() {
      // Verify React hooks are available during build
      try {
        const React = require('react');
        if (!React || !React.useEffect) {
          throw new Error('React.useEffect is not available during build');
        }
        if (typeof React.useEffect !== 'function') {
          throw new Error('React.useEffect is not a function');
        }
        console.log('✅ Build-time React verification passed');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('❌ Build-time React verification failed:', errorMessage);
        throw err;
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    reactVerificationPlugin(), // Add React verification
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
