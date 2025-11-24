import { useHome } from '../hooks/useHome';

export default function Home() {
  const { loading, createGame } = useHome();

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