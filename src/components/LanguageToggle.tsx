import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/lib/stores/userStore';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Globe, Check } from 'lucide-react';

export function LanguageToggle() {
  const { profile, updateLanguage, loadProfile } = useUserStore();
  const { i18n, t } = useTranslation('common');

  // Load profile on mount
  useEffect(() => {
    if (!profile) {
      loadProfile();
    }
  }, [profile, loadProfile]);

  // Sync i18n with profile language
  useEffect(() => {
    if (profile?.preferred_language && i18n.language !== profile.preferred_language) {
      i18n.changeLanguage(profile.preferred_language);
    }
  }, [profile?.preferred_language, i18n]);

  const handleLanguageChange = async (language: 'en' | 'de') => {
    try {
      // Update the language in the store and database
      await updateLanguage(language);
      
      // Update i18n immediately
      await i18n.changeLanguage(language);
      
      toast(t('language.changed'), {
        description: language === 'en' ? '🇬🇧 English' : '🇩🇪 Deutsch',
        icon: <Check className="h-4 w-4" />
      });
    } catch (error) {
      console.error('Error changing language:', error);
      toast.error(t('messages.error_occurred'), {
        description: t('messages.network_error')
      });
    }
  };

  const currentLanguage = profile?.preferred_language || 'en';

  return (
    <Select value={currentLanguage} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[140px]">
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">
          {t('language.english')}
        </SelectItem>
        <SelectItem value="de">
          {t('language.german')}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}