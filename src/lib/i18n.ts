import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      "nav.dashboard": "Dashboard",
      "nav.properties": "Properties", 
      "nav.add_property": "Add Property",
      "nav.ai_tools": "AI Tools",
      "nav.media": "Media",
      "nav.analytics": "Analytics",
      "nav.duplicates": "Duplicates",
      "nav.error_monitoring": "Error Monitor",
      "nav.settings": "Settings",
      
      // Common
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.delete": "Delete",
      "common.edit": "Edit",
      "common.loading": "Loading...",
      "common.error": "Error",
      "common.success": "Success",
      
      // Properties
      "properties.title": "My Properties",
      "properties.add_new": "Add New Property",
      "properties.total": "Total Properties",
      "properties.active": "Active",
      "properties.draft": "Draft",
      
      // Dashboard
      "dashboard.welcome": "Welcome to Leasy",
      "dashboard.overview": "Overview",
      "dashboard.recent_activity": "Recent Activity",
      
      // Language
      "language.english": "🇬🇧 English",
      "language.german": "🇩🇪 Deutsch",
      "language.changed": "Language changed successfully",
      
      // Error Monitoring
      "error_monitor.title": "Error Monitoring",
      "error_monitor.auto_fix": "Auto-Fix",
      "error_monitor.manual_scan": "Manual Scan",
      "error_monitor.total_errors": "Total Errors",
      "error_monitor.auto_fixed": "Auto-Fixed",
      "error_monitor.critical_issues": "Critical Issues"
    }
  },
  de: {
    translation: {
      // Navigation
      "nav.dashboard": "Dashboard",
      "nav.properties": "Immobilien",
      "nav.add_property": "Immobilie hinzufügen",
      "nav.ai_tools": "KI-Tools",
      "nav.media": "Medien",
      "nav.analytics": "Analytics",
      "nav.duplicates": "Duplikate",
      "nav.error_monitoring": "Fehler-Monitor",
      "nav.settings": "Einstellungen",
      
      // Common
      "common.save": "Speichern",
      "common.cancel": "Abbrechen",
      "common.delete": "Löschen",
      "common.edit": "Bearbeiten",
      "common.loading": "Lädt...",
      "common.error": "Fehler",
      "common.success": "Erfolgreich",
      
      // Properties
      "properties.title": "Meine Immobilien",
      "properties.add_new": "Neue Immobilie hinzufügen",
      "properties.total": "Immobilien gesamt",
      "properties.active": "Aktiv",
      "properties.draft": "Entwurf",
      
      // Dashboard
      "dashboard.welcome": "Willkommen bei Leasy",
      "dashboard.overview": "Übersicht",
      "dashboard.recent_activity": "Letzte Aktivitäten",
      
      // Language
      "language.english": "🇬🇧 English",
      "language.german": "🇩🇪 Deutsch",
      "language.changed": "Sprache erfolgreich geändert",
      
      // Error Monitoring
      "error_monitor.title": "Fehler-Überwachung",
      "error_monitor.auto_fix": "Auto-Reparatur",
      "error_monitor.manual_scan": "Manueller Scan",
      "error_monitor.total_errors": "Fehler gesamt",
      "error_monitor.auto_fixed": "Auto-Repariert",
      "error_monitor.critical_issues": "Kritische Probleme"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false // React already does escaping
    },
    
    // Cache user's language preference
    saveMissing: true,
    saveMissingTo: 'current'
  });

export default i18n;