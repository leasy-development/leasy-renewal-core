import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/lib/stores/userStore';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Globe, Sparkles } from 'lucide-react';

interface AILanguageSelectorProps {
  value: 'en' | 'de' | 'auto';
  onChange: (language: 'en' | 'de' | 'auto') => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  showAutoOption?: boolean;
}

const LANGUAGE_OPTIONS = [
  { 
    value: 'auto' as const, 
    label: '✨ Auto (User Preference)', 
    icon: Sparkles 
  },
  { 
    value: 'en' as const, 
    label: '🇬🇧 English', 
    icon: Globe 
  },
  { 
    value: 'de' as const, 
    label: '🇩🇪 Deutsch', 
    icon: Globe 
  }
];

export function AILanguageSelector({ 
  value, 
  onChange, 
  disabled = false,
  label,
  description,
  showAutoOption = true
}: AILanguageSelectorProps) {
  const { t } = useTranslation('common');
  const { profile } = useUserStore();

  const availableOptions = showAutoOption 
    ? LANGUAGE_OPTIONS 
    : LANGUAGE_OPTIONS.filter(opt => opt.value !== 'auto');

  const getDisplayLabel = (optionValue: string) => {
    if (optionValue === 'auto' && profile?.preferred_language) {
      const userLangOption = LANGUAGE_OPTIONS.find(opt => opt.value === profile.preferred_language);
      return `✨ ${t('language.auto_detect')} (${userLangOption?.label || 'English'})`;
    }
    return LANGUAGE_OPTIONS.find(opt => opt.value === optionValue)?.label || optionValue;
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium flex items-center gap-2">
          <Globe className="h-4 w-4" />
          {label}
        </Label>
      )}
      
      <Select 
        value={value} 
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('ai.generation_language')} />
        </SelectTrigger>
        <SelectContent>
          {availableOptions.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{getDisplayLabel(option.value)}</span>
                  {option.value === 'auto' && (
                    <Badge variant="secondary" className="text-xs">
                      Smart
                    </Badge>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {value === 'auto' && profile?.preferred_language && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
          <span className="font-medium">Will generate in:</span> {getDisplayLabel(profile.preferred_language)}
        </div>
      )}
    </div>
  );
}