/**
 * Cache Management System
 * Handles browser cache, service worker management, and error recovery
 */

interface CacheConfig {
  version: string;
  maxRetries: number;
  retryDelay: number;
  cooldownPeriod: number; // Minimum time between recovery attempts
  userConsentRequired: boolean;
}

interface RecoveryAttempt {
  timestamp: number;
  reason: string;
  success: boolean;
}

class CacheManager {
  private config: CacheConfig;
  private retryCount = 0;
  private lastRecoveryAttempt = 0;
  private recoveryHistory: RecoveryAttempt[] = [];
  private userNotificationShown = false;

  constructor(config: CacheConfig) {
    this.config = config;
    this.loadRecoveryHistory();
  }

  /**
   * Load recovery history from localStorage
   */
  private loadRecoveryHistory(): void {
    try {
      const stored = localStorage.getItem('cache-recovery-history');
      if (stored) {
        this.recoveryHistory = JSON.parse(stored);
        // Keep only recent attempts (last 24 hours)
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.recoveryHistory = this.recoveryHistory.filter(attempt => attempt.timestamp > dayAgo);
      }
    } catch (error) {
      console.warn('Failed to load recovery history:', error);
      this.recoveryHistory = [];
    }
  }

  /**
   * Save recovery attempt to history
   */
  private saveRecoveryAttempt(reason: string, success: boolean): void {
    const attempt: RecoveryAttempt = {
      timestamp: Date.now(),
      reason,
      success
    };
    
    this.recoveryHistory.push(attempt);
    
    try {
      localStorage.setItem('cache-recovery-history', JSON.stringify(this.recoveryHistory));
    } catch (error) {
      console.warn('Failed to save recovery history:', error);
    }
  }

  /**
   * Check if we're in cooldown period
   */
  private isInCooldown(): boolean {
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastRecoveryAttempt;
    return timeSinceLastAttempt < this.config.cooldownPeriod;
  }

  /**
   * Get recent failed attempts count
   */
  private getRecentFailedAttempts(): number {
    const recentWindow = Date.now() - (60 * 60 * 1000); // Last hour
    return this.recoveryHistory.filter(attempt => 
      attempt.timestamp > recentWindow && !attempt.success
    ).length;
  }

  /**
   * Check if current version matches expected version
   */
  private getAppVersion(): string {
    return document.querySelector('meta[name="app-version"]')?.getAttribute('content') || 'unknown';
  }

  /**
   * Force clear all caches
   */
  async clearAllCaches(): Promise<void> {
    try {
      // Clear browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('✅ Browser caches cleared');
      }

      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
        console.log('✅ Service workers unregistered');
      }

