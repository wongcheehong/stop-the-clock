import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../hooks/useGame';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { usePlayerSession } from '../hooks/usePlayerSession';
import { useGameControls } from '../hooks/useGameControls';

export default function Game() {
  const { id } = useParams<{ id: string }>();

  const { player, joinGame } = usePlayerSession(id);
  const { gameState, timeMs, lastResult, hasPlayed, startGame, stopGame } = useGame(id, player);
  const leaderboard = useLeaderboard(id, lastResult);

  useGameControls(gameState, {
    start: startGame,
    stop: stopGame,
  }, !!player && !hasPlayed);

  const [nameInput, setNameInput] = useState('');

  const handleJoin = () => {
      joinGame(nameInput);
  };

  if (!player) {
    return (
      <div className="game-container">
        <h2>Enter your Name</h2>
        <input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          placeholder="Display Name"
        />
        <button onClick={handleJoin}>Join Game</button>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="header">
        <h2>Room: {id?.slice(0, 8)}...</h2>
        <p>Player: {player.name}</p>
        <button className="share-btn" onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          alert('Link copied!');
        }}>Share Link</button>
      </div>

      <div className="timer-section">
        <div className={`timer-display ${gameState}`}>
          {(timeMs / 1000).toFixed(2)}s
        </div>
        <div className="target-label">Target: 10.00s</div>

        {gameState === 'idle' && (
          <button className="action-btn start" onClick={startGame}>Start</button>
        )}
        {gameState === 'running' && (
          <button className="action-btn stop" onClick={stopGame}>STOP</button>
        )}
        {gameState === 'stopped' && (
          <div className="result">
            {lastResult && (
              <>
                <p>Stopped at: {(lastResult.time / 1000).toFixed(3)}s</p>
                <p>Delta: {(lastResult.delta / 1000).toFixed(3)}s</p>
              </>
            )}
            <p className="played-message">You've already played in this session!</p>
          </div>
        )}
      </div>

      <div className="leaderboard-section">
        <div className="leaderboard-title-row">
          <h3>Live Rankings</h3>
          <a
            className="view-full-ranking-btn"
            href={`/ranking/${id}`}
            title="View Full Ranking"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          </a>
        </div>
        <div className="leaderboard-header">
            <span>#</span>
            <span>Name</span>
            <span className="u-text-right">Time</span>
            <span className="u-text-right">Delta</span>
        </div>
        <ul>
          {leaderboard.map((entry, idx) => (
            <li key={entry.playerId} className={entry.playerId === player.id ? 'me' : ''}>
              <span className="rank">#{idx + 1}</span>
              <span className="name">{entry.name}</span>
              <span className="time-val">{(entry.timeMs / 1000).toFixed(3)}s</span>
              <span className="score">+{ (entry.delta / 1000).toFixed(3)}s</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
