import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRanking, type RankingEntry } from '../hooks/useRanking';
import { api } from '../api';

function formatTime(ms: number): string {
  return (ms / 1000).toFixed(3);
}

function formatDelta(delta: number): string {
  return `+${(delta / 1000).toFixed(3)}`;
}

function formatLastUpdated(date: Date | null): string {
  if (!date) return 'Never';
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  return `${Math.floor(diffSeconds / 60)}m ago`;
}

function getDeltaClass(delta: number): string {
  if (delta <= 100) return 'delta-excellent';
  if (delta <= 300) return 'delta-good';
  if (delta <= 500) return 'delta-medium';
  return 'delta-far';
}

function getRankDisplay(rank: number): { emoji: string; class: string } {
  switch (rank) {
    case 1:
      return { emoji: '👑', class: 'rank-gold' };
    case 2:
      return { emoji: '🥈', class: 'rank-silver' };
    case 3:
      return { emoji: '🥉', class: 'rank-bronze' };
    default:
      return { emoji: '', class: 'rank-default' };
  }
}

function RankingCard({ entry, rank }: { entry: RankingEntry; rank: number }) {
  const { emoji, class: rankClass } = getRankDisplay(rank);
  const deltaClass = getDeltaClass(entry.delta);

  return (
    <div
      className={`ranking-card ${rankClass}`}
      style={{ animationDelay: `${rank * 0.05}s` }}
    >
      <div className="ranking-card-rank">
        <span className="rank-number">{rank}</span>
        {emoji && <span className="rank-emoji">{emoji}</span>}
      </div>

      <div className="ranking-card-player">
        <div className="player-avatar">
          {entry.name.charAt(0).toUpperCase()}
        </div>
        <span className="player-name">{entry.name}</span>
      </div>

      <div className="ranking-card-stats">
        <div className="stat-time">
          <span className="stat-label">Time</span>
          <span className="stat-value">{formatTime(entry.timeMs)}s</span>
        </div>
        <div className={`stat-delta ${deltaClass}`}>
          <span className="stat-label">Delta</span>
          <span className="stat-value">{formatDelta(entry.delta)}s</span>
        </div>
      </div>
    </div>
  );
}

export default function Ranking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLiveEnabled, setIsLiveEnabled] = useState(true);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [lastUpdatedDisplay, setLastUpdatedDisplay] = useState('Never');

  const { rankings, isLoading, lastUpdated, playerCount } = useRanking(
    id,
    isLiveEnabled,
    5000,
  );

  // Validate session exists
  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    api
      .checkSession(id)
      .then(() => setSessionValid(true))
      .catch(() => {
        setSessionValid(false);
        setTimeout(() => navigate('/'), 2000);
      });
  }, [id, navigate]);

  // Update the "last updated" display periodically
  useEffect(() => {
    const updateDisplay = () => {
      setLastUpdatedDisplay(formatLastUpdated(lastUpdated));
    };
    updateDisplay();
    const interval = setInterval(updateDisplay, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  if (sessionValid === null) {
    return (
      <div className="ranking-container">
        <div className="ranking-loading">
          <div className="loading-spinner"></div>
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  if (sessionValid === false) {
    return (
      <div className="ranking-container">
        <div className="ranking-error">
          <div className="error-icon">⚠️</div>
          <h2>Session Not Found</h2>
          <p>Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ranking-container">
      <header className="ranking-header">
        <div className="header-glow"></div>
        <h1 className="ranking-title">
          <span className="title-live">LIVE</span>
          <span className="title-rankings">RANKINGS</span>
        </h1>
        <p className="ranking-subtitle">Stop the Clock Challenge</p>
      </header>

      <div className="ranking-meta">
        <div className="meta-card session-info">
          <span className="meta-icon">🎮</span>
          <div className="meta-content">
            <span className="meta-label">Session</span>
            <span className="meta-value">{id?.slice(0, 8)}...</span>
          </div>
        </div>

        <div className="meta-card player-count">
          <span className="meta-icon">👥</span>
          <div className="meta-content">
            <span className="meta-label">Players</span>
            <span className="meta-value">{playerCount}</span>
          </div>
        </div>

        <div className="meta-card last-update">
          <span className={`meta-icon ${isLiveEnabled ? 'pulse' : ''}`}>
            {isLiveEnabled ? '🔴' : '⏸️'}
          </span>
          <div className="meta-content">
            <span className="meta-label">Updated</span>
            <span className="meta-value">{lastUpdatedDisplay}</span>
          </div>
        </div>
      </div>

      <div className="live-toggle-container">
        <label className="live-toggle">
          <input
            type="checkbox"
            checked={isLiveEnabled}
            onChange={(e) => setIsLiveEnabled(e.target.checked)}
          />
          <span className="toggle-track">
            <span className="toggle-thumb"></span>
          </span>
          <span className="toggle-label">
            {isLiveEnabled ? 'Live Updates ON' : 'Live Updates OFF'}
          </span>
          {isLiveEnabled && <span className="live-dot"></span>}
        </label>
      </div>

      <div className="ranking-list">
        {isLoading && rankings.length === 0 ? (
          <div className="ranking-loading">
            <div className="loading-spinner"></div>
            <p>Loading rankings...</p>
          </div>
        ) : rankings.length === 0 ? (
          <div className="ranking-empty">
            <div className="empty-icon">🏁</div>
            <h3>No Scores Yet</h3>
            <p>Be the first to stop the clock!</p>
            <button
              className="join-game-btn"
              onClick={() => navigate(`/game/${id}`)}
            >
              Join Game
            </button>
          </div>
        ) : (
          <>
            <div className="ranking-cards">
              {rankings.map((entry, idx) => (
                <RankingCard
                  key={entry.playerId}
                  entry={entry}
                  rank={idx + 1}
                />
              ))}
            </div>

            <div className="ranking-footer">
              <p className="target-reminder">
                🎯 Target: <strong>10.000s</strong> — Lowest delta wins!
              </p>
            </div>
          </>
        )}
      </div>

      <button
        className="back-to-game-btn"
        onClick={() => navigate(`/game/${id}`)}
      >
        ← Back to Game
      </button>
    </div>
  );
}
