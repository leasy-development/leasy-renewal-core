#!/usr/bin/env node

/**
 * Production Build Quality Check
 * Ensures the build meets production standards
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const checks = [];

// Check if essential files exist
const essentialFiles = [
  'package.json',
  'vite.config.ts',
  'tailwind.config.ts',
  'src/main.tsx',
  'src/App.tsx',
  'index.html',
  'public/manifest.json',
  'public/sw.js'
];

console.log('🔍 Running production build quality checks...\n');

// File existence check
essentialFiles.forEach(file => {
  const exists = existsSync(file);
  checks.push({
    name: `File exists: ${file}`,
    passed: exists,
    message: exists ? '✅ Found' : '❌ Missing'
  });
});

// Package.json validation
try {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  
  checks.push({
    name: 'Package.json has required scripts',
    passed: pkg.scripts?.build && pkg.scripts?.dev && pkg.scripts?.lint,
    message: pkg.scripts?.build ? '✅ Build scripts configured' : '❌ Missing build scripts'
  });

  checks.push({
    name: 'React 19 dependency',
    passed: pkg.dependencies?.react?.startsWith('19') || pkg.dependencies?.react === '^19.1.0',
    message: pkg.dependencies?.react ? '✅ React 19 detected' : '❌ React version issue'
  });
} catch (error) {
  checks.push({
    name: 'Package.json parsing',
    passed: false,
    message: '❌ Cannot parse package.json'
  });
}

// TypeScript compilation check
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  checks.push({
    name: 'TypeScript compilation',
    passed: true,
    message: '✅ No TypeScript errors'
  });
} catch (error) {
  checks.push({
    name: 'TypeScript compilation',
    passed: false,
    message: '❌ TypeScript errors found'
  });
}

// ESLint check
try {
  execSync('npx eslint src --ext .ts,.tsx', { stdio: 'pipe' });
  checks.push({
    name: 'ESLint validation',
    passed: true,
    message: '✅ No linting errors'
  });
} catch (error) {
  checks.push({
    name: 'ESLint validation',
    passed: false,
    message: '⚠️ Linting issues found (run npm run lint --fix)'
  });
}

// Test execution
try {
  execSync('npm run test -- --run', { stdio: 'pipe' });
  checks.push({
    name: 'Unit tests',
    passed: true,
    message: '✅ All tests passing'
  });
} catch (error) {
  checks.push({
    name: 'Unit tests',
    passed: false,
    message: '❌ Some tests failing'
  });
}

// Report results
console.log('📊 Build Quality Report:');
console.log('========================\n');

let passedChecks = 0;
const totalChecks = checks.length;

checks.forEach(check => {
  console.log(`${check.message} ${check.name}`);
  if (check.passed) passedChecks++;
});

console.log(`\n📈 Quality Score: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);

if (passedChecks === totalChecks) {
  console.log('🎉 Build ready for production!');
  process.exit(0);
} else {
  console.log('⚠️ Some checks failed. Review and fix before production deployment.');
  process.exit(1);
}