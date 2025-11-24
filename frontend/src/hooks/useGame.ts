import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';

interface GameState {
  gameState: 'idle' | 'running' | 'stopped';
  timeMs: number;
  lastResult: { time: number; delta: number } | null;
  hasPlayed: boolean;
  startGame: () => void;
  stopGame: () => void;
}

interface Player {
  id: number;
  name: string;
}

export function useGame(sessionId: string | undefined, player: Player | null): GameState {
  const [gameState, setGameState] = useState<'idle' | 'running' | 'stopped'>('idle');
  const [timeMs, setTimeMs] = useState(0);
  const [lastResult, setLastResult] = useState<{ time: number; delta: number } | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  const startTimeRef = useRef<number>(0);

  // Check if player already has a score on mount/player change
  useEffect(() => {
    if (player) {
      api.checkPlayerScore(player.id).then((res) => {
        if (res.hasScore) {
          setHasPlayed(true);
          setGameState('stopped');
          setLastResult({ time: res.score.timeMs, delta: res.score.delta });
          setTimeMs(res.score.timeMs);
        }
      });
    }
  }, [player]);

  const startGame = useCallback(() => {
    if (hasPlayed) return; // Prevent starting if already played
    setGameState('running');
    startTimeRef.current = performance.now();
  }, [hasPlayed]);

  const stopGame = useCallback(async () => {
    setGameState('stopped');

    const finalTime = performance.now() - startTimeRef.current;
    setTimeMs(finalTime);

    if (player && sessionId) {
      try {
        const res = await api.submitScore(player.id, Math.floor(finalTime));
        if (res.error) {
          // Already played - server rejected
          setHasPlayed(true);
        } else {
          setLastResult({ time: finalTime, delta: res.delta });
          setHasPlayed(true);
        }
      } catch (e) {
        console.error("Failed to submit score", e);
      }
    }
  }, [player, sessionId]);

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

  return { gameState, timeMs, lastResult, hasPlayed, startGame, stopGame };
}
