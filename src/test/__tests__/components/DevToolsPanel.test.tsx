
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { DevToolsPanel } from '@/components/DevToolsPanel';
import config from '@/lib/config';

// Mock the config
vi.mock('@/lib/config', () => ({
  default: {
    features: {
      enableDebugTools: true,
    },
  },
}));

// Mock the devtools hook
vi.mock('@/lib/devtools', () => ({
  useDevTools: () => ({
    isOpen: true,
    activeTab: 'performance',
    toggle: vi.fn(),
    setActiveTab: vi.fn(),
  }),
}));

// Mock performance monitor
vi.mock('@/lib/performance', () => ({
  performanceMonitor: {
    getMetrics: () => [
      { loadTime: 123.45, renderTime: 67.89, interactiveTime: 234.56 },
    ],
    getCacheStats: () => ({
      size: 5,
      keys: ['key1', 'key2', 'key3'],
    }),
    clearCache: vi.fn(),
  },
}));

describe('DevToolsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when debug tools are enabled and panel is open', () => {
    render(<DevToolsPanel />);
    
    expect(screen.getByText('Dev Tools')).toBeInTheDocument();
    expect(screen.getByText('Perf')).toBeInTheDocument();
    expect(screen.getByText('Cache')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('Config')).toBeInTheDocument();
  });

  it('should display performance metrics', () => {
    render(<DevToolsPanel />);
    
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Load Time')).toBeInTheDocument();
    expect(screen.getByText('123.45ms')).toBeInTheDocument();
  });

  it('should have a refresh button for performance metrics', () => {
    render(<DevToolsPanel />);
    
    const refreshButton = screen.getByText('Refresh');
    expect(refreshButton).toBeInTheDocument();
    
    fireEvent.click(refreshButton);
    // The button should be clickable (no errors thrown)
  });

  it('should display cache statistics', async () => {
    render(<DevToolsPanel />);
    
    // Switch to cache tab
    fireEvent.click(screen.getByText('Cache'));
    
    expect(screen.getByText('Cache Statistics')).toBeInTheDocument();
    expect(screen.getByText('Cache Size')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // cache size
  });

  it('should have tabs for different sections', () => {
    render(<DevToolsPanel />);
    
    const tabs = ['Perf', 'Cache', 'Logs', 'Config'];
    tabs.forEach(tab => {
      expect(screen.getByText(tab)).toBeInTheDocument();
    });
  });

  it('should have a close button', () => {
    render(<DevToolsPanel />);
    
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
  });
});
