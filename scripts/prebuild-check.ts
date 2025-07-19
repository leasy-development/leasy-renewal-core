#!/usr/bin/env node

/**
 * Prebuild Check Script
 * Ensures React.useEffect is properly defined before proceeding with build
 */

import fs from "fs";
import path from "path";

console.log("🔍 Running prebuild React verification...");

// 🧪 Check that useEffect is defined
try {
  // Check if React module exists
  const reactPath = path.resolve(process.cwd(), "node_modules/react");
  if (!fs.existsSync(reactPath)) {
    console.error("❌ React module not found in node_modules");
    process.exit(1);
  }

  // Import and verify React
  const React = require("react");
  
  if (!React) {
    console.error("❌ React module failed to import — aborting build.");
    process.exit(1);
  }

  if (!React.useEffect) {
    console.error("❌ React.useEffect is undefined — aborting build.");
    console.error("This suggests a corrupted React installation or version mismatch.");
    console.error("Try running: npm install react@latest react-dom@latest");
    process.exit(1);
  }

  if (typeof React.useEffect !== 'function') {
    console.error("❌ React.useEffect is not a function — aborting build.");
    console.error("React.useEffect type:", typeof React.useEffect);
    process.exit(1);
  }

  // Additional React hook checks
  const requiredHooks = ['useState', 'useContext', 'useCallback', 'useMemo'];
  for (const hook of requiredHooks) {
    if (!React[hook] || typeof React[hook] !== 'function') {
      console.error(`❌ React.${hook} is missing or invalid — aborting build.`);
      process.exit(1);
    }
  }

  console.log("✅ React.useEffect is properly defined.");
  console.log("✅ All required React hooks are available.");
  console.log(`✅ React version: ${React.version || 'unknown'}`);
  console.log("🚀 Prebuild check passed — proceeding with build.");

} catch (err) {
  console.error("❌ Could not import React:", err);
  console.error("This might indicate:");
  console.error("  • Missing node_modules (run npm install)");
  console.error("  • Corrupted React installation");
  console.error("  • Node.js version incompatibility");
  process.exit(1);
}

// Optional: Check package.json React version
try {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const reactVersion = packageJson.dependencies?.react || packageJson.devDependencies?.react;
  
  if (reactVersion) {
    console.log(`📦 React package version: ${reactVersion}`);
  }
} catch (err) {
  console.warn("⚠️ Could not read package.json for version info");
}