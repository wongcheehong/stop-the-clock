import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from './db/index.js';
import { sessions, players, scores, gameStarts } from './db/schema.js';
import { eq, asc, and, isNull } from 'drizzle-orm';

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

// Start a game (issues a token for anti-cheat)
app.post('/api/games/start', async (c) => {
  const body = await c.req.json();
  const { playerId } = body;

  if (playerId === undefined) {
    return c.json({ error: 'Missing playerId' }, 400);
  }

  // Check if player exists
  const player = await db
    .select()
    .from(players)
    .where(eq(players.id, playerId))
    .get();

  if (!player) {
    return c.json({ error: 'Player not found' }, 404);
  }

  // Check if player already has a score
  const existingScore = await db
    .select()
    .from(scores)
    .where(eq(scores.playerId, playerId))
    .get();

  if (existingScore) {
    return c.json({ error: 'You have already played in this session' }, 409);
  }

  // Check if player already has an unused game start token
  const existingStart = await db
    .select()
    .from(gameStarts)
    .where(and(eq(gameStarts.playerId, playerId), isNull(gameStarts.usedAt)))
    .get();

  if (existingStart) {
    // Return existing token (player clicked start again without submitting)
    return c.json({
      token: existingStart.token,
      startedAt: existingStart.startedAt,
    });
  }

  // Generate new token and record start time
  const token = crypto.randomUUID();
  const startedAt = Date.now();

  await db.insert(gameStarts).values({
    playerId,
    token,
    startedAt,
  });

  return c.json({ token, startedAt });
});

// Submit a score
app.post('/api/scores', async (c) => {
  const body = await c.req.json();
  const { playerId, timeMs, token } = body;

  if (playerId === undefined || timeMs === undefined || token === undefined) {
    return c.json({ error: 'Missing playerId, timeMs, or token' }, 400);
  }

  // Validate token exists, matches playerId, and hasn't been used
  const gameStart = await db
    .select()
    .from(gameStarts)
    .where(
      and(
        eq(gameStarts.token, token),
        eq(gameStarts.playerId, playerId),
        isNull(gameStarts.usedAt),
      ),
    )
    .get();

  if (!gameStart) {
    return c.json({ error: 'Invalid or expired game token' }, 403);
  }

  // Server-side timing validation
  const now = Date.now();
  const serverElapsed = now - gameStart.startedAt;
  const timeDiff = Math.abs(serverElapsed - timeMs);

  // Allow 1 second tolerance for network latency
  if (timeDiff > 1000) {
    return c.json(
      { error: 'Why do you cheat? Game so easy cannot beat is it? Haiya' },
      403,
    );
  }

  // Validate timeMs is within reasonable bounds (0 to 2 minutes)
  if (timeMs < 0 || timeMs > 120000) {
    return c.json({ error: 'Invalid time value' }, 400);
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

  // Mark token as used
  await db
    .update(gameStarts)
    .set({ usedAt: now })
    .where(eq(gameStarts.id, gameStart.id));

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
