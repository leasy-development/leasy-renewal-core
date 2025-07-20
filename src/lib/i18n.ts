import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enCommon from '@/locales/en/common.json';
import deCommon from '@/locales/de/common.json';

// Translation resources with proper namespace structure
const resources = {
  en: {
    common: enCommon
  },
  de: {
    common: deCommon
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    
    // Use namespaces for better organization
    defaultNS: 'common',
    ns: ['common'],
    
    interpolation: {
      escapeValue: false // React already does escaping
    },
    
    // Development features
    debug: false,
    
    // Cache and missing translations
    saveMissing: true,
    saveMissingTo: 'current',
    
    // React specific options
    react: {
      useSuspense: false
    }
  });

export default i18n;