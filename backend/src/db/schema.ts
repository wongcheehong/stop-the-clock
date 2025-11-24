import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const players = sqliteTable('players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').references(() => sessions.id).notNull(),
  name: text('name').notNull(),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const scores = sqliteTable('scores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  playerId: integer('player_id').references(() => players.id).notNull(),
  timeMs: integer('time_ms').notNull(), // e.g. 10050 for 10.05s
  delta: integer('delta').notNull(), // absolute difference from 10000
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
