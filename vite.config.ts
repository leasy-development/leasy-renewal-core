
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Build-time React verification plugin
function reactVerificationPlugin() {
  return {
    name: 'react-verification',
    async buildStart() {
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
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Production optimizations
    target: 'esnext',
    minify: 'esbuild', // Use esbuild instead of terser (faster and included by default)
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts'],
        },
      },
    },
    // esbuild options for production optimization
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
  },
  // PWA optimizations
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
}));
