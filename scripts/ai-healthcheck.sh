#!/bin/bash

# 🤖 AI-Healthcheck Script für Leasy Renewal Core
# Automatisierte Überprüfung aller AI-Module und Services

echo "🤖 AI-Healthcheck für Leasy Renewal Core wird gestartet..."
echo "=================================================="

# Farben für bessere Lesbarkeit
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

check_service() {
    local service_name="$1"
    local file_path="$2"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✅ $service_name${NC} - AKTIV"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ $service_name${NC} - FEHLT"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

check_edge_function() {
    local function_name="$1"
    local file_path="supabase/functions/$function_name/index.ts"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ -f "$file_path" ]; then
        # Prüfe auf OpenAI API Integration
        if grep -q "OPENAI_API_KEY" "$file_path"; then
            echo -e "${GREEN}✅ Edge Function: $function_name${NC} - AKTIV (mit AI)"
        else
            echo -e "${YELLOW}⚠️  Edge Function: $function_name${NC} - AKTIV (ohne AI)"
        fi
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌ Edge Function: $function_name${NC} - FEHLT"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

echo -e "${BLUE}📊 1. AI-Services Überprüfung${NC}"
echo "================================"

# Core AI Services
check_service "aiListingService" "src/services/aiListingService.ts"
check_service "aiBulkOptimization" "src/services/aiBulkOptimization.ts"
check_service "aiDuplicateDetection" "src/services/aiDuplicateDetection.ts"
check_service "mediaIntelligenceService" "src/services/mediaIntelligenceService.ts"
check_service "intelligentTranslation" "src/services/intelligentTranslation.ts"

echo ""
echo -e "${BLUE}🎯 2. AI-Komponenten Überprüfung${NC}"
echo "==================================="

# AI UI Components
check_service "AIBulkDescriptionGenerator" "src/components/AIBulkDescriptionGenerator.tsx"
check_service "AIDescriptionModal" "src/components/AIDescriptionModal.tsx"
check_service "AIDraftValidator" "src/components/AIDraftValidator.tsx"
check_service "AIFieldAssistant" "src/components/AIFieldAssistant.tsx"
check_service "AILanguageSelector" "src/components/AILanguageSelector.tsx"
check_service "AIMediaAltTextGenerator" "src/components/AIMediaAltTextGenerator.tsx"
check_service "AIModelTrainer" "src/components/AIModelTrainer.tsx"
check_service "AIPropertyPreview" "src/components/AIPropertyPreview.tsx"
check_service "AISmartTitleGenerator" "src/components/AISmartTitleGenerator.tsx"
check_service "AITranslationManager" "src/components/AITranslationManager.tsx"
check_service "AdminPromptManager" "src/components/AdminPromptManager.tsx"
check_service "MediaIntelligenceEngine" "src/components/MediaIntelligenceEngine.tsx"

echo ""
echo -e "${BLUE}⚡ 3. Supabase Edge Functions${NC}"
echo "==============================="

# Edge Functions
check_edge_function "admin-prompts"
check_edge_function "ai-duplicate-detection"
check_edge_function "ai-image-categorization"
check_edge_function "auto-translate"
check_edge_function "categorize-image"
check_edge_function "cleanup-duplicates"
check_edge_function "detect-duplicates"
check_edge_function "generate-property-description"
check_edge_function "global-duplicate-scan"
check_edge_function "process-bulk-media"
check_edge_function "process-bulk-optimization"
check_edge_function "train-image-classifier"

echo ""
echo -e "${BLUE}🔧 4. Konfiguration Überprüfung${NC}"
echo "===================================="

# Environment Configuration
TOTAL_CHECKS=$((TOTAL_CHECKS + 3))
if [ -f ".env.local.example" ]; then
    echo -e "${GREEN}✅ .env.local.example${NC} - VORHANDEN"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    
    if grep -q "OPENAI_API_KEY" ".env.local.example"; then
        echo -e "${GREEN}  └─ OpenAI API Key Konfiguration${NC} - VORHANDEN"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}  └─ OpenAI API Key Konfiguration${NC} - FEHLT"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
else
    echo -e "${RED}❌ .env.local.example${NC} - FEHLT"
    FAILED_CHECKS=$((FAILED_CHECKS + 2))
fi

# Supabase Config
if [ -f "supabase/config.toml" ]; then
    echo -e "${GREEN}✅ Supabase Konfiguration${NC} - VORHANDEN"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ Supabase Konfiguration${NC} - FEHLT"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi

