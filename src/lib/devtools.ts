
// Development tools and debugging utilities
import config from './config';
import { performanceMonitor } from './performance';
import { logger } from './logger';

interface DevToolsState {
  isOpen: boolean;
  activeTab: 'performance' | 'cache' | 'logs' | 'config';
}

class DevTools {
  private state: DevToolsState = {
    isOpen: false,
    activeTab: 'performance',
  };

  private listeners: ((state: DevToolsState) => void)[] = [];

  init(): void {
    if (!config.features.enableDebugTools) return;

    // Add keyboard shortcut to toggle dev tools
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        this.toggle();
      }
    });

    // Add global dev tools object
    if (typeof window !== 'undefined') {
      (window as any).__LEASY_DEV_TOOLS__ = {
        performance: performanceMonitor,
        logger,
        config,
        cache: {
          clear: () => performanceMonitor.clearCache(),
          stats: () => performanceMonitor.getCacheStats(),
        },
        app: {
          version: config.app.version,
          environment: config.app.environment,
        },
      };
    }

    logger.info('Dev tools initialized. Press Ctrl+Shift+D to toggle.');
  }

  toggle(): void {
    this.state.isOpen = !this.state.isOpen;
    this.notifyListeners();
  }

  setActiveTab(tab: DevToolsState['activeTab']): void {
    this.state.activeTab = tab;
    this.notifyListeners();
  }

  getState(): DevToolsState {
    return { ...this.state };
  }

  subscribe(listener: (state: DevToolsState) => void): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Debug utilities
  debugQuery(queryKey: string, data: any): void {
    if (!config.features.enableDebugTools) return;
    
    logger.debug('Query Debug', {
      queryKey,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  debugComponent(componentName: string, props: any, state?: any): void {
    if (!config.features.enableDebugTools) return;
    
    logger.debug('Component Debug', {
      component: componentName,
      props,
      state,
      timestamp: new Date().toISOString(),
    });
  }

  measureFunction<T extends (...args: any[]) => any>(
    fn: T,
    name: string
  ): T {
    if (!config.features.enableDebugTools) return fn;
    
    return ((...args: Parameters<T>) => {
      const endMeasurement = performanceMonitor.startMeasurement(`Function: ${name}`);
      try {
        const result = fn(...args);
        endMeasurement();
        return result;
      } catch (error) {
        endMeasurement();
        throw error;
      }
    }) as T;
  }
}

export const devTools = new DevTools();

// React hook for dev tools integration
export const useDevTools = () => {
  const [state, setState] = React.useState(devTools.getState());

  React.useEffect(() => {
    return devTools.subscribe(setState);
  }, []);

  return {
    ...state,
    toggle: () => devTools.toggle(),
    setActiveTab: (tab: DevToolsState['activeTab']) => devTools.setActiveTab(tab),
    debugComponent: (name: string, props: any, state?: any) => 
      devTools.debugComponent(name, props, state),
  };
};
