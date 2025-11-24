# ⏱️ Stop the Clock

A multiplayer timing game where players compete to stop a timer as close to exactly **10 seconds** as possible!

## ✨ Features

- 🎮 **Multiplayer Sessions** - Create and share game sessions with friends
- ⏰ **Precision Timing** - Test your internal clock by stopping at exactly 10 seconds
- 🏆 **Live Leaderboard** - See how you rank against other players in real-time
- 📱 **Responsive Design** - Play on any device
- ⚡ **Real-time Updates** - Leaderboard updates automatically

## 🛠️ Tech Stack

### Backend
- **[Hono](https://hono.dev/)** - Lightweight, ultrafast web framework
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe SQL with TypeScript
- **SQLite (libsql)** - Simple, reliable database
- **Node.js** - Runtime environment

### Frontend
- **[React 19](https://react.dev/)** - With React Compiler for optimized performance
- **[Vite](https://vitejs.dev/)** - Next-generation frontend tooling
- **[React Router v7](https://reactrouter.com/)** - Client-side routing
- **TypeScript** - Type-safe JavaScript

## 📁 Project Structure

```
stop-the-clock/
├── backend/          # Hono API server
│   ├── src/
│   │   ├── db/       # Database schema and connection
│   │   └── index.ts  # API routes
│   └── package.json
├── frontend/         # React SPA
│   ├── src/
│   │   ├── pages/    # Route components
│   │   ├── hooks/    # Custom React hooks
│   │   └── api.ts    # API client
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/stop-the-clock.git
   cd stop-the-clock
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Initialize the database**
   ```bash
   npx drizzle-kit push
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the App

You'll need two terminal windows:

**Terminal 1 - Backend (port 3000)**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend (port 5173)**
```bash
cd frontend
npm run dev
```

Open your browser and navigate to `http://localhost:5173` 🎉

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sessions` | Create a new game session |
| `GET` | `/api/sessions/:id` | Check if session exists |
| `POST` | `/api/sessions/:id/join` | Join a session with player name |
| `POST` | `/api/scores` | Submit your score |
| `GET` | `/api/sessions/:id/leaderboard` | Get session leaderboard |
| `GET` | `/api/players/:id/has-score` | Check if player already played |

## 🎯 How to Play

1. **Create or Join** - Start a new session or join an existing one with a game code
2. **Enter Your Name** - Let others know who you are
3. **Start the Timer** - Click to begin the countdown
4. **Stop at 10 Seconds** - Try to stop as close to 10.000 seconds as possible
5. **Check the Leaderboard** - See how your timing compares to others!

> 💡 **Pro Tip:** The player with the smallest delta (difference from 10 seconds) wins!

## 🏗️ Building for Production

**Backend**
```bash
cd backend
npm run build
npm start
```

**Frontend**
```bash
cd frontend
npm run build
npm run preview
```

## 📄 License

MIT License - feel free to use this project for learning or fun!

---

Made with ❤️ and ⏱️