      // Clear session/local storage cache keys
      this.clearStorageCache();
      
    } catch (error) {
      console.error('❌ Failed to clear caches:', error);
      throw error;
    }
  }

  /**
   * Clear specific storage cache keys
   */
  private clearStorageCache(): void {
    const cacheKeys = [
      'app-version',
      'last-build-hash',
      'react-query-cache',
      'supabase-auth-token'
    ];

    cacheKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to clear storage key: ${key}`, error);
      }
    });
  }

  /**
   * Check for version mismatch and handle accordingly
   */
  async checkVersionMismatch(): Promise<boolean> {
    const currentVersion = this.getAppVersion();
    const storedVersion = localStorage.getItem('app-version');

    if (storedVersion && storedVersion !== currentVersion) {
      console.log(`🔄 Version mismatch detected: ${storedVersion} -> ${currentVersion}`);
      await this.handleVersionMismatch();
      return true;
    }

    localStorage.setItem('app-version', currentVersion);
    return false;
  }

  /**
   * Handle version mismatch by clearing caches and reloading
   */
  private async handleVersionMismatch(): Promise<void> {
    try {
      await this.clearAllCaches();
      localStorage.setItem('app-version', this.getAppVersion());
      
      // Force reload without cache
      window.location.reload();
    } catch (error) {
      console.error('❌ Failed to handle version mismatch:', error);
      // Fallback: hard reload
      window.location.href = window.location.href;
    }
  }

  /**
   * Handle React errors that might be caused by cached code
   */
  async handleReactError(error: Error): Promise<boolean> {
    // Check cooldown period
    if (this.isInCooldown()) {
      console.log('🕒 Cache recovery in cooldown period, skipping automatic recovery');
      return false;
    }

    // Check if we've had too many recent failures
    if (this.getRecentFailedAttempts() >= 3) {
      console.log('🚫 Too many recent recovery failures, disabling automatic recovery');
      return false;
    }

    // Only handle specific cache-related errors
    const cacheErrorPatterns = [
      'Loading chunk failed',
      'Loading CSS chunk failed', 
      'Failed to fetch dynamically imported module',
      'Cannot access before initialization',
      'Script error for chunk',
      'NetworkError when attempting to fetch resource'
    ];

    const isCacheError = cacheErrorPatterns.some(pattern => 
      error.message.includes(pattern) || error.stack?.includes(pattern)
    );

    if (!isCacheError) {
      console.log('🔍 Error not recognized as cache-related, skipping recovery');
      return false;
    }

    if (this.retryCount < this.config.maxRetries) {
      console.log(`🔄 Detected cache error, attempting recovery (${this.retryCount + 1}/${this.config.maxRetries})`);
      
      this.retryCount++;
      this.lastRecoveryAttempt = Date.now();

      try {
        // Show user notification if required
        if (this.config.userConsentRequired && !this.userNotificationShown) {
          const consent = await this.requestUserConsent(error.message);
          if (!consent) {
            this.saveRecoveryAttempt('user_declined', false);
            return false;
          }
        }

        await this.performGradualRecovery();
        this.saveRecoveryAttempt(error.message, true);
        return true;
      } catch (clearError) {
        console.error('❌ Failed to clear caches during error recovery:', clearError);
        this.saveRecoveryAttempt(error.message, false);
      }
    }

    return false;
  }

  /**
   * Request user consent for cache recovery
   */
  private async requestUserConsent(errorMessage: string): Promise<boolean> {
    this.userNotificationShown = true;
    
    return new Promise((resolve) => {
      // Create a simple modal for user consent
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;

      const content = document.createElement('div');
      content.style.cssText = `
        background: white;
        padding: 24px;
        border-radius: 8px;
        max-width: 400px;
        text-align: center;
      `;

      content.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: #333;">Application Recovery</h3>
        <p style="margin: 0 0 24px 0; color: #666;">
          A loading error occurred. Would you like to clear the cache and reload to fix this?
        </p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="consent-yes" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Yes, Fix It
          </button>
          <button id="consent-no" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
            No, I'll Handle It
          </button>
        </div>
      `;

      modal.appendChild(content);
      document.body.appendChild(modal);

      content.querySelector('#consent-yes')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(true);
      });

      content.querySelector('#consent-no')?.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(false);
      });

      // Auto-decline after 10 seconds
      setTimeout(() => {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
          resolve(false);
        }
      }, 10000);
    });
  }

  /**
   * Perform gradual recovery - try soft methods first
   */
  private async performGradualRecovery(): Promise<void> {
    const recoverySteps = [
      // Step 1: Just reload without cache
      () => {
        console.log('🔄 Step 1: Soft reload');
        window.location.reload();
      },
      
      // Step 2: Clear service worker cache
      () => {
        console.log('🔄 Step 2: Clear service worker cache');
        return this.clearServiceWorkerCache();
      },
      
      // Step 3: Full cache clear
      () => {
        console.log('🔄 Step 3: Full cache clear');
        return this.clearAllCaches();
      }
    ];

    // For now, use step 2 (moderate approach)
    await recoverySteps[1]();
    
    // Wait before reload
    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
    window.location.reload();
  }

  /**
   * Clear only service worker caches
   */
  private async clearServiceWorkerCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('✅ Service worker caches cleared');
    }
  }

  /**
   * Preemptively check for stale cache indicators
   */
  detectStaleCache(): boolean {
    // Check for common stale cache indicators
    const indicators = [
      // Check if React version in DOM doesn't match expected
      () => {
        const reactScript = document.querySelector('script[src*="react"]') as HTMLScriptElement;
        return reactScript && !reactScript.src.includes(this.config.version);
      },
      
      // Check for missing expected DOM elements
      () => {
        return !document.querySelector('meta[name="app-version"]');
      },
      
      // Check console for specific error patterns
      () => {
        // This would need to be called from error handlers
        return false;
      }
    ];

    return indicators.some(check => {
      try {
        return check();
      } catch {
        return false;
      }
    });
  }

  /**
   * Initialize cache management
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Smart Cache Manager');
    
    // Only check version on actual navigation, not every mount
    if (performance.navigation?.type === performance.navigation.TYPE_NAVIGATE) {
      const versionMismatch = await this.checkVersionMismatch();
      if (versionMismatch) return; // Don't continue if we triggered a reload
    }
    
    // Set up smart error handlers
    this.setupSmartErrorHandlers();
    
    // Show recovery status if available
    this.showRecoveryStatus();
  }

  /**
   * Set up periodic cache validation
   */
  private setupPeriodicValidation(): void {
    // Check every 30 seconds for cache issues
    setInterval(() => {
      if (this.detectStaleCache()) {
        console.log('🔄 Stale cache detected, clearing...');
        this.clearAllCaches().catch(console.error);
      }
    }, 30000);
  }

  /**
   * Set up global error handlers
   */
  /**
   * Set up smart error handlers that are less aggressive
   */
  private setupSmartErrorHandlers(): void {
    // Handle specific loading errors
    window.addEventListener('error', (event) => {
      // Only handle script/resource loading errors
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement;
        if (target.tagName === 'SCRIPT' || target.tagName === 'LINK') {
          console.log('🔗 Resource loading error detected:', event);
          // Don't auto-recover from individual resource failures
        }
      }
    });

    // Handle chunk loading failures specifically
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason instanceof Error) {
        const error = event.reason;
        if (error.message.includes('Loading chunk') || 
            error.message.includes('Failed to fetch dynamically imported module')) {
          console.log('📦 Chunk loading error detected, will handle on retry');
          // Let the component handle this naturally, don't auto-recover
        }
      }
    });
  }

  /**
   * Show recovery status to user
   */
  private showRecoveryStatus(): void {
    const recentFailures = this.getRecentFailedAttempts();
    if (recentFailures > 0) {
      console.log(`ℹ️ ${recentFailures} recent cache recovery attempts failed`);
    }
    
    if (this.isInCooldown()) {
      const remainingCooldown = Math.ceil((this.config.cooldownPeriod - (Date.now() - this.lastRecoveryAttempt)) / 1000);
      console.log(`⏱️ Cache recovery in cooldown for ${remainingCooldown} seconds`);
    }
  }

  /**
   * Manual cache clear function for debugging
   */
  async debugClearCache(): Promise<void> {
    console.log('🧹 Manual cache clear initiated');
    await this.clearAllCaches();
    console.log('✅ Manual cache clear completed');
  }
}

// Export singleton instance with smart configuration
export const cacheManager = new CacheManager({
  version: import.meta.env.VITE_APP_VERSION || Date.now().toString(),
  maxRetries: 2, // Reduced from 3
  retryDelay: 1500, // Slightly longer delay
  cooldownPeriod: 5 * 60 * 1000, // 5 minutes between attempts
  userConsentRequired: true // Ask user before recovering
});

// Development helpers
if (typeof window !== 'undefined') {
  (window as any).clearCache = () => cacheManager.debugClearCache();
  (window as any).cacheManager = cacheManager;
  (window as any).showRecoveryHistory = () => console.table(cacheManager['recoveryHistory']);
}