echo ""
echo -e "${BLUE}📦 5. Dependencies Überprüfung${NC}"
echo "=================================="

# Check package.json for AI-related dependencies
TOTAL_CHECKS=$((TOTAL_CHECKS + 4))
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json${NC} - VORHANDEN"
    
    # Check for key dependencies
    if grep -q "react-error-boundary" "package.json"; then
        echo -e "${GREEN}  └─ react-error-boundary${NC} - INSTALLIERT"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}  └─ react-error-boundary${NC} - FEHLT"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    
    if grep -q "@supabase/supabase-js" "package.json"; then
        echo -e "${GREEN}  └─ @supabase/supabase-js${NC} - INSTALLIERT"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}  └─ @supabase/supabase-js${NC} - FEHLT"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    
    if grep -q "zod" "package.json"; then
        echo -e "${GREEN}  └─ zod (Validation)${NC} - INSTALLIERT"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}  └─ zod (Validation)${NC} - FEHLT"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    echo -e "${RED}❌ package.json${NC} - FEHLT"
    FAILED_CHECKS=$((FAILED_CHECKS + 4))
fi

echo ""
echo -e "${BLUE}🎛️ 6. App Integration Prüfung${NC}"
echo "================================="

# Check App.tsx for AI routes
TOTAL_CHECKS=$((TOTAL_CHECKS + 2))
if [ -f "src/App.tsx" ]; then
    echo -e "${GREEN}✅ src/App.tsx${NC} - VORHANDEN"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    
    if grep -q "AdminPromptManager" "src/App.tsx"; then
        echo -e "${GREEN}  └─ AI-Routen Integration${NC} - KONFIGURIERT"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}  └─ AI-Routen Integration${NC} - FEHLT"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
else
    echo -e "${RED}❌ src/App.tsx${NC} - FEHLT"
    FAILED_CHECKS=$((FAILED_CHECKS + 2))
fi

echo ""
echo "=================================================="
echo -e "${BLUE}📊 AI-HEALTHCHECK ERGEBNIS${NC}"
echo "=================================================="

# Berechne Prozentsatz
SUCCESS_RATE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))

echo -e "📈 Gesamt-Checks: ${BLUE}$TOTAL_CHECKS${NC}"
echo -e "✅ Erfolgreich: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "❌ Fehlgeschlagen: ${RED}$FAILED_CHECKS${NC}"
echo -e "📊 Erfolgsrate: ${BLUE}$SUCCESS_RATE%${NC}"

echo ""
if [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "${GREEN}🎉 HERVORRAGEND!${NC} AI-System ist vollständig einsatzbereit!"
    echo -e "${GREEN}🚀 Alle kritischen AI-Module sind aktiv und funktionsfähig.${NC}"
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${YELLOW}⚠️  GUT!${NC} AI-System ist größtenteils funktionsfähig."
    echo -e "${YELLOW}🔧 Einige kleinere Probleme sollten behoben werden.${NC}"
elif [ $SUCCESS_RATE -ge 60 ]; then
    echo -e "${YELLOW}🔶 AKZEPTABEL!${NC} AI-System benötigt Aufmerksamkeit."
    echo -e "${YELLOW}⚡ Mehrere Komponenten müssen repariert werden.${NC}"
else
    echo -e "${RED}❗ KRITISCH!${NC} AI-System benötigt dringende Reparaturen!"
    echo -e "${RED}🆘 Viele kritische Komponenten fehlen oder sind fehlerhaft.${NC}"
fi

echo ""
echo -e "${BLUE}📋 NÄCHSTE SCHRITTE:${NC}"
if [ $FAILED_CHECKS -gt 0 ]; then
    echo "1. Fehlende Dateien und Komponenten hinzufügen"
    echo "2. Dependencies installieren: npm install"
    echo "3. Supabase Secrets konfigurieren (OPENAI_API_KEY)"
    echo "4. Edge Functions deployen: supabase functions deploy"
fi
echo "5. OpenAI API-Schlüssel in Supabase Dashboard einrichten"
echo "6. AI-Features testen und validieren"

echo ""
echo -e "${GREEN}✨ AI-Healthcheck abgeschlossen!${NC}"
echo "=================================================="

# Exit code basierend auf Erfolgsrate
if [ $SUCCESS_RATE -ge 80 ]; then
    exit 0
else
    exit 1
fi