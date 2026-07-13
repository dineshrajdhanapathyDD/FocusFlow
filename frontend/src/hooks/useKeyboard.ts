import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { KEYBOARD_SHORTCUTS } from '@/lib/constants';

export function useKeyboardShortcuts(onNewTask?: () => void) {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Ignore if typing in an input or textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ignore if modifier keys are pressed (except for specific combos)
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      switch (event.key) {
        case KEYBOARD_SHORTCUTS.newTask:
          event.preventDefault();
          onNewTask?.();
          break;
        case KEYBOARD_SHORTCUTS.search:
          event.preventDefault();
          document.querySelector<HTMLInputElement>('[data-search-input]')?.focus();
          break;
        case KEYBOARD_SHORTCUTS.dashboard:
          navigate('/');
          break;
        case KEYBOARD_SHORTCUTS.tasks:
          navigate('/tasks');
          break;
        case KEYBOARD_SHORTCUTS.planner:
          navigate('/planner');
          break;
        case KEYBOARD_SHORTCUTS.aiAssistant:
          navigate('/ai-assistant');
          break;
        case KEYBOARD_SHORTCUTS.analytics:
          navigate('/analytics');
          break;
        case KEYBOARD_SHORTCUTS.settings:
          navigate('/settings');
          break;
        case KEYBOARD_SHORTCUTS.toggleTheme:
          toggleTheme();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toggleTheme, onNewTask]);
}
