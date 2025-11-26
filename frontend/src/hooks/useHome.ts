import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export function useHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hardMode, setHardMode] = useState(false);

  const createGame = useCallback(async () => {
    setLoading(true);
    try {
      const { id } = await api.createSession(hardMode);
      navigate(`/game/${id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to create game');
    } finally {
      setLoading(false);
    }
  }, [navigate, hardMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !loading) {
        e.preventDefault();
        createGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, createGame]);

  return { loading, createGame, hardMode, setHardMode };
}
