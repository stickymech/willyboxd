## Why

The family's primary viewer is heavily into anime, but the app has no way to see or browse anime specifically. TMDB already has accurate anime titles, but its "Animation" genre (id 16) mixes Pixar/Disney/Western animation in, and there is no "anime" genre. Discovery surfaces (search, trending, popular) therefore blend anime with everything else.

## What Changes

- Add an **Anime mode** that classifies and filters content as anime:
  - Search results are filtered to anime (original language `ja`), so an "Anime only" search returns Japanese animation.
  - New **Trending Anime** and **Top Anime** browse rows on the Home page using TMDB's `anime` keyword (id `210024`) via the `discover` endpoints.
- Server: `/films/search` gains an `anime` query param; a new `/films/anime` browse endpoint is added for trending/top anime.
- Client: an "Anime" filter toggle on the Search page and an "Anime" browse section on Home.
- The `MediaItem` shape gains an `original_language` field so the client can display anime context.

Scope notes:
- Purely TMDB-native. No new API dependency, no schema/DB changes, no ID mapping. (AniList was evaluated as a search source and rejected — see design.md D1; it adds depth but not search coverage, and requires a fragile cross-source ID mapping.)
- Not a "debug" button — Anime mode is a first-class feature.

## Capabilities

### New Capabilities
- `anime-mode`: Anime classification, anime-filtered search, and anime browse (trending/top) surfaces.

### Modified Capabilities

## Impact

- `apps/server/src/services/tmdb.ts`: expose `original_language` in search normalization; add keyword/discover queries for anime browse.
- `apps/server/src/routes/tmdb.ts`: `anime` param on `/films/search`; new `/films/anime` browse route.
- `packages/shared/src/types.ts`: add `original_language` to `MediaItem`.
- `apps/client/src/routes/Search.tsx`: Anime toggle + query param.
- `apps/client/src/routes/Home.tsx`: Trending Anime / Top Anime rows.
- `apps/client/src/lib/api.ts`: new endpoint constant.
- Tests: server tmdb service + route tests; client component/route tests. All existing tests must stay green.
