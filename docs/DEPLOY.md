# Willyboxd — home-server deployment

Single-container deployment: the Node server serves the API and the built
client on one port, with SQLite + avatars in a mounted `data/` volume.

## 1. Configure

```bash
cp apps/server/.env.example apps/server/.env
```

Edit `apps/server/.env`:

```dotenv
NODE_ENV=development          # plain HTTP on the LAN → cookies must not be Secure
CLIENT_URL=http://<your-server-ip>:3000   # origin the app is served from
PORT=3000
DATABASE_PATH=./data/willyboxd.db
TMDB_API_KEY=your-real-tmdb-key
OMDB_API_KEY=your-real-omdb-key   # optional: IMDb/RT/Metacritic scorecards
```

- `NODE_ENV=development` keeps session cookies working over plain `http://`.
  If you later put TLS in front (e.g. Caddy), switch to `production` and set
  `CLIENT_URL` to the `https://` origin.
- `CLIENT_URL` is used for CORS. In the container the client is served
  same-origin, so it mainly matters if you access the API cross-origin.

## 2. Build and run

```bash
docker compose up -d --build
```

- App: `http://<your-server-ip>:3000`
- Health check: `http://<your-server-ip>:3000/api/health`

Data lives in `./data/` on the host (database, avatars, backups) and
survives restarts and rebuilds.

## 3. Upgrading

```bash
git pull
docker compose up -d --build
```

Database migrations run automatically at startup (`PRAGMA user_version`).

## 4. Backups

Online backup (safe while the server is running):

```bash
npx tsx scripts/backup.ts              # → data/backups/willyboxd-<date>.db
```

Schedule it with cron on the host, e.g. nightly:

```cron
0 3 * * * cd /path/to/willyboxd && npx tsx scripts/backup.ts >> data/backups/backup.log 2>&1
```

Keep a few days' worth, and occasionally copy one off the machine.

### Restore

```bash
docker compose stop
mv data/willyboxd.db data/willyboxd.db.broken
cp data/backups/willyboxd-<date>.db data/willyboxd.db
rm -f data/willyboxd.db-wal data/willyboxd.db-shm
docker compose start
```

## 5. Notes

- The server binds `0.0.0.0`, so it's reachable from other devices on your
  network. Don't port-forward it to the internet as-is: it's a plain-HTTP,
  home-network app (see `docs/BETA.md` for the dev-mode LAN guide).
- The client loads posters directly from TMDB's image CDN
  (`image.tmdb.org`); film metadata is cached in SQLite to respect API
  rate limits.
