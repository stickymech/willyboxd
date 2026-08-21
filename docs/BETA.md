# Willyboxd Beta — LAN run guide

Short guide to run a **local beta over your home Wi‑Fi** and hand it to a family member (e.g. your son) on their phone or laptop. Everything stays on your home network — no cloud hosting, no Docker, no TLS.

## Prerequisites

- Node.js 20+ and npm 10+ installed.
- [TMDB API key](https://developer.themoviedb.org/docs) (free tier is fine).
- (optional but recommended) [OMDB API key](https://www.omdbapi.com/apikey) — powers IMDb/RT/Metacritic scorecards and the film‑card rating badges.
- Your machine's **LAN IP address** (so phones/laptops can reach it):
  - macOS: Hold `Option` and click the Wi‑Fi icon, or `ipconfig getifaddr en0`.
  - Windows: `ipconfig` → IPv4 Address.
  - Linux: `ip -4 addr show wlan0`/`hostname -I`.

Both you and the family member must be on the **same Wi‑Fi network**.

## 1. Configure the server

```bash
cd willyboxd
cp apps/server/.env.example apps/server/.env
```

Edit `apps/server/.env`:

```dotenv
NODE_ENV=development                      # important: keeps auth cookies non-Secure so they work over plain HTTP on the LAN
CLIENT_URL=http://<your-lan-ip>:5173      # replaces localhost so CORS + cookies allow the phone's origin
PORT=3000
DATABASE_PATH=./data/willyboxd.db
TMDB_API_KEY=your-real-tmdb-key
OMDB_API_KEY=your-real-omdb-key           # optional, enables rating scorecards
JWT_SECRET=a-random-32+char-secret-you-make-up
```

> The server binds to `0.0.0.0` by default, so it is reachable from other devices on the LAN once `CLIENT_URL` matches the LAN origin. Run in `NODE_ENV=development` for the beta: cookies stay `SameSite=Strict` + `HttpOnly` (session stays safe) but are **not** `Secure`, so Safari/iOS will keep them sent over plain `http://`. (Switch to `NODE_ENV=production` + a TLS reverse proxy later if you want HTTPS.)

## 2. Optional — give them a fresh account (separate data)

The database lives at `data/willyboxd.db`. To let them start with an **empty diary/watchlist** instead of yours, start the server with a different `DATABASE_PATH`. The easiest way is a tiny wrapper script:

```bash
# apps/server/start-son.sh  (example for one family member)
#!/usr/bin/env bash
cd "$(dirname "$0")/../../.."        # repo root
export DATABASE_PATH=./data/willyboxd-son.db
export NODE_ENV=development
export CLIENT_URL=http://<your-lan-ip>:5173
node index.js
```

Then they run `apps/server/start-son.sh`. The DB and per‑user films/ratings tables are created automatically on first request. Each person therefore has their own diary/watchlist.

## 3. Start the app (from the repo root)

```bash
npm install        # one time, after cloning
cp apps/client/.env.example apps/client/.env   # optional; the client reads the API from the server at runtime
npm run dev
```

You should see something like:

```
Server starting on port 3000
  ➜  Local:  http://localhost:5173
```

Leave that running. Both ports are serving: client `:5173` and API `:3000/api`.

## 4. Open it on the phone

On the family member’s phone (same Wi‑Fi), open Safari and go to:

```
http://<your-lan-ip>:5173
```

They will see the app. Tap **Sign In → Register** to create their account (email + username + password), then browse.

## 5. Smoke test (what to verify together)

1. **Home** loads popular films; film cards show a ★ rating badge.
2. **Search** (top‑right box or `/search`) finds a movie, filters Movies/TV.
3. Open a **film detail** page (`/films/:id`): poster, runtime, genres, cast, a YouTube **trailer** when the film has one, and the review list.
4. **Add to Watchlist** on a film; open the **Watchlist** page — it appears there with a "Remove" button.
5. **Log to Diary**: set a watched date, tap stars to rate (half‑star steps work), write a review, check Rewatch, save. Open the **Diary** page — the entry appears, with your ★ rating and tags. Edit it (change the rating) and Delete it.
6. **Logout** (header avatar → Logout), then **Login** with the same credentials — the session cookie persists across the reload.

## 6. Make it feel like an app (optional, phone only)

In Safari on the phone: tap the **share** button → **Add to Home Screen**. Willyboxd has a PWA manifest (`public/site.webmanifest`) and icon, so it launches fullscreen from its own icon.

## 7. Stop / restart

- To stop: `Ctrl+C` in the terminal that's running `npm run dev`.
- To restart: run `npm run dev` again. Any films, diary entries, and the image cache under `data/` persist between restarts.
- To reset a family member's data: delete `data/willyboxd-son.db` (or your `data/willyboxd.db`) and restart.

## Known limits of this beta

- **No cloud sync.** Everything lives on the machine running the server and only works while it's on and on the same network.
- **Plain HTTP on the LAN** (no HTTPS). Fine for home; don't expose the port to the public internet.
- **Custom lists, social (follow/feed), profile page, and stats dashboard** are not built yet (they return `Not implemented`). Diary + Watchlist are the way to track what's watched.
- A **very obscure title** with no TMDB votes or OMDB ratings may briefly show no ★ badge — it caches once OMDB has data. This is harmless and rare.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Phone says "cannot connect" / "not reachable" | Double‑check the LAN IP; confirm both devices on same Wi‑Fi; confirm server is running. |
| Login works on desktop but the phone shows "Sign in" again after refresh | `CLIENT_URL` in `apps/server/.env` must be exactly `http://<your‑lan‑ip>:5173`. |
| Film cards show no ★ badges | Confirm an OMDB key is set (or live without it; TMDB vote counts still badge most titles). |
| Search returns nothing | Confirm `TMDB_API_KEY` is set and valid. |

---

This is a local, family‑only beta. When you're ready to go beyond the LAN, swap `NODE_ENV=production` and put a reverse proxy (e.g. Caddy) with TLS in front — see the README's Docker note.
