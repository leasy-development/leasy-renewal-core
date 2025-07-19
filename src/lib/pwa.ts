// PWA Service Worker registration and management
export class PWAManager {
  private static instance: PWAManager;
  private registration: ServiceWorkerRegistration | null = null;

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  async init(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        await this.registerServiceWorker();
        this.setupPWAPrompt();
        this.setupBackgroundSync();
      } catch (error) {
        console.error('PWA initialization failed:', error);
      }
    }
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully');

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.notifyUpdate();
            }
          });
        }
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  private setupPWAPrompt(): void {
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      this.showInstallPrompt(deferredPrompt);
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      deferredPrompt = null;
    });
  }

  private showInstallPrompt(prompt: BeforeInstallPromptEvent): void {
    // Create custom install prompt
    const installBanner = document.createElement('div');
    installBanner.className = 'fixed top-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50 max-w-sm';
    installBanner.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-semibold">Install Leasy</h3>
          <p class="text-sm opacity-90">Get quick access and offline features</p>
        </div>
        <div class="flex gap-2 ml-4">
          <button id="install-button" class="bg-white text-primary px-3 py-1 rounded text-sm font-medium">
            Install
          </button>
          <button id="dismiss-button" class="text-primary-foreground opacity-70 hover:opacity-100">
            ×
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(installBanner);

    const installButton = installBanner.querySelector('#install-button');
    const dismissButton = installBanner.querySelector('#dismiss-button');

    installButton?.addEventListener('click', async () => {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      console.log(`User ${outcome} the install prompt`);
      installBanner.remove();
    });

    dismissButton?.addEventListener('click', () => {
      installBanner.remove();
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (document.body.contains(installBanner)) {
        installBanner.remove();
      }
    }, 10000);
  }

  private setupBackgroundSync(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Back online - triggering background sync');
      this.triggerBackgroundSync();
    });

    window.addEventListener('offline', () => {
      console.log('Gone offline - will queue uploads for later');
    });
  }

  private async triggerBackgroundSync(): Promise<void> {
    if (this.registration && 'sync' in this.registration) {
      try {
        await (this.registration as any).sync.register('property-upload');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }

  private notifyUpdate(): void {
    // Show update notification
    const updateBanner = document.createElement('div');
    updateBanner.className = 'fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50';
    updateBanner.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-semibold">Update Available</h3>
          <p class="text-sm opacity-90">A new version of Leasy is ready</p>
        </div>
        <button id="update-button" class="bg-white text-blue-600 px-4 py-2 rounded text-sm font-medium">
          Update
        </button>
      </div>
    `;

    document.body.appendChild(updateBanner);

    const updateButton = updateBanner.querySelector('#update-button');
    updateButton?.addEventListener('click', () => {
      if (this.registration?.waiting) {
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    });
  }

  // Queue failed uploads for background sync
  async queueFailedUpload(uploadData: any): Promise<void> {
    if ('indexedDB' in window) {
      try {
        const db = await this.openDB();
        const transaction = db.transaction(['failedUploads'], 'readwrite');
        const store = transaction.objectStore('failedUploads');
        await store.add({
          ...uploadData,
          timestamp: Date.now(),
          retryCount: 0
        });
        console.log('Upload queued for retry');
      } catch (error) {
        console.error('Failed to queue upload:', error);
      }
    }
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LeasyDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('failedUploads')) {
          const store = db.createObjectStore('failedUploads', { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  // Check if app is installed
  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Get connection status
  isOnline(): boolean {
    return navigator.onLine;
  }
}

// Type definition for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Initialize PWA when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    PWAManager.getInstance().init();
  });
} else {
  PWAManager.getInstance().init();
}

export default PWAManager;