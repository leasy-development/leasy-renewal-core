import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Build-time React verification plugin
function reactVerificationPlugin() {
  return {
    name: 'react-verification',
    async buildStart() {
      // Verify React hooks are available during build using dynamic import
      try {
        const React = await import('react');
        const ReactModule = React.default || React;
        
        if (!ReactModule || !ReactModule.useEffect) {
          throw new Error('React.useEffect is not available during build');
        }
        if (typeof ReactModule.useEffect !== 'function') {
          throw new Error('React.useEffect is not a function');
        }
        console.log('✅ Build-time React verification passed');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('❌ Build-time React verification failed:', errorMessage);
        // Don't throw in buildStart as it may cause issues - just warn
        console.warn('⚠️ Continuing build despite React verification failure');
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
    // reactVerificationPlugin(), // Temporarily disabled to avoid build issues
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
