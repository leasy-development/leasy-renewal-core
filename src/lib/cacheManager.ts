/**
 * Cache Management System
 * Handles browser cache, service worker management, and error recovery
 */

interface CacheConfig {
  version: string;
  maxRetries: number;
  retryDelay: number;
}

class CacheManager {
  private config: CacheConfig;
  private retryCount = 0;

  constructor(config: CacheConfig) {
    this.config = config;
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
    const reactErrorIndicators = [
      'Cannot read properties of null',
      'QueryClientProvider',
      'useEffect',
      'Invalid hook call',
      'React is not defined'
    ];

    const isReactCacheError = reactErrorIndicators.some(indicator => 
      error.message.includes(indicator) || error.stack?.includes(indicator)
    );

    if (isReactCacheError && this.retryCount < this.config.maxRetries) {
      console.log(`🔄 Detected React cache error, attempting recovery (${this.retryCount + 1}/${this.config.maxRetries})`);
      
      this.retryCount++;
      
      try {
        await this.clearAllCaches();
        
        // Wait before reload to ensure caches are cleared
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        
        // Force reload
        window.location.reload();
        return true;
      } catch (clearError) {
        console.error('❌ Failed to clear caches during error recovery:', clearError);
      }
    }

    return false;
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
    console.log('🚀 Initializing Cache Manager');
    
    // Check for version mismatch on startup
    await this.checkVersionMismatch();
    
    // Set up periodic cache validation
    this.setupPeriodicValidation();
    
    // Set up error event listeners
    this.setupErrorHandlers();
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
  private setupErrorHandlers(): void {
    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.handleReactError(event.error).catch(console.error);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason instanceof Error) {
        this.handleReactError(event.reason).catch(console.error);
      }
    });
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

// Export singleton instance
export const cacheManager = new CacheManager({
  version: import.meta.env.VITE_APP_VERSION || Date.now().toString(),
  maxRetries: 3,
  retryDelay: 1000
});

// Development helper
if (typeof window !== 'undefined') {
  (window as any).clearCache = () => cacheManager.debugClearCache();
  (window as any).cacheManager = cacheManager;
}