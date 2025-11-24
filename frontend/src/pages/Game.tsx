import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

interface Player {
  id: number;
  name: string;
}

interface LeaderboardEntry {
  playerId: number;
  name: string;
  timeMs: number;
  delta: number;
}

export default function Game() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [player, setPlayer] = useState<Player | null>(null);
  const [nameInput, setNameInput] = useState('');
  
  const [gameState, setGameState] = useState<'idle' | 'running' | 'stopped'>('idle');
  const [timeMs, setTimeMs] = useState(0);
  const [lastResult, setLastResult] = useState<{ time: number; delta: number } | null>(null);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  const startTimeRef = useRef<number>(0);

  // Initial load: check session
  useEffect(() => {
    if (!id) return;
    api.checkSession(id)
      .then(() => {
        // Restore player from local storage if matches session and session exists
        const stored = localStorage.getItem(`stop-clock-player-${id}`);
        if (stored) {
          setPlayer(JSON.parse(stored));
        }
      })
      .catch(() => {
        alert('Session not found');
        navigate('/');
      });
  }, [id, navigate]);

  // Leaderboard polling
  useEffect(() => {
    if (!id) return;
    const fetchLeaderboard = () => {
      api.getLeaderboard(id).then(setLeaderboard).catch(console.error);
    };
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 2000);
    return () => clearInterval(interval);
  }, [id, lastResult]); 

  const joinGame = async () => {
    if (!nameInput.trim() || !id) return;
    try {
      const p = await api.joinSession(id, nameInput);
      setPlayer(p);
      localStorage.setItem(`stop-clock-player-${id}`, JSON.stringify(p));
    } catch {
      alert('Failed to join');
    }
  };

  const startGame = useCallback(() => {
    setGameState('running');
    startTimeRef.current = performance.now();
  }, []);

  const stopGame = useCallback(async () => {
    setGameState('stopped');
    
    const finalTime = performance.now() - startTimeRef.current;
    setTimeMs(finalTime);
    
    if (player && id) {
      const res = await api.submitScore(player.id, Math.floor(finalTime));
      setLastResult({ time: finalTime, delta: res.delta });
    }
  }, [player, id]);

  const resetGame = useCallback(() => {
    setGameState('idle');
    setTimeMs(0);
    setLastResult(null);
  }, []);

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

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!player) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'idle') {
          startGame();
        } else if (gameState === 'running') {
          stopGame();
        } else if (gameState === 'stopped') {
          resetGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, gameState, startGame, stopGame, resetGame]);

  if (!player) {
    return (
      <div className="game-container">
        <h2>Enter your Name</h2>
        <input 
          value={nameInput} 
          onChange={(e) => setNameInput(e.target.value)} 
          placeholder="Display Name" 
        />
        <button onClick={joinGame}>Join Game</button>
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
            <button className="action-btn retry" onClick={resetGame}>Try Again</button>
          </div>
        )}
      </div>

      <div className="leaderboard-section">
        <h3>Live Rankings</h3>
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