import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';

interface GameState {
  gameState: 'idle' | 'running' | 'stopped';
  timeMs: number;
  lastResult: { time: number; delta: number } | null;
  startGame: () => void;
  stopGame: () => void;
  resetGame: () => void;
}

interface Player {
  id: number;
  name: string;
}

export function useGame(sessionId: string | undefined, player: Player | null): GameState {
  const [gameState, setGameState] = useState<'idle' | 'running' | 'stopped'>('idle');
  const [timeMs, setTimeMs] = useState(0);
  const [lastResult, setLastResult] = useState<{ time: number; delta: number } | null>(null);
  
  const startTimeRef = useRef<number>(0);

  const startGame = useCallback(() => {
    setGameState('running');
    startTimeRef.current = performance.now();
  }, []);

  const stopGame = useCallback(async () => {
    setGameState('stopped');
    
    const finalTime = performance.now() - startTimeRef.current;
    setTimeMs(finalTime);
    
    if (player && sessionId) {
      try {
        const res = await api.submitScore(player.id, Math.floor(finalTime));
        setLastResult({ time: finalTime, delta: res.delta });
      } catch (e) {
        console.error("Failed to submit score", e);
      }
    } else {
        // Fallback if no player/session, just show time (though UI handles this guard)
        setLastResult({ time: finalTime, delta: 0 });
    }
  }, [player, sessionId]);

  const resetGame = useCallback(() => {
    setGameState('idle');
    setTimeMs(0);
    setLastResult(null);
  }, []);

  // Timer loop
  useEffect(() => {
    let frameId: number;
    if (gameState === 'running') {
      const loop = () => {
        const now = performance.now();
        setTimeMs(now - startTimeRef.current);
        frameId = requestAnimationFrame(loop);
      };
      frameId = requestAnimationFrame(loop);
    }
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [gameState]);

  return { gameState, timeMs, lastResult, startGame, stopGame, resetGame };
}
