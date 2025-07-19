interface ImageCache {
  [url: string]: {
    blob?: Blob;
    dataUrl?: string;
    status: 'loading' | 'success' | 'error';
    timestamp: number;
  };
}

class ImagePreviewCache {
  private cache: ImageCache = {};
  private maxCacheSize = 200; // Maximum cached images
  private maxAge = 30 * 60 * 1000; // 30 minutes

  async preloadImage(url: string): Promise<string | null> {
    // Check if already cached and valid
    const cached = this.cache[url];
    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      if (cached.status === 'success' && cached.dataUrl) {
        return cached.dataUrl;
      }
      if (cached.status === 'error') {
        return null;
      }
      if (cached.status === 'loading') {
        // Wait for existing request
        return this.waitForCache(url);
      }
    }

    // Start loading
    this.cache[url] = {
      status: 'loading',
      timestamp: Date.now()
    };

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'HEAD', // Just check if image exists first
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) {
        throw new Error('Not an image');
      }

      // Now fetch the actual image
      const imageController = new AbortController();
      const imageTimeoutId = setTimeout(() => imageController.abort(), 10000);
      
      const imageResponse = await fetch(url, { 
        signal: imageController.signal 
      });
      
      clearTimeout(imageTimeoutId);
      
      if (!imageResponse.ok) {
        throw new Error(`HTTP ${imageResponse.status}`);
      }

      const blob = await imageResponse.blob();
      const dataUrl = await this.blobToDataUrl(blob);

      this.cache[url] = {
        blob,
        dataUrl,
        status: 'success',
        timestamp: Date.now()
      };

      this.cleanupCache();
      return dataUrl;

    } catch (error) {
      console.warn('Failed to preload image:', url, error);
      this.cache[url] = {
        status: 'error',
        timestamp: Date.now()
      };
      return null;
    }
  }

  private async waitForCache(url: string, timeout = 10000): Promise<string | null> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const cached = this.cache[url];
      if (cached?.status === 'success' && cached.dataUrl) {
        return cached.dataUrl;
      }
      if (cached?.status === 'error') {
        return null;
      }
      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return null; // Timeout
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private cleanupCache() {
    const entries = Object.entries(this.cache);
    
    // Remove expired entries
    const now = Date.now();
    const validEntries = entries.filter(([_, data]) => 
      now - data.timestamp < this.maxAge
    );

    // If still too many, remove oldest
    if (validEntries.length > this.maxCacheSize) {
      validEntries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      validEntries.splice(this.maxCacheSize);
    }

    // Rebuild cache
    this.cache = Object.fromEntries(validEntries);
  }

  getCachedImage(url: string): string | null {
    const cached = this.cache[url];
    if (cached?.status === 'success' && cached.dataUrl) {
      return cached.dataUrl;
    }
    return null;
  }

  getImageStatus(url: string): 'loading' | 'success' | 'error' | 'not-loaded' {
    return this.cache[url]?.status || 'not-loaded';
  }

  // Batch preload multiple images
  async preloadBatch(urls: string[], batchSize = 5): Promise<void> {
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(url => this.preloadImage(url))
      );
    }
  }

  clearCache() {
    this.cache = {};
  }
}

export const imagePreviewCache = new ImagePreviewCache();