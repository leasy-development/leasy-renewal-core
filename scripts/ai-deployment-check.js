#!/usr/bin/env node

/**
 * AI System Production Deployment Script
 * Ensures all AI services are ready for production
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

console.log('🤖 AI System Production Deployment Check\n');

const checks = [];
let score = 0;
const maxScore = 100;

// 1. AI Services Availability (30 points)
console.log('🔍 Checking AI Services...');
const aiServices = [
  'src/services/aiListingService.ts',
  'src/services/aiBulkOptimization.ts', 
  'src/services/aiDuplicateDetection.ts',
  'src/services/mediaIntelligenceService.ts',
  'src/services/intelligentTranslation.ts'
];

let aiServiceScore = 0;
aiServices.forEach(service => {
  if (existsSync(service)) {
    aiServiceScore += 6;
    console.log(`  ✅ ${service}`);
  } else {
    console.log(`  ❌ ${service} - MISSING`);
  }
});
score += aiServiceScore;
checks.push({
  name: 'AI Services',
  score: aiServiceScore,
  maxScore: 30,
  status: aiServiceScore === 30 ? 'PASS' : 'FAIL'
});

// 2. Edge Functions (25 points)
console.log('\n⚡ Checking Edge Functions...');
const edgeFunctions = [
  'supabase/functions/generate-property-description/index.ts',
  'supabase/functions/ai-duplicate-detection/index.ts',
  'supabase/functions/ai-image-categorization/index.ts',
  'supabase/functions/auto-translate/index.ts',
  'supabase/functions/process-bulk-optimization/index.ts'
];

let edgeFunctionScore = 0;
edgeFunctions.forEach(func => {
  if (existsSync(func)) {
    edgeFunctionScore += 5;
    console.log(`  ✅ ${func}`);
    
    // Check for OpenAI integration
    const content = readFileSync(func, 'utf8');
    if (content.includes('OPENAI_API_KEY')) {
      console.log(`    🔗 OpenAI integration detected`);
    } else {
      console.log(`    ⚠️  No OpenAI integration found`);
    }
  } else {
    console.log(`  ❌ ${func} - MISSING`);
  }
});
score += edgeFunctionScore;
checks.push({
  name: 'Edge Functions', 
  score: edgeFunctionScore,
  maxScore: 25,
  status: edgeFunctionScore >= 20 ? 'PASS' : 'FAIL'
});

// 3. AI Components (20 points)
console.log('\n🎯 Checking AI Components...');
const aiComponents = [
  'src/components/AIBulkDescriptionGenerator.tsx',
  'src/components/AIDescriptionModal.tsx',
  'src/components/AdminPromptManager.tsx',
  'src/components/MediaIntelligenceEngine.tsx'
];

let componentScore = 0;
aiComponents.forEach(component => {
  if (existsSync(component)) {
    componentScore += 5;
    console.log(`  ✅ ${component}`);
  } else {
    console.log(`  ❌ ${component} - MISSING`);
  }
});
score += componentScore;
checks.push({
  name: 'AI Components',
  score: componentScore, 
  maxScore: 20,
  status: componentScore >= 15 ? 'PASS' : 'FAIL'
});

// 4. Configuration (15 points)
console.log('\n🔧 Checking Configuration...');
let configScore = 0;

// Check .env.local.example
if (existsSync('.env.local.example')) {
  const envContent = readFileSync('.env.local.example', 'utf8');
  if (envContent.includes('OPENAI_API_KEY')) {
    configScore += 5;
    console.log('  ✅ .env.local.example with OpenAI config');
  } else {
    console.log('  ❌ .env.local.example missing OpenAI config');
  }
} else {
  console.log('  ❌ .env.local.example missing');
}

// Check Supabase config
if (existsSync('supabase/config.toml')) {
  configScore += 5;
  console.log('  ✅ supabase/config.toml');
} else {
  console.log('  ❌ supabase/config.toml missing');
}

// Check App.tsx for AI routes
if (existsSync('src/App.tsx')) {
  const appContent = readFileSync('src/App.tsx', 'utf8');
  if (appContent.includes('AdminPromptManager') && appContent.includes('/ai-tools')) {
    configScore += 5;
    console.log('  ✅ AI routes configured in App.tsx');
  } else {
    console.log('  ❌ AI routes missing in App.tsx');
  }
} else {
  console.log('  ❌ src/App.tsx missing');
}

score += configScore;
checks.push({
  name: 'Configuration',
  score: configScore,
  maxScore: 15, 
  status: configScore >= 10 ? 'PASS' : 'FAIL'
});

// 5. Dependencies (10 points)
console.log('\n📦 Checking Dependencies...');
let depScore = 0;

if (existsSync('package.json')) {
  const packageContent = readFileSync('package.json', 'utf8');
  const packageJson = JSON.parse(packageContent);
  
  const requiredDeps = [
    'react-error-boundary',
    '@supabase/supabase-js', 
    'zod'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      depScore += 3.33;
      console.log(`  ✅ ${dep}`);
    } else {
      console.log(`  ❌ ${dep} - MISSING`);
    }
  });
} else {
  console.log('  ❌ package.json missing');
}

score += Math.round(depScore);
checks.push({
  name: 'Dependencies',
  score: Math.round(depScore),
  maxScore: 10,
  status: depScore >= 8 ? 'PASS' : 'FAIL'
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('🏆 AI DEPLOYMENT READINESS REPORT');
console.log('='.repeat(50));

checks.forEach(check => {
  const percentage = Math.round((check.score / check.maxScore) * 100);
  const status = check.status === 'PASS' ? '✅' : '❌';
  console.log(`${status} ${check.name}: ${check.score}/${check.maxScore} (${percentage}%)`);
});

const overallPercentage = Math.round((score / maxScore) * 100);
console.log(`\n📊 Overall Score: ${score}/${maxScore} (${overallPercentage}%)`);

if (overallPercentage >= 90) {
  console.log('\n🎉 EXCELLENT! AI system is production-ready!');
  console.log('🚀 All critical components are available and configured.');
  console.log('\nNext steps:');
  console.log('1. Set OpenAI API key in Supabase secrets');
  console.log('2. Deploy edge functions: supabase functions deploy');
  console.log('3. Test AI features in production environment');
} else if (overallPercentage >= 75) {
  console.log('\n⚠️ GOOD! AI system is mostly ready for production.');
  console.log('🔧 Some minor issues should be addressed first.');
} else if (overallPercentage >= 50) {
  console.log('\n🔶 NEEDS WORK! AI system requires attention before production.');
  console.log('⚡ Several components need to be fixed or added.');
} else {
  console.log('\n❗ CRITICAL! AI system is not ready for production!');
  console.log('🆘 Major components are missing or misconfigured.');
}

console.log('\n🤖 AI deployment check completed!');
console.log('='.repeat(50));

// Exit with appropriate code
process.exit(overallPercentage >= 75 ? 0 : 1);