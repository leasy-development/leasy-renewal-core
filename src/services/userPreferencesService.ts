import { supabase } from '@/integrations/supabase/client';

// Enhanced user preferences and dashboard personalization
export interface UserPreferences {
  id: string;
  user_id: string;
  dashboard_layout: {
    widgetOrder: string[];
    collapsedSections: string[];
    preferredView: 'grid' | 'list' | 'cards';
    showQuickActions: boolean;
    showRecentActivity: boolean;
  };
  frequently_used_features: Array<{
    featureId: string;
    featureName: string;
    usageCount: number;
    lastUsed: string;
  }>;
  last_used_features: Array<{
    featureId: string;
    featureName: string;
    timestamp: string;
  }>;
  feature_usage_count: Record<string, number>;
  ai_preferences: {
    preferredPromptStyle: 'professional' | 'casual' | 'detailed' | 'concise';
    autoTranslate: boolean;
    autoOptimize: boolean;
    saveAIHistory: boolean;
    preferredLanguages: string[];
  };
  ui_preferences: {
    theme: 'light' | 'dark' | 'system';
    compactMode: boolean;
    showTooltips: boolean;
    animationsEnabled: boolean;
    sidebarCollapsed: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface FeatureUsageStats {
  featureId: string;
  featureName: string;
  usageCount: number;
  lastUsed: string;
  category: 'property' | 'ai' | 'media' | 'sync' | 'admin';
}

class UserPreferencesService {
  // In-memory storage for fallback (TODO: Remove once migration is executed)
  private fallbackStorage = new Map<string, UserPreferences>();

  /**
   * Get user preferences, create default if not exists
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      // TODO: Remove fallback once migration is executed
      console.log('Getting user preferences (fallback):', userId);
      
      let preferences = this.fallbackStorage.get(userId);
      if (!preferences) {
        preferences = await this.createDefaultPreferences(userId);
      }
      
      return preferences;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  /**
   * Create default preferences for new user
   */
  async createDefaultPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const defaultPreferences: UserPreferences = {
        id: crypto.randomUUID(),
        user_id: userId,
        dashboard_layout: {
          widgetOrder: ['stats', 'quickActions', 'recentActivity', 'modules'],
          collapsedSections: [],
          preferredView: 'cards' as const,
          showQuickActions: true,
          showRecentActivity: true
        },
        frequently_used_features: [],
        last_used_features: [],
        feature_usage_count: {},
        ai_preferences: {
          preferredPromptStyle: 'professional' as const,
          autoTranslate: false,
          autoOptimize: true,
          saveAIHistory: true,
          preferredLanguages: ['de', 'en']
        },
        ui_preferences: {
          theme: 'system' as const,
          compactMode: false,
          showTooltips: true,
          animationsEnabled: true,
          sidebarCollapsed: false
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // TODO: Remove fallback once migration is executed
      this.fallbackStorage.set(userId, defaultPreferences);
      console.log('Created default preferences (fallback):', defaultPreferences);
      
      return defaultPreferences;
    } catch (error) {
      console.error('Error creating default preferences:', error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> {
    try {
      // TODO: Remove fallback once migration is executed
      const existing = this.fallbackStorage.get(userId);
      if (existing) {
        const updated = {
          ...existing,
          ...updates,
          updated_at: new Date().toISOString()
        };
        this.fallbackStorage.set(userId, updated);
        console.log('Updated user preferences (fallback):', updates);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(
    userId: string,
    featureId: string,
    featureName: string,
    category: 'property' | 'ai' | 'media' | 'sync' | 'admin' = 'property'
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences) return false;

      const now = new Date().toISOString();
      
      // Update usage count
      const newUsageCount = {
        ...preferences.feature_usage_count,
        [featureId]: (preferences.feature_usage_count[featureId] || 0) + 1
      };

      // Update last used features (keep last 10)
      const lastUsedFeatures = [
        { featureId, featureName, timestamp: now },
        ...preferences.last_used_features.filter(f => f.featureId !== featureId)
      ].slice(0, 10);

      // Update frequently used features
      const existingFrequent = preferences.frequently_used_features.find(f => f.featureId === featureId);
      let frequentlyUsedFeatures;

      if (existingFrequent) {
        frequentlyUsedFeatures = preferences.frequently_used_features.map(f =>
          f.featureId === featureId
            ? { ...f, usageCount: f.usageCount + 1, lastUsed: now }
            : f
        );
      } else {
        frequentlyUsedFeatures = [
          ...preferences.frequently_used_features,
          { featureId, featureName, usageCount: 1, lastUsed: now }
        ];
      }

      // Sort by usage count and keep top 10
      frequentlyUsedFeatures.sort((a, b) => b.usageCount - a.usageCount);
      frequentlyUsedFeatures = frequentlyUsedFeatures.slice(0, 10);

      const updates = {
        feature_usage_count: newUsageCount,
        last_used_features: lastUsedFeatures,
        frequently_used_features: frequentlyUsedFeatures
      };

      return await this.updateUserPreferences(userId, updates);
    } catch (error) {
      console.error('Error tracking feature usage:', error);
      return false;
    }
  }

  /**
   * Get frequently used features for quick access
   */
  async getFrequentlyUsedFeatures(userId: string, limit = 5): Promise<FeatureUsageStats[]> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences) return [];

      return preferences.frequently_used_features
        .slice(0, limit)
        .map(feature => ({
          featureId: feature.featureId,
          featureName: feature.featureName,
          usageCount: feature.usageCount,
          lastUsed: feature.lastUsed,
          category: this.categorizeFeature(feature.featureId)
        }));
    } catch (error) {
      console.error('Error getting frequently used features:', error);
      return [];
    }
  }

  /**
   * Get recently used features
   */
  async getRecentlyUsedFeatures(userId: string, limit = 5): Promise<FeatureUsageStats[]> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences) return [];

      return preferences.last_used_features
        .slice(0, limit)
        .map(feature => ({
          featureId: feature.featureId,
          featureName: feature.featureName,
          usageCount: preferences.feature_usage_count[feature.featureId] || 1,
          lastUsed: feature.timestamp,
          category: this.categorizeFeature(feature.featureId)
        }));
    } catch (error) {
      console.error('Error getting recently used features:', error);
      return [];
    }
  }

