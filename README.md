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

> **Local LAN beta:** want to share the app with a family member over your home Wi‑Fi (e.g. on their iPhone)? See [`docs/BETA.md`](docs/BETA.md) for a step‑by‑step guide, including `NODE_ENV=development` + a `CLIENT_URL` point so auth cookies work on plain HTTP, and how to give them a separate empty database.

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
- **Authentication**: Register, login, logout, session cookies, password change, avatar upload, settings page
- **Film Discovery**: Universal search (movies + TV), popular, trending, and anime feeds
- **Film Details**: Posters, cast/crew, images, runtime, genres, tagline, overview, YouTube **trailers**
- **Critic Ratings**: IMDb, Rotten Tomatoes & Metacritic scorecards on the detail page; half‑star rating **badges on film cards** (TMDB → IMDb → RT → Metacritic fallback via a bulk `/films/ratings` endpoint + OMDB)
- **Reviews**: TMDB reviews rendered on the detail page with author avatar + source label (e.g. "via IMDb")
- **Image Proxy**: Backend image caching to conserve TMDB API quota
- **Diary**: Log films with watched date, half‑star rating, review, rewatch flag, tags; list / filter / edit / delete
- **Watchlist**: Add, remove, list, and filter films
- **Theming**: Single fixed Linear palette via semantic CSS tokens; `.btn-primary`/`.btn-secondary` classes
- **Branding**: "clapperboard at attention" product mark — favicon, header + auth-page logo, PWA manifest/launcher icons, OG social meta
- **Deployable**: `docker-compose.yml` for client + server; SQLite DB + image cache under `data/`

### Roadmap (not yet built — stubs return `Not implemented`)
- Custom lists with drag‑drop ranking
- Social features (profiles, follow, activity feed)
- Statistics dashboard
- Anime mode refinements

## License

MIT
