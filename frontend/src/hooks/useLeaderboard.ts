import { useState, useEffect } from 'react';
import { api } from '../api';

export interface LeaderboardEntry {
  playerId: number;
  name: string;
  timeMs: number;
  delta: number;
}

export function useLeaderboard(sessionId: string | undefined, refreshTrigger?: unknown) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    
    const fetchLeaderboard = () => {
      api.getLeaderboard(sessionId).then(setLeaderboard).catch(console.error);
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 2000);
    return () => clearInterval(interval);
  }, [sessionId, refreshTrigger]);

  return leaderboard;
}
