import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';

interface GameState {
  gameState: 'idle' | 'running' | 'stopped';
  timeMs: number;
  lastResult: { time: number; delta: number } | null;
  hasPlayed: boolean;
  error: string | null;
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
  const [error, setError] = useState<string | null>(null);

  const startTimeRef = useRef<number>(0);
  const gameTokenRef = useRef<string | null>(null);

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

  const startGame = useCallback(async () => {
    if (hasPlayed || !player) return; // Prevent starting if already played or no player

    setError(null); // Clear any previous error
    try {
      // Request game token from server (anti-cheat)
      const res = await api.startGame(player.id);
      if (res.error) {
        console.error('Failed to start game:', res.error);
        setError(res.error);
        setHasPlayed(true); // Likely already played
        return;
      }
      gameTokenRef.current = res.token;
      setGameState('running');
      startTimeRef.current = performance.now();
    } catch (e) {
      console.error('Failed to start game', e);
      setError('Failed to start game. Please try again.');
    }
  }, [hasPlayed, player]);

  const stopGame = useCallback(async () => {
    setGameState('stopped');

    const finalTime = performance.now() - startTimeRef.current;
    setTimeMs(finalTime);

    if (player && sessionId && gameTokenRef.current) {
      try {
        const res = await api.submitScore(player.id, Math.floor(finalTime), gameTokenRef.current);
        if (res.error) {
          // Already played or invalid token - server rejected
          console.error('Score submission failed:', res.error);
          setError(res.error);
          setHasPlayed(true);
        } else {
          setLastResult({ time: finalTime, delta: res.delta });
          setHasPlayed(true);
        }
        gameTokenRef.current = null; // Clear token after use
      } catch (e) {
        console.error("Failed to submit score", e);
        setError('Failed to submit score. Please try again.');
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

  return { gameState, timeMs, lastResult, hasPlayed, error, startGame, stopGame };
}
