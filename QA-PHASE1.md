# Phase 1 QA Checklist

Manual testing steps for the Phase 1 release of willyboxd.

## Prerequisites

- Node.js 20+ and npm 10+ installed
- [TMDB API key](https://developer.themoviedb.org/docs) obtained
- `git clone` and `npm install` completed
- Environment configured:
  ```bash
  cp apps/server/.env.example apps/server/.env
  # Edit apps/server/.env:
  #   TMDB_API_KEY=<your-real-tmdb-key>
  #   JWT_SECRET=<random-32+char-secret>
  cp apps/client/.env.example apps/client/.env
  ```

## 1. Server & API

### 1.1 Server starts
- [ ] `npm run dev` (from repo root) starts the server without errors
- [ ] Server responds at `http://localhost:3000/api`

### 1.2 Auth endpoints
| Test | Steps | Expected |
|------|-------|----------|
| Register | `POST /auth/register` with `{email, username, password}` | Returns 201 with user object |
| Register duplicate email | Register same email twice | Returns 409 |
| Login | `POST /auth/login` with valid credentials | Returns 200 with user object, sets `willyboxd_session` cookie |
| Login wrong password | `POST /auth/login` with bad password | Returns 401 |
| Logout | `POST /auth/logout` with session cookie | Returns 200, `Max-Age=0` on cookie |
| Me (authenticated) | `GET /auth/me` with session cookie | Returns 200 with user object |
| Me (unauthenticated) | `GET /auth/me` without cookie | Returns 200 with `{user: null}` |
| Session max limit | Login as same user 6 times | Oldest session evicted |

### 1.3 TMDB integration
| Test | Steps | Expected |
|------|-------|----------|
| Search films | `GET /tmdb/search?query=inception` | Returns array of film results |
| Popular films | `GET /tmdb/popular` | Returns array of popular films |
| Trending films | `GET /tmdb/trending` | Returns array of trending films |
| Film detail | `GET /tmdb/film/330457` (Spider-Man: No Way Home) | Returns `FilmDetail` with poster, backdrop, cast, crew, runtime, genres |
| Image proxy | `GET /images/t/p/w300/*.jpg` (any TMDB image path) | Returns image, cached on disk at `data/images/` |
| TV shows | `GET /tmdb/search?query=breaking bad` | Returns TV show results alongside movies |
| Rate limiting | Rapid-fire 5+ search requests | No 429 errors, ~250ms spacing between calls |

## 2. Client & UI

### 2.1 App starts
- [ ] `npm run dev` starts client at `http://localhost:5173`
- [ ] No console errors on homepage load

### 2.2 Registration flow
- [ ] Navigate to `/register`
- [ ] Fill in email, username, password
- [ ] Submit form
- [ ] Redirect to home or login page on success
- [ ] Invalid email shows validation error
- [ ] Short password shows validation error

### 2.3 Login flow
- [ ] Navigate to `/login`
- [ ] Fill in credentials
- [ ] Submit form
- [ ] Redirect to home page on success
- [ ] See user avatar / username in Header
- [ ] Wrong credentials show error message

### 2.4 Home page
- [ ] Home page shows popular films
- [ ] Film cards display poster, title, year, rating
- [ ] Clicking a film card navigates to film detail

### 2.5 Search
- [ ] Navigate to `/search`
- [ ] Type a query (e.g., "inception")
- [ ] See search results
- [ ] Filter between Movies and TV shows
- [ ] Empty query shows nothing or a placeholder

### 2.6 Film detail
- [ ] Navigate to a film detail page (via search or home)
- [ ] See film poster, title, tagline, runtime, genres, overview
- [ ] See cast list with profile photos
- [ ] See backdrop images
- [ ] Back to search/home works

### 2.7 Header / Navigation
- [ ] Header shows app logo
- [ ] Nav links: Home, Search, Diary, Watchlist, Lists
- [ ] Diary / Watchlist / Lists show stub message or empty state (they're 501 on backend)
- [ ] User avatar visible when logged in
- [ ] Logout clears session and redirects

### 2.8 RatingSelect component
- [ ] All 10 star buttons render (0.5 increments)
- [ ] Clicking a star calls `onChange` with correct half-step value
- [ ] Clear button appears when value is selected
- [ ] Clear button calls `onChange(undefined)`

## 3. Database & Files

### 3.1 Database
- [ ] `data/willyboxd.db` is created on server start
- [ ] Tables match schema: 13 tables (users, sessions, films_cached, film_images, film_cast, film_crew, film_genres, diary_entries, watchlist_items, list_items, custom_lists, list_rankings, notifications)

### 3.2 Image cache
- [ ] `data/images/` directory is created after first image proxy request
- [ ] Cached images persist between server restarts

## 4. Docker (if applicable)

- [ ] `docker compose up --build` starts both client and server
- [ ] Client accessible at `http://localhost:5173`
- [ ] Server accessible at `http://localhost:3000/api`
- [ ] Database persists in Docker volume

## 5. CI / Tests

- [ ] `npm run lint` passes with no errors
- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run test` — all 26 tests pass
- [ ] `npm run build` builds all packages successfully

## 6. Edge Cases & Cleanup

- [ ] Session cookie is `httpOnly`
- [ ] Session cookie has `SameSite=Strict`
- [ ] Session cookie expires (not a session cookie)
- [ ] Passwords are hashed with bcrypt (12 rounds) — verify DB does not store plaintext
- [ ] Test database (`data/test.db`) is not committed to git
- [ ] No secrets in git history

---

**Pass criteria:** All checkboxes above are checked.
**QA lead:** @stickymech
