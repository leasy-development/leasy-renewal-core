#!/usr/bin/env node

/**
 * Build Verification Script (ES modules compatible)
 * Ensures React environment is stable before Vite build
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

console.log("🔍 Running pre-build React verification...");

async function verifyReact() {
  try {
    // Dynamic import for React (ES modules)
    const React = await import("react");
    
    if (!React.default) {
      console.error("❌ React module failed to import — aborting build.");
      process.exit(1);
    }

    const ReactModule = React.default;

    if (!ReactModule.useEffect) {
      console.error("❌ React.useEffect is undefined — aborting build.");
      process.exit(1);
    }

    if (typeof ReactModule.useEffect !== 'function') {
      console.error("❌ React.useEffect is not a function — aborting build.");
      process.exit(1);
    }

    // Check essential hooks
    const hooks = ['useState', 'useContext', 'useCallback', 'useMemo', 'useRef'];
    for (const hook of hooks) {
      if (!ReactModule[hook] || typeof ReactModule[hook] !== 'function') {
        console.error(`❌ React.${hook} is missing — aborting build.`);
        process.exit(1);
      }
    }

    console.log("✅ React.useEffect is properly defined.");
    console.log("✅ All essential React hooks verified.");
    console.log(`✅ React version: ${ReactModule.version || 'detected'}`);

  } catch (err) {
    console.error("❌ React verification failed:", err.message);
    process.exit(1);
  }
}

// Run verification
verifyReact().then(() => {
  console.log("🚀 Build verification passed!");
}).catch((err) => {
  console.error("❌ Build verification failed:", err);
  process.exit(1);
});