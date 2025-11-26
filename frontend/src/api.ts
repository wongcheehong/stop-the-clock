export const api = {
  createSession: async (hardMode: boolean = false) => {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hardMode }),
    });
    return res.json();
  },
  checkSession: async (id: string) => {
    const res = await fetch(`/api/sessions/${id}`);
    if (!res.ok) throw new Error('Session not found');
    return res.json();
  },
  joinSession: async (id: string, name: string) => {
    const res = await fetch(`/api/sessions/${id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to join');
    return res.json();
  },
  submitScore: async (playerId: number, timeMs: number) => {
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, timeMs }),
    });
    return res.json();
  },
  getLeaderboard: async (sessionId: string) => {
    const res = await fetch(`/api/sessions/${sessionId}/leaderboard`);
    return res.json();
  },
  checkPlayerScore: async (playerId: number) => {
    const res = await fetch(`/api/players/${playerId}/has-score`);
    return res.json();
  }
};
