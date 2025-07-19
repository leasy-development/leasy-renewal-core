import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Extend Vitest's expect with jest-dom matchers
expect.extend({});

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
      insert: vi.fn(() => ({ data: [], error: null })),
      update: vi.fn(() => ({ data: [], error: null })),
      delete: vi.fn(() => ({ data: [], error: null })),
      eq: vi.fn(() => ({ data: [], error: null })),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => ({ data: { path: 'test-path' }, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test-url' } })),
        remove: vi.fn(() => ({ data: null, error: null })),
      })),
    },
  },
}));

// Mock window.URL.createObjectURL
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

// Mock fetch for tests
global.fetch = vi.fn();

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));