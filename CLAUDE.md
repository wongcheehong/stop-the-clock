# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Stop the Clock" is a multiplayer timing game where players try to stop a timer as close to exactly 10 seconds as possible. Players join sessions, compete, and view a leaderboard showing the best attempts (lowest delta from 10000ms).

## Commands

### Backend (from `backend/` directory)
```bash
npm install           # Install dependencies
npm run dev           # Run dev server with hot reload (tsx watch)
npm run build         # Compile TypeScript
npm start             # Run compiled production server
npx drizzle-kit push  # Push schema changes to database
npx drizzle-kit generate  # Generate migrations
```

### Frontend (from `frontend/` directory)
```bash
npm install           # Install dependencies
npm run dev           # Run Vite dev server
npm run build         # TypeScript check + production build
npm run lint          # ESLint
npm run preview       # Preview production build
```

## Architecture

### Monorepo Structure
- **backend/**: Hono API server with Drizzle ORM and SQLite (libsql)
- **frontend/**: React 19 + Vite + TypeScript SPA

### Backend Stack
- **Hono**: Lightweight web framework running on Node.js
- **Drizzle ORM**: Type-safe SQL with SQLite/libsql
- **Database**: SQLite file (`local.db` by default, configurable via `DATABASE_URL` env var)

### Frontend Stack
- **React 19** with React Compiler (babel-plugin-react-compiler)
- **React Router v7**: Routes at `/` (Home) and `/game/:id` (Game)
- **Vite**: Dev server proxies `/api` requests to backend at `localhost:3000`

### Data Model (backend/src/db/schema.ts)
- **sessions**: Game sessions (id, createdAt)
- **players**: Players in sessions (id, sessionId, name, joinedAt)
- **scores**: Player attempts (id, playerId, timeMs, delta, createdAt)

### API Endpoints (backend/src/index.ts)
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Check session exists
- `POST /api/sessions/:id/join` - Join with player name
- `POST /api/scores` - Submit score (playerId, timeMs)
- `GET /api/sessions/:id/leaderboard` - Get best scores per player

### Frontend Architecture
- **pages/**: Route components (Home, Game)
- **hooks/**: Custom hooks extract logic from pages
  - `useGame`: Timer state machine (idle/running/stopped), score submission
  - `usePlayerSession`: Session validation and player join flow
  - `useLeaderboard`: Fetches and polls leaderboard
  - `useHome`: Home page session creation/joining logic
- **api.ts**: Centralized API client

## Development Flow

Run both servers during development:
1. Backend: `cd backend && npm run dev` (runs on port 3000)
2. Frontend: `cd frontend && npm run dev` (runs on port 5173, proxies /api to backend)
