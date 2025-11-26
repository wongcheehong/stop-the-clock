import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from './db/index.js';
import { sessions, players, scores } from './db/schema.js';
import { eq, asc } from 'drizzle-orm';

const app = new Hono();

app.use('/*', cors());

app.get('/', (c) => {
  return c.text('Stop the Clock API');
});

// Create a new session
app.post('/api/sessions', async (c) => {
  const id = crypto.randomUUID();
  const body = await c.req.json().catch(() => ({}));
  const hardMode = body.hardMode === true;
  await db.insert(sessions).values({ id, hardMode });
  return c.json({ id, hardMode });
});

// Check if session exists
app.get('/api/sessions/:id', async (c) => {
  const { id } = c.req.param();
  const result = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .get();
  if (!result) {
    return c.json({ error: 'Session not found' }, 404);
  }
  return c.json(result);
});

// Join a session
app.post('/api/sessions/:id/join', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();
  const name = body.name;

  if (!name) return c.json({ error: 'Name is required' }, 400);

  // Check session existence
  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .get();
  if (!session) return c.json({ error: 'Session not found' }, 404);

  // Create player
  const result = await db
    .insert(players)
    .values({
      sessionId: id,
      name: name,
    })
    .returning({ id: players.id, name: players.name })
    .get();

  return c.json(result);
});

// Submit a score
app.post('/api/scores', async (c) => {
  const body = await c.req.json();
  const { playerId, timeMs } = body;

  if (playerId === undefined || timeMs === undefined) {
    return c.json({ error: 'Missing playerId or timeMs' }, 400);
  }

  // Check if player already has a score (one play per session)
  const existingScore = await db
    .select()
    .from(scores)
    .where(eq(scores.playerId, playerId))
    .get();

  if (existingScore) {
    return c.json({ error: 'You have already played in this session' }, 409);
  }

  // Calculate delta (absolute difference from 10000ms)
  const delta = Math.abs(timeMs - 10000);

  await db.insert(scores).values({
    playerId,
    timeMs,
    delta,
  });

  return c.json({ success: true, delta });
});

// Check if player has already submitted a score
app.get('/api/players/:id/has-score', async (c) => {
  const { id } = c.req.param();
  const playerId = parseInt(id, 10);

  if (isNaN(playerId)) {
    return c.json({ error: 'Invalid player ID' }, 400);
  }

  const existingScore = await db
    .select({
      timeMs: scores.timeMs,
      delta: scores.delta,
    })
    .from(scores)
    .where(eq(scores.playerId, playerId))
    .get();

  if (existingScore) {
    return c.json({ hasScore: true, score: existingScore });
  }

  return c.json({ hasScore: false });
});

// Get leaderboard
app.get('/api/sessions/:id/leaderboard', async (c) => {
  const { id } = c.req.param();

  // Get all scores for the session, ordered by best delta
  const allScores = await db
    .select({
      name: players.name,
      playerId: players.id,
      delta: scores.delta,
      timeMs: scores.timeMs,
    })
    .from(scores)
    .innerJoin(players, eq(scores.playerId, players.id))
    .where(eq(players.sessionId, id))
    .orderBy(asc(scores.delta))
    .all();

  // Deduplicate by playerId (keep first, which is best because of sort)
  const leaderboard = [];
  const seen = new Set();
  for (const s of allScores) {
    if (!seen.has(s.playerId)) {
      seen.add(s.playerId);
      leaderboard.push(s);
    }
  }

  return c.json(leaderboard);
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
