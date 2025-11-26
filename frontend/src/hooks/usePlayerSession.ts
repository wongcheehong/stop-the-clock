import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export interface Player {
  id: number;
  name: string;
}

export function usePlayerSession(sessionId: string | undefined) {
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [hardMode, setHardMode] = useState(false);

  // Initial load: check session and restore player
  useEffect(() => {
    if (!sessionId) return;

    api.checkSession(sessionId)
      .then((session) => {
        setHardMode(session.hardMode === true || session.hardMode === 1);
        const stored = localStorage.getItem(`stop-clock-player-${sessionId}`);
        if (stored) {
          setPlayer(JSON.parse(stored));
        }
      })
      .catch(() => {
        alert('Session not found');
        navigate('/');
      });
  }, [sessionId, navigate]);

  const joinGame = useCallback(async (name: string) => {
    if (!sessionId || !name.trim()) return;
    try {
      const p = await api.joinSession(sessionId, name);
      setPlayer(p);
      localStorage.setItem(`stop-clock-player-${sessionId}`, JSON.stringify(p));
    } catch (e) {
      alert('Failed to join');
      throw e;
    }
  }, [sessionId]);

  return { player, joinGame, hardMode };
}
