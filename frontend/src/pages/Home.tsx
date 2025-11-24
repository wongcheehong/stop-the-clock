import { useState } from 'react';
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

  return (
    <div className="home-container">
      <h1>Stop the Clock</h1>
      <p>Stop the timer exactly at 10.00 seconds!</p>
      <button onClick={createGame} disabled={loading}>
        {loading ? 'Creating...' : 'Create New Game'}
      </button>
    </div>
  );
}
