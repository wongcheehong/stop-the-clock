import { useHome } from '../hooks/useHome';

export default function Home() {
  const { loading, createGame, hardMode, setHardMode } = useHome();

  return (
    <div className="home-container">
      <h1>STOP THE CLOCK</h1>
      <p>Can you hit <span style={{ color: 'var(--accent-tertiary)', fontWeight: 'bold' }}>10.00s</span> exactly?</p>
      <label className="hard-mode-toggle">
        <input
          type="checkbox"
          checked={hardMode}
          onChange={(e) => setHardMode(e.target.checked)}
        />
        <span className="toggle-slider"></span>
        <span className="toggle-label">Hard Mode</span>
      </label>
      {hardMode && (
        <p className="hard-mode-hint">Timer hidden while running - count in your head!</p>
      )}
      <button onClick={createGame} disabled={loading}>
        {loading ? 'Initializing...' : 'Start New Game'}
      </button>
    </div>
  );
}