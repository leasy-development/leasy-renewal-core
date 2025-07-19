import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!event.ctrlKey === !!shortcut.ctrlKey;
      const altMatch = !!event.altKey === !!shortcut.altKey;
      const shiftMatch = !!event.shiftKey === !!shortcut.shiftKey;
      
      return keyMatch && ctrlMatch && altMatch && shiftMatch;
    });

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
}

// Property form specific shortcuts hook
export function usePropertyFormShortcuts({
  onSave,
  onPublish,
  onPreview,
  onNextSection,
  onPrevSection,
  enabled = true
}: {
  onSave: () => void;
  onPublish: () => void;
  onPreview?: () => void;
  onNextSection: () => void;
  onPrevSection: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 's',
      ctrlKey: true,
      action: onSave,
      description: 'Save draft'
    },
    {
      key: 'Enter',
      ctrlKey: true,
      action: onPublish,
      description: 'Publish property'
    },
    {
      key: 'p',
      ctrlKey: true,
      action: onPreview || (() => {}),
      description: 'Preview property'
    },
    {
      key: 'ArrowDown',
      ctrlKey: true,
      action: onNextSection,
      description: 'Next section'
    },
    {
      key: 'ArrowUp',
      ctrlKey: true,
      action: onPrevSection,
      description: 'Previous section'
    },
    {
      key: 'j',
      action: onNextSection,
      description: 'Next section (vim-style)'
    },
    {
      key: 'k',
      action: onPrevSection,
      description: 'Previous section (vim-style)'
    }
  ];

  useKeyboardShortcuts({ shortcuts, enabled });
}

// Dashboard shortcuts hook
export function useDashboardShortcuts({
  onNewProperty,
  onRefresh,
  onSearch,
  enabled = true
}: {
  onNewProperty: () => void;
  onRefresh: () => void;
  onSearch: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrlKey: true,
      action: onNewProperty,
      description: 'Add new property'
    },
    {
      key: 'r',
      ctrlKey: true,
      action: onRefresh,
      description: 'Refresh dashboard'
    },
    {
      key: 'f',
      ctrlKey: true,
      action: onSearch,
      description: 'Focus search'
    },
    {
      key: '/',
      action: onSearch,
      description: 'Focus search (vim-style)'
    }
  ];

  useKeyboardShortcuts({ shortcuts, enabled });
}