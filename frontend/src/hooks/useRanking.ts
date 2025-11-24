import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export interface RankingEntry {
  playerId: number;
  name: string;
  timeMs: number;
  delta: number;
}

export interface UseRankingResult {
  rankings: RankingEntry[];
  isLoading: boolean;
  lastUpdated: Date | null;
  playerCount: number;
  refresh: () => void;
}

export function useRanking(
  sessionId: string | undefined,
  isLiveEnabled: boolean = true,
  pollInterval: number = 5000
): UseRankingResult {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRankings = useCallback(async () => {
    if (!sessionId) return;

    try {
      const data = await api.getLeaderboard(sessionId);
      setRankings(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Initial fetch
  useEffect(() => {
    if (!sessionId) return;
    setIsLoading(true);
    fetchRankings();
  }, [sessionId, fetchRankings]);

  // Polling when live mode is enabled
  useEffect(() => {
    if (!sessionId || !isLiveEnabled) return;

    const interval = setInterval(fetchRankings, pollInterval);
    return () => clearInterval(interval);
  }, [sessionId, isLiveEnabled, pollInterval, fetchRankings]);

  return {
    rankings,
    isLoading,
    lastUpdated,
    playerCount: rankings.length,
    refresh: fetchRankings,
  };
}
