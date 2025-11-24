import { useEffect } from 'react';

export function useGameControls(
  gameState: 'idle' | 'running' | 'stopped',
  actions: {
    start: () => void;
    stop: () => void;
    reset: () => void;
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
        } else if (gameState === 'stopped') {
          actions.reset();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, actions, enabled]);
}
