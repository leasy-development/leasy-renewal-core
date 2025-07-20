import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/lib/stores/userStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Globe, Check, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const LANGUAGE_OPTIONS = [
  { 
    value: 'en', 
    label: '🇬🇧 English', 
    nativeLabel: 'English',
    coverage: '100%'
  },
  { 
    value: 'de', 
    label: '🇩🇪 Deutsch', 
    nativeLabel: 'Deutsch',
    coverage: '100%'
  }
];

export function LanguageSettingsCard() {
  const { profile, updateLanguage, loadProfile, loading } = useUserStore();
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
      
      toast(t('messages.language_changed'), {
        description: LANGUAGE_OPTIONS.find(opt => opt.value === language)?.label,
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
  const currentLanguageOption = LANGUAGE_OPTIONS.find(opt => opt.value === currentLanguage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          {t('account.language_preference')}
        </CardTitle>
        <CardDescription>
          Choose your preferred language for the interface and AI-generated content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="language-select" className="text-sm font-medium">
            {t('language.select_language')}
          </Label>
          
          <Select 
            value={currentLanguage} 
            onValueChange={handleLanguageChange}
            disabled={loading}
          >
            <SelectTrigger id="language-select" className="w-full">
              <SelectValue placeholder={t('language.select_language')} />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span>{option.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {option.coverage}
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {currentLanguageOption && (
            <div className="text-sm text-muted-foreground">
              <strong>{t('language.current_language')}:</strong> {currentLanguageOption.nativeLabel}
            </div>
          )}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <div className="space-y-2">
              <p>
                <strong>Language affects:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Interface language (menus, buttons, labels)</li>
                <li>AI-generated content (descriptions, titles)</li>
                <li>Error messages and notifications</li>
                <li>Help text and tooltips</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Language Support Features:</p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span>Auto-translation for existing content</span>
                <Badge variant="outline" className="text-xs">Available</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>AI generation in selected language</span>
                <Badge variant="outline" className="text-xs">Available</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Real-time interface switching</span>
                <Badge variant="outline" className="text-xs">Available</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}