  /**
   * Update dashboard layout preferences
   */
  async updateDashboardLayout(
    userId: string,
    layoutUpdates: Partial<UserPreferences['dashboard_layout']>
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences) return false;

      const newDashboardLayout = {
        ...preferences.dashboard_layout,
        ...layoutUpdates
      };

      return await this.updateUserPreferences(userId, {
        dashboard_layout: newDashboardLayout
      });
    } catch (error) {
      console.error('Error updating dashboard layout:', error);
      return false;
    }
  }

  /**
   * Update AI preferences
   */
  async updateAIPreferences(
    userId: string,
    aiUpdates: Partial<UserPreferences['ai_preferences']>
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences) return false;

      const newAIPreferences = {
        ...preferences.ai_preferences,
        ...aiUpdates
      };

      return await this.updateUserPreferences(userId, {
        ai_preferences: newAIPreferences
      });
    } catch (error) {
      console.error('Error updating AI preferences:', error);
      return false;
    }
  }

  /**
   * Update UI preferences
   */
  async updateUIPreferences(
    userId: string,
    uiUpdates: Partial<UserPreferences['ui_preferences']>
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences) return false;

      const newUIPreferences = {
        ...preferences.ui_preferences,
        ...uiUpdates
      };

      return await this.updateUserPreferences(userId, {
        ui_preferences: newUIPreferences
      });
    } catch (error) {
      console.error('Error updating UI preferences:', error);
      return false;
    }
  }

  /**
   * Get personalized module recommendations
   */
  async getPersonalizedRecommendations(userId: string): Promise<{
    recommendedModules: string[];
    reason: string;
  }[]> {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!preferences) return [];

      const recommendations: { recommendedModules: string[]; reason: string }[] = [];
      const usageCount = preferences.feature_usage_count;

      // Analyze usage patterns and make recommendations
      if (usageCount['property-add'] && !usageCount['ai-description']) {
        recommendations.push({
          recommendedModules: ['ai-description', 'ai-title'],
          reason: 'Du erstellst häufig neue Immobilien - nutze AI-Tools zur Optimierung!'
        });
      }

      if (usageCount['media-upload'] && !usageCount['media-categorize']) {
        recommendations.push({
          recommendedModules: ['media-categorize', 'ai-alt-text'],
          reason: 'Verbessere deine Medien mit automatischer Kategorisierung!'
        });
      }

      if (usageCount['csv-import'] && !usageCount['duplicate-detection']) {
        recommendations.push({
          recommendedModules: ['duplicate-detection'],
          reason: 'Prüfe auf Duplikate nach dem CSV-Import!'
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  /**
   * Reset user preferences to defaults
   */
  async resetToDefaults(userId: string): Promise<boolean> {
    try {
      // TODO: Remove fallback once migration is executed
      this.fallbackStorage.delete(userId);
      await this.createDefaultPreferences(userId);
      console.log('Reset user preferences to defaults (fallback)');
      
      return true;
    } catch (error) {
      console.error('Error resetting user preferences:', error);
      return false;
    }
  }

  // Private helper methods
  private categorizeFeature(featureId: string): 'property' | 'ai' | 'media' | 'sync' | 'admin' {
    if (featureId.includes('ai-') || featureId.includes('prompt')) return 'ai';
    if (featureId.includes('media-') || featureId.includes('image')) return 'media';
    if (featureId.includes('sync') || featureId.includes('platform')) return 'sync';
    if (featureId.includes('admin-') || featureId.includes('duplicate')) return 'admin';
    return 'property';
  }
}

export const userPreferencesService = new UserPreferencesService();
