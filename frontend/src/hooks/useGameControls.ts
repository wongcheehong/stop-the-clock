import { useEffect } from 'react';

export function useGameControls(
  gameState: 'idle' | 'running' | 'stopped',
  actions: {
    start: () => void;
    stop: () => void;
  },
  enabled: boolean = true
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabled) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'idle') {
          actions.start();
        } else if (gameState === 'running') {
          actions.stop();
        }
        // No reset action when stopped - one play per session
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, actions, enabled]);
}
