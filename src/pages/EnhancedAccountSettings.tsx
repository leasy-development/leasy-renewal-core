import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  User,
  Bell,
  Shield,
  Palette,
  Brain,
  Zap,
  Monitor,
  Moon,
  Sun,
  Settings,
  Save,
  RefreshCw,
  Globe,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from 'next-themes';
import { userPreferencesService } from '@/services/userPreferencesService';

const AccountSettings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // User Profile State
  const [profile, setProfile] = useState({
    displayName: user?.email?.split('@')[0] || '',
    email: user?.email || '',
    company: '',
    phone: '',
    bio: ''
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    pushNotifications: true,
    aiSuggestions: true,
    syncAlerts: true,
    weeklyReports: false,
    marketingEmails: false
  });

  // AI Preferences
  const [aiPreferences, setAiPreferences] = useState({
    promptStyle: 'professional' as 'professional' | 'casual' | 'detailed' | 'concise',
    autoTranslate: false,
    autoOptimize: true,
    saveHistory: true,
    preferredLanguages: ['de', 'en'],
    aiConfidenceThreshold: 80
  });

  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'team' as 'public' | 'team' | 'private',
    shareAnalytics: true,
    allowTelemetry: true,
    dataRetention: '1year' as '3months' | '1year' | '2years' | 'indefinite'
  });

  const [apiSettings, setApiSettings] = useState({
    openaiKey: '',
    customEndpoints: false,
    rateLimiting: true
  });

  useEffect(() => {
    loadUserPreferences();
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user?.id) return;
    
    try {
      const preferences = await userPreferencesService.getUserPreferences(user.id);
      if (preferences) {
        setAiPreferences({
          ...aiPreferences,
          ...preferences.ai_preferences,
          aiConfidenceThreshold: 80 // Add new field with default
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const saveSettings = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Save AI preferences
      await userPreferencesService.updateAIPreferences(user.id, {
        preferredPromptStyle: aiPreferences.promptStyle,
        autoTranslate: aiPreferences.autoTranslate,
        autoOptimize: aiPreferences.autoOptimize,
        saveAIHistory: aiPreferences.saveHistory,
        preferredLanguages: aiPreferences.preferredLanguages
      });

      // Save UI preferences (theme)
      await userPreferencesService.updateUIPreferences(user.id, {
        theme: theme as 'light' | 'dark' | 'system'
      });

      toast.success('Einstellungen erfolgreich gespeichert!');
      setHasChanges(false);
    } catch (error) {
      toast.error('Fehler beim Speichern der Einstellungen');
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const SettingsSection: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ title, description, icon, children }) => (
    <Card className="hover-lift transition-all duration-300">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            {icon}
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );

  const ToggleSetting: React.FC<{
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    icon?: React.ReactNode;
  }> = ({ label, description, checked, onChange, icon }) => (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div>
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={(value) => {
          onChange(value);
          setHasChanges(true);
        }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Account Einstellungen
              </h1>
              <p className="text-lg text-muted-foreground">
                Personalisiere dein Leasy-Erlebnis und konfiguriere alle System-Einstellungen
              </p>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Ungespeicherte Änderungen
                </Badge>
              )}
              <Button 
                onClick={saveSettings} 
                disabled={isLoading || !hasChanges}
                className="bg-gradient-primary hover:shadow-elegant"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Speichern
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex h-12 p-1 bg-muted/30 rounded-lg">
            <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-background">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Benachrichtigungen</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">KI-Einstellungen</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Darstellung</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privatsphäre</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-8">
            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <SettingsSection
                title="Profil-Informationen"
                description="Verwalte deine persönlichen Daten und Account-Details"
                icon={<User className="h-5 w-5 text-primary" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Anzeigename</label>
                    <Input 
                      value={profile.displayName}
                      onChange={(e) => {
                        setProfile({ ...profile, displayName: e.target.value });
                        setHasChanges(true);
                      }}
                      placeholder="Ihr Anzeigename"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">E-Mail</label>
                    <Input 
                      value={profile.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unternehmen</label>
                    <Input 
                      value={profile.company}
                      onChange={(e) => {
                        setProfile({ ...profile, company: e.target.value });
                        setHasChanges(true);
                      }}
                      placeholder="Ihr Unternehmen"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telefon</label>
                    <Input 
                      value={profile.phone}
                      onChange={(e) => {
                        setProfile({ ...profile, phone: e.target.value });
                        setHasChanges(true);
                      }}
                      placeholder="+49 123 456789"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Bio</label>
                    <Textarea 
                      value={profile.bio}
                      onChange={(e) => {
                        setProfile({ ...profile, bio: e.target.value });
                        setHasChanges(true);
                      }}
                      placeholder="Erzählen Sie etwas über sich..."
                      rows={3}
                    />
                  </div>
                </div>
              </SettingsSection>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <SettingsSection
                title="Benachrichtigungen"
                description="Konfiguriere, wann und wie du Benachrichtigungen erhältst"
                icon={<Bell className="h-5 w-5 text-primary" />}
              >
                <div className="space-y-2">
                  <ToggleSetting
                    label="E-Mail Updates"
                    description="Erhalte wichtige Updates per E-Mail"
                    checked={notifications.emailUpdates}
                    onChange={(checked) => setNotifications({ ...notifications, emailUpdates: checked })}
                    icon={<Globe className="h-4 w-4" />}
                  />
                  <ToggleSetting
                    label="AI-Vorschläge"
                    description="Benachrichtigungen über KI-Optimierungsvorschläge"
                    checked={notifications.aiSuggestions}
                    onChange={(checked) => setNotifications({ ...notifications, aiSuggestions: checked })}
                    icon={<Brain className="h-4 w-4" />}
                  />
                  <ToggleSetting
                    label="Sync-Warnungen"
                    description="Werde über Synchronisations-Probleme informiert"
                    checked={notifications.syncAlerts}
                    onChange={(checked) => setNotifications({ ...notifications, syncAlerts: checked })}
                    icon={<RefreshCw className="h-4 w-4" />}
                  />
                  <ToggleSetting
                    label="Wöchentliche Berichte"
                    description="Erhalte wöchentliche Zusammenfassungen deiner Aktivitäten"
                    checked={notifications.weeklyReports}
                    onChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
                  />
                </div>
              </SettingsSection>
            </TabsContent>

            {/* AI Settings */}
            <TabsContent value="ai" className="space-y-6">
              <SettingsSection
                title="KI-Konfiguration"
                description="Personalisiere das Verhalten der KI-Tools nach deinen Präferenzen"
                icon={<Brain className="h-5 w-5 text-blue-600" />}
              >
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Prompt-Stil</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(['professional', 'casual', 'detailed', 'concise'] as const).map((style) => (
                        <Button
                          key={style}
                          variant={aiPreferences.promptStyle === style ? 'default' : 'outline'}
                          onClick={() => {
                            setAiPreferences({ ...aiPreferences, promptStyle: style });
                            setHasChanges(true);
                          }}
                          className="justify-start"
                        >
                          {style === 'professional' && '💼 Professionell'}
                          {style === 'casual' && '😊 Locker'}
                          {style === 'detailed' && '📋 Detailliert'}
                          {style === 'concise' && '⚡ Prägnant'}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <ToggleSetting
                      label="Auto-Übersetzung"
                      description="Übersetze Inhalte automatisch in bevorzugte Sprachen"
                      checked={aiPreferences.autoTranslate}
                      onChange={(checked) => setAiPreferences({ ...aiPreferences, autoTranslate: checked })}
                      icon={<Globe className="h-4 w-4" />}
                    />
                    <ToggleSetting
                      label="Auto-Optimierung"
                      description="Erlaube automatische Verbesserungen von Texten"
                      checked={aiPreferences.autoOptimize}
                      onChange={(checked) => setAiPreferences({ ...aiPreferences, autoOptimize: checked })}
                      icon={<Zap className="h-4 w-4" />}
                    />
                    <ToggleSetting
                      label="KI-Verlauf speichern"
                      description="Behalte einen Verlauf aller KI-Interaktionen"
                      checked={aiPreferences.saveHistory}
                      onChange={(checked) => setAiPreferences({ ...aiPreferences, saveHistory: checked })}
                      icon={<Settings className="h-4 w-4" />}
                    />
                  </div>
                </div>
              </SettingsSection>
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance" className="space-y-6">
              <SettingsSection
                title="Darstellung & Theme"
                description="Passe das Aussehen der Anwendung an deine Präferenzen an"
                icon={<Palette className="h-5 w-5 text-primary" />}
              >
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Theme auswählen</label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        onClick={() => {
                          setTheme('light');
                          setHasChanges(true);
                        }}
                        className="flex flex-col gap-2 h-auto p-4"
                      >
                        <Sun className="h-5 w-5" />
                        Hell
                      </Button>
                      <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        onClick={() => {
                          setTheme('dark');
                          setHasChanges(true);
                        }}
                        className="flex flex-col gap-2 h-auto p-4"
                      >
                        <Moon className="h-5 w-5" />
                        Dunkel
                      </Button>
                      <Button
                        variant={theme === 'system' ? 'default' : 'outline'}
                        onClick={() => {
                          setTheme('system');
                          setHasChanges(true);
                        }}
                        className="flex flex-col gap-2 h-auto p-4"
                      >
                        <Monitor className="h-5 w-5" />
                        System
                      </Button>
                    </div>
                  </div>
                </div>
              </SettingsSection>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy" className="space-y-6">
              <SettingsSection
                title="Privatsphäre & Sicherheit"
                description="Kontrolliere deine Datenschutz-Einstellungen und Account-Sicherheit"
                icon={<Shield className="h-5 w-5 text-primary" />}
              >
                <div className="space-y-4">
                  <ToggleSetting
                    label="Anonyme Analytics"
                    description="Helfe bei der Verbesserung durch anonyme Nutzungsdaten"
                    checked={privacy.shareAnalytics}
                    onChange={(checked) => setPrivacy({ ...privacy, shareAnalytics: checked })}
                    icon={<CheckCircle className="h-4 w-4" />}
                  />
                  <ToggleSetting
                    label="Telemetrie-Daten"
                    description="Sende technische Daten zur Performance-Optimierung"
                    checked={privacy.allowTelemetry}
                    onChange={(checked) => setPrivacy({ ...privacy, allowTelemetry: checked })}
                  />
                  
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">API-Schlüssel Verwaltung</p>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">OpenAI API Key</label>
                        <div className="flex gap-2">
                          <Input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiSettings.openaiKey}
                            onChange={(e) => {
                              setApiSettings({ ...apiSettings, openaiKey: e.target.value });
                              setHasChanges(true);
                            }}
                            placeholder="sk-..."
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SettingsSection>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AccountSettings;