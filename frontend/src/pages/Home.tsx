import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const createGame = async () => {
    setLoading(true);
    try {
      const { id } = await api.createSession();
      navigate(`/game/${id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to create game');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="home-container">
      <h1>STOP THE CLOCK</h1>
      <p>Can you hit <span style={{ color: 'var(--accent-tertiary)', fontWeight: 'bold' }}>10.00s</span> exactly?</p>
      <button onClick={createGame} disabled={loading}>
        {loading ? 'Initializing...' : 'Start New Game'}
      </button>
    </div>
  );
}
