import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';
import { useUserStore } from '@/lib/stores/userStore';
import { toast } from 'sonner';

interface CompactLanguageToggleProps {
  className?: string;
}

export function CompactLanguageToggle({ className }: CompactLanguageToggleProps) {
  const { profile, updateLanguage } = useUserStore();
  const { i18n, t } = useTranslation('common');

  const handleLanguageChange = async (language: 'en' | 'de') => {
    try {
      await updateLanguage(language);
      await i18n.changeLanguage(language);
      toast(t('language.changed'), {
        description: language === 'en' ? '🇬🇧 English' : '🇩🇪 Deutsch',
        icon: <Check className="h-4 w-4" />
      });
    } catch (error) {
      toast.error(t('messages.error_occurred'));
    }
  };

  const currentLanguage = profile?.preferred_language || 'en';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleLanguageChange(currentLanguage === 'en' ? 'de' : 'en')}
      className={className}
    >
      <Globe className="h-4 w-4 mr-1" />
      {currentLanguage === 'en' ? 'EN' : 'DE'}
    </Button>
  );
}