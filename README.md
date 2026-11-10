# Willyboxd

A personal/family film review app inspired by Letterboxd, hosted locally.

## Stack

| Layer    | Technology                      |
| -------- | ------------------------------- |
| Frontend | Vite + React 18 + TypeScript + React Router v6 + Tailwind CSS |
| Backend  | Hono + TypeScript               |
| Database | SQLite (better-sqlite3)         |
| Film Data| TMDB + OMDB APIs + local caching|
| Auth     | Cookie-based sessions + bcrypt  |
| State    | TanStack Query                  |
| Testing  | Vitest                          |
| Monorepo | Turborepo                       |

## Getting Started

### Prerequisites
- Node.js 22+
- npm 10+
- [TMDB API key](https://developer.themoviedb.org/docs) (free)

### Setup

```bash
# Clone and install
npm install

# Configure environment
cp apps/server/.env.example apps/server/.env
# Edit apps/server/.env with your TMDB_API_KEY (and OMDB_API_KEY for IMDb/RT/Metacritic scorecards)

cp apps/client/.env.example apps/client/.env

# Start both apps
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3000/api

> **Local LAN beta:** want to share the app with a family member over your home Wi‑Fi (e.g. on their iPhone)? See [`docs/BETA.md`](docs/BETA.md) for a step‑by‑step guide, including `NODE_ENV=development` + a `CLIENT_URL` point so auth cookies work on plain HTTP, and how to give them a separate empty database.
>
> **Home-server deployment:** see [`docs/DEPLOY.md`](docs/DEPLOY.md) for the single-container Docker setup, backups, and upgrades.

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
- **Diary**: Log films with watched date, half‑star rating, review, rewatch flag, tags; list / filter / edit / delete
- **Watchlist**: Add, remove, list, and filter films
- **Stats dashboard**: films, entries, hours, average rating, top genres, year/decade breakdowns
- **Theming**: Single fixed Linear palette via semantic CSS tokens; `.btn-primary`/`.btn-secondary` classes
- **Branding**: "clapperboard at attention" product mark — favicon, header + auth-page logo, PWA manifest/launcher icons, OG social meta
- **Deployable**: single-container `docker-compose.yml` — API + client on one port, SQLite DB + backups under `data/` (see [`docs/DEPLOY.md`](docs/DEPLOY.md))

### Roadmap (next up)
- **Custom lists**: family lists (e.g. "movie night") with drag‑drop ranking (issue #32)
- **In‑app person pages**: cast cards link to a person view instead of TMDB (issue #18)
- **UI refresh**: explore alternative visual themes for the detail/home pages (issue #19)

### Not planned
- **Social features** (follows, activity feed, likes, comments) — no value for a 2–3 user household; a read‑only profile page is the likely future shape.
- **Anime mode refinements** — the universal search + anime feed cover the need for now.

## License

MIT
