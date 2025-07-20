#!/usr/bin/env node

/**
 * 🔧 System Repair & Diagnostic Tool
 * Automatisierte Reparatur und Diagnose für leasy-renewal-core
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

class SystemRepair {
  constructor() {
    this.errors = [];
    this.fixes = [];
    this.warnings = [];
  }

  log(message, color = RESET) {
    console.log(`${color}${message}${RESET}`);
  }

  async runCheck(name, checkFn) {
    try {
      this.log(`🔍 Checking: ${name}`, BLUE);
      const result = await checkFn();
      if (result.success) {
        this.log(`✅ ${name}: ${result.message}`, GREEN);
      } else {
        this.log(`❌ ${name}: ${result.message}`, RED);
        this.errors.push({ name, message: result.message, fix: result.fix });
      }
      return result;
    } catch (error) {
      this.log(`💥 ${name}: ${error.message}`, RED);
      this.errors.push({ name, message: error.message });
      return { success: false, message: error.message };
    }
  }

  async repairPackageJson() {
    return this.runCheck('Package.json Dependencies', () => {
      try {
        const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
        const requiredDeps = {
          'react-error-boundary': '^6.0.0',
          'zod': '^3.23.8',
          '@supabase/supabase-js': '^2.52.0',
          '@tanstack/react-query': '^5.83.0'
        };

        let needsUpdate = false;
        for (const [dep, version] of Object.entries(requiredDeps)) {
          if (!packageJson.dependencies[dep]) {
            packageJson.dependencies[dep] = version;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
          return { 
            success: true, 
            message: 'Dependencies updated, run npm install',
            fix: 'npm install'
          };
        }

        return { success: true, message: 'All required dependencies present' };
      } catch (error) {
        return { 
          success: false, 
          message: `Package.json error: ${error.message}`,
          fix: 'Check package.json syntax'
        };
      }
    });
  }

  async checkEnvironment() {
    return this.runCheck('Environment Configuration', () => {
      if (!existsSync('.env.local.example')) {
        return { 
          success: false, 
          message: '.env.local.example missing',
          fix: 'Copy from backup or recreate'
        };
      }

      const envExample = readFileSync('.env.local.example', 'utf8');
      const requiredVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'OPENAI_API_KEY'
      ];

      const missingVars = requiredVars.filter(v => !envExample.includes(v));
      
      if (missingVars.length > 0) {
        return {
          success: false,
          message: `Missing env vars: ${missingVars.join(', ')}`,
          fix: 'Update .env.local.example'
        };
      }

      return { success: true, message: 'Environment configuration complete' };
    });
  }

  async checkSupabaseConnection() {
    return this.runCheck('Supabase Integration', () => {
      try {
        if (!existsSync('src/integrations/supabase/client.ts')) {
          return {
            success: false,
            message: 'Supabase client missing',
            fix: 'Regenerate Supabase integration'
          };
        }

        if (!existsSync('supabase/config.toml')) {
          return {
            success: false,
            message: 'Supabase config missing',
            fix: 'Run supabase init'
          };
        }

        return { success: true, message: 'Supabase integration active' };
      } catch (error) {
        return {
          success: false,
          message: `Supabase check failed: ${error.message}`,
          fix: 'Review Supabase setup'
        };
      }
    });
  }

  async checkAIServices() {
    return this.runCheck('AI Services Status', () => {
      const aiServices = [
        'src/services/aiListingService.ts',
        'src/services/aiDuplicateDetection.ts',
        'src/services/intelligentTranslation.ts',
        'src/services/mediaIntelligenceService.ts'
      ];

      const missingServices = aiServices.filter(service => !existsSync(service));
      
      if (missingServices.length > 0) {
        return {
          success: false,
          message: `Missing AI services: ${missingServices.length}/${aiServices.length}`,
          fix: 'Restore AI service files'
        };
      }

      return { success: true, message: `All ${aiServices.length} AI services present` };
    });
  }

  async checkEdgeFunctions() {
    return this.runCheck('Supabase Edge Functions', () => {
      if (!existsSync('supabase/functions')) {
        return {
          success: false,
          message: 'Edge functions directory missing',
          fix: 'Restore supabase/functions directory'
        };
      }

      const functions = [
        'auto-translate',
        'generate-property-description', 
        'ai-duplicate-detection',
        'ai-image-categorization'
      ];

      const existingFunctions = functions.filter(fn => 
        existsSync(`supabase/functions/${fn}/index.ts`)
      );

      if (existingFunctions.length < functions.length) {
        return {
          success: false,
          message: `${existingFunctions.length}/${functions.length} edge functions present`,
          fix: 'Restore missing edge functions'
        };
      }

      return { success: true, message: `All ${functions.length} edge functions present` };
    });
  }

  async checkBuildConfiguration() {
    return this.runCheck('Build Configuration', () => {
      try {
        // Test build
        execSync('npm run build 2>&1', { encoding: 'utf8', timeout: 60000 });
        return { success: true, message: 'Build successful' };
      } catch (error) {
        if (error.message.includes('terser')) {
          return {
            success: false,
            message: 'Terser dependency issue detected',
            fix: 'Switch to esbuild minification'
          };
        }
        return {
          success: false,
          message: `Build failed: ${error.message.slice(0, 100)}...`,
          fix: 'Review build errors'
        };
      }
    });
  }

  async checkImportExports() {
    return this.runCheck('Import/Export Issues', () => {
      try {
        if (existsSync('src/App.tsx')) {
          const appContent = readFileSync('src/App.tsx', 'utf8');
          
          // Check for problematic imports
          if (appContent.includes('import { AdminPromptManager }')) {
            return {
              success: false,
              message: 'AdminPromptManager import issue detected',
              fix: 'Change to default import'
            };
          }
        }

        return { success: true, message: 'No import/export issues detected' };
      } catch (error) {
        return {
          success: false,
          message: `Import check failed: ${error.message}`,
          fix: 'Review import statements'
        };
      }
    });
  }

  async runAutomaticFixes() {
    this.log('\n🔧 Running Automatic Fixes...', YELLOW);

    // Fix 1: AdminPromptManager import
    if (existsSync('src/App.tsx')) {
      const appContent = readFileSync('src/App.tsx', 'utf8');
      if (appContent.includes('import { AdminPromptManager }')) {
        const fixed = appContent.replace(
          /import \{ AdminPromptManager \}/g,
          'import AdminPromptManager'
        );
        writeFileSync('src/App.tsx', fixed);
        this.fixes.push('Fixed AdminPromptManager import in App.tsx');
      }
    }

    // Fix 2: Vite config terser issue
    if (existsSync('vite.config.ts')) {
      const viteContent = readFileSync('vite.config.ts', 'utf8');
      if (viteContent.includes("minify: 'terser'")) {
        const fixed = viteContent.replace(
          /minify: 'terser'/g,
          "minify: 'esbuild'"
        );
        writeFileSync('vite.config.ts', fixed);
        this.fixes.push('Fixed vite.config.ts minification to use esbuild');
      }
    }

    this.log(`✅ Applied ${this.fixes.length} automatic fixes`, GREEN);
  }

  async generateReport() {
    const report = `
# 🔧 System Repair Report - ${new Date().toISOString()}

## ✅ Status Summary
- **Errors Found:** ${this.errors.length}
- **Automatic Fixes Applied:** ${this.fixes.length}
- **Warnings:** ${this.warnings.length}

## 🔍 Detailed Results

### Errors
${this.errors.map(e => `- **${e.name}:** ${e.message}${e.fix ? ` (Fix: ${e.fix})` : ''}`).join('\n')}

### Applied Fixes
${this.fixes.map(f => `- ${f}`).join('\n')}

## 🚀 Next Steps
${this.errors.length === 0 ? 
  '✅ System is healthy! No manual intervention required.' :
  '❌ Manual fixes required for remaining errors.'
}

---
*Generated by system-repair.js*
`;

    writeFileSync('SYSTEM_REPAIR_REPORT.md', report);
    this.log('\n📄 Report saved to SYSTEM_REPAIR_REPORT.md', BLUE);
  }

  async run() {
    this.log('🔧 Starting System Repair & Diagnostic...', BLUE);
    this.log('=====================================\n', BLUE);

    // Run all checks
    await this.repairPackageJson();
    await this.checkEnvironment();
    await this.checkSupabaseConnection();
    await this.checkAIServices();
    await this.checkEdgeFunctions();
    await this.checkImportExports();
    await this.checkBuildConfiguration();

    // Apply automatic fixes
    await this.runAutomaticFixes();

    // Generate report
    await this.generateReport();

    // Final summary
    this.log('\n=====================================', BLUE);
    this.log('🎯 REPAIR SUMMARY', BLUE);
    this.log('=====================================', BLUE);
    
    if (this.errors.length === 0) {
      this.log('✅ SYSTEM HEALTHY - No issues found!', GREEN);
    } else {
      this.log(`❌ ${this.errors.length} issues require attention`, RED);
      this.log(`✅ ${this.fixes.length} issues fixed automatically`, GREEN);
    }

    this.log('\n🚀 Next: Run `npm run dev` to start development', BLUE);
  }
}

// Run the repair tool
const repair = new SystemRepair();
repair.run().catch(console.error);