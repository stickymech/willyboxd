# Willyboxd

A personal/family film review app inspired by Letterboxd, hosted locally.

## Stack

| Layer    | Technology                      |
| -------- | ------------------------------- |
| Frontend | Vite + React 18 + TypeScript + React Router v6 + Tailwind CSS |
| Backend  | Hono + TypeScript               |
| Database | SQLite (better-sqlite3)         |
| Film Data| TMDB API + local caching        |
| Auth     | Cookie-based sessions + bcrypt  |
| State    | TanStack Query + Zustand        |
| Testing  | Vitest                          |
| Monorepo | Turborepo                       |

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- [TMDB API key](https://developer.themoviedb.org/docs) (free)

### Setup

```bash
# Clone and install
npm install

# Configure environment
cp apps/server/.env.example apps/server/.env
# Edit apps/server/.env with your TMDB_API_KEY and JWT_SECRET

cp apps/client/.env.example apps/client/.env

# Start both apps
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3000/api

### Development Commands

```bash
npm run dev          # Start both apps in dev mode
npm run build        # Build all packages
npm run lint         # Lint all packages
npm run typecheck    # TypeScript check all packages
npm run test         # Run all tests
```

## Project Structure

```
willyboxd/
├── apps/
│   ├── client/          # Vite + React frontend
│   └── server/          # Hono API backend
├── packages/
│   └── shared/          # Shared types, schemas, constants
├── .github/workflows/   # CI pipelines
├── docker-compose.yml
└── turbo.json
```

## Features

### Currently Implemented
- **Authentication**: Register, login, logout, session management
- **Film Discovery**: Search (movies + TV), popular, trending
- **Film Details**: Posters, cast, crew, images, runtime, genres
- **Image Proxy**: Backend image caching to conserve TMDB API quota
- **Branding**: "clapperboard at attention" product mark — favicon, header + auth-page logo, PWA manifest/launcher icons, OG social meta

### Roadmap
- Diary / film logging with ratings and reviews
- Watchlist management
- Custom lists with drag-drop ranking
- User profiles and social features
- Statistics dashboard

## License

MIT
