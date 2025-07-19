import React from 'react';
import { supabase } from '@/integrations/supabase/client';

export class VersionService {
  private static readonly CURRENT_VERSION = '2025.07.19-23:59'; // This should be set during build
  private static readonly CHECK_INTERVAL = 60000; // 60 seconds
  
  private static intervalId: NodeJS.Timeout | null = null;
  private static onUpdateCallback: ((newVersion: string) => void) | null = null;

  /**
   * Start checking for version updates
   */
  static startVersionCheck(onUpdate: (newVersion: string) => void) {
    this.onUpdateCallback = onUpdate;
    
    // Initial check
    this.checkVersion();
    
    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.checkVersion();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Stop version checking
   */
  static stopVersionCheck() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.onUpdateCallback = null;
  }

  /**
   * Check if a new version is available
   */
  private static async checkVersion() {
    try {
      const { data, error } = await supabase
        .from('system_meta')
        .select('value')
        .eq('key', 'APP_VERSION')
        .single();

      if (error) {
        console.error('Error checking app version:', error);
        return;
      }

      if (data?.value && data.value !== this.CURRENT_VERSION) {
        console.log(`New version available: ${data.value} (current: ${this.CURRENT_VERSION})`);
        this.onUpdateCallback?.(data.value);
      }
    } catch (error) {
      console.error('Version check failed:', error);
    }
  }

  /**
   * Get current app version
   */
  static getCurrentVersion(): string {
    return this.CURRENT_VERSION;
  }

  /**
   * Refresh the application with cache busting
   */
  static refreshApp() {
    // Clear all caches first
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // Force reload with cache bypass
    window.location.reload();
  }

  /**
   * Check if service worker is available and update it
   */
  static async updateServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          
          // Check if there's a waiting service worker
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      } catch (error) {
        console.error('Service worker update failed:', error);
      }
    }
  }
}

/**
 * Hook for using version checking in React components
 */
export function useVersionCheck() {
  const [hasUpdate, setHasUpdate] = React.useState(false);
  const [newVersion, setNewVersion] = React.useState<string>('');

  React.useEffect(() => {
    const handleUpdate = (version: string) => {
      setNewVersion(version);
      setHasUpdate(true);
    };

    VersionService.startVersionCheck(handleUpdate);

    return () => {
      VersionService.stopVersionCheck();
    };
  }, []);

  const refreshApp = React.useCallback(() => {
    VersionService.refreshApp();
  }, []);

  const dismissUpdate = React.useCallback(() => {
    setHasUpdate(false);
  }, []);

  return {
    hasUpdate,
    newVersion,
    currentVersion: VersionService.getCurrentVersion(),
    refreshApp,
    dismissUpdate
  };
}