import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = process.env.DATABASE_PATH || "./data/willyboxd.db";

const absoluteDbPath = DB_PATH.startsWith("/") ? DB_PATH : path.join(process.cwd(), DB_PATH);

fs.mkdirSync(path.dirname(absoluteDbPath), { recursive: true });

const db = new Database(absoluteDbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const migrations: { name: string; sql: string }[] = [
  {
    name: "init_users",
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `,
  },
  {
    name: "init_films",
    sql: `
      CREATE TABLE IF NOT EXISTS films (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tmdb_id INTEGER UNIQUE NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('movie', 'tv')),
        poster_path TEXT,
        backdrop_path TEXT,
        overview TEXT,
        release_date TEXT,
        first_air_date TEXT,
        runtime INTEGER,
        vote_average REAL,
        imdb_id TEXT,
        imdb_rating REAL,
        rt_rating REAL,
        metacritic_rating REAL,
        genres_json TEXT,
        credits_json TEXT,
        images_json TEXT,
        last_updated TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `,
  },
  {
    name: "init_film_ratings",
    sql: `
      CREATE TABLE IF NOT EXISTS film_ratings (
        tmdb_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('movie', 'tv')),
        imdb_id TEXT,
        imdb_rating REAL,
        rt_rating REAL,
        metacritic_rating REAL,
        last_updated TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (tmdb_id, type)
      )
    `,
  },
  {
    name: "init_genres",
    sql: `
      CREATE TABLE IF NOT EXISTS genres (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      )
    `,
  },
  {
    name: "init_film_genres",
    sql: `
      CREATE TABLE IF NOT EXISTS film_genres (
        film_id INTEGER NOT NULL,
        genre_id INTEGER NOT NULL,
        PRIMARY KEY (film_id, genre_id),
        FOREIGN KEY (film_id) REFERENCES films(tmdb_id) ON DELETE CASCADE,
        FOREIGN KEY (genre_id) REFERENCES genres(id)
      )
    `,
  },
  {
    name: "init_diary_entries",
    sql: `
      CREATE TABLE IF NOT EXISTS diary_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        film_id INTEGER NOT NULL,
        watched_date TEXT NOT NULL,
        rating REAL CHECK(rating >= 0.5 AND rating <= 5),
        review TEXT,
        rewatch INTEGER NOT NULL DEFAULT 0,
        tags_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (film_id) REFERENCES films(tmdb_id) ON DELETE CASCADE,
        UNIQUE(user_id, film_id, watched_date)
      )
    `,
  },
  {
    name: "init_watchlist",
    sql: `
      CREATE TABLE IF NOT EXISTS watchlist (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        film_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (film_id) REFERENCES films(tmdb_id) ON DELETE CASCADE,
        UNIQUE(user_id, film_id)
      )
    `,
  },
  {
    name: "init_lists",
    sql: `
      CREATE TABLE IF NOT EXISTS lists (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        is_public INTEGER NOT NULL DEFAULT 1,
        is_ranked INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
  },
  {
    name: "init_list_items",
    sql: `
      CREATE TABLE IF NOT EXISTS list_items (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL,
        film_id INTEGER NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
        FOREIGN KEY (film_id) REFERENCES films(tmdb_id) ON DELETE CASCADE,
        UNIQUE(list_id, film_id)
      )
    `,
  },
  {
    name: "init_follows",
    sql: `
      CREATE TABLE IF NOT EXISTS follows (
        id TEXT PRIMARY KEY,
        follower_id TEXT NOT NULL,
        followee_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (followee_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(follower_id, followee_id)
      )
    `,
  },
  {
    name: "init_sessions",
    sql: `
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
  },
  {
    name: "init_review_likes",
    sql: `
      CREATE TABLE IF NOT EXISTS review_likes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        diary_entry_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (diary_entry_id) REFERENCES diary_entries(id) ON DELETE CASCADE,
        UNIQUE(user_id, diary_entry_id)
      )
    `,
  },
  {
    name: "init_comments",
    sql: `
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        diary_entry_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (diary_entry_id) REFERENCES diary_entries(id) ON DELETE CASCADE
      )
    `,
  },
  {
    name: "init_activities",
    sql: `
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
  },
];

for (const migration of migrations) {
  db.exec(migration.sql);
}

const filmsColumns = (db.prepare("SELECT name FROM pragma_table_info('films')").all() as { name: string }[]).map(
  (c) => c.name
);

if (!filmsColumns.includes("imdb_id")) db.exec("ALTER TABLE films ADD COLUMN imdb_id TEXT");
if (!filmsColumns.includes("imdb_rating")) db.exec("ALTER TABLE films ADD COLUMN imdb_rating REAL");
if (!filmsColumns.includes("rt_rating")) db.exec("ALTER TABLE films ADD COLUMN rt_rating REAL");
if (!filmsColumns.includes("metacritic_rating")) db.exec("ALTER TABLE films ADD COLUMN metacritic_rating REAL");

export { db };
export default db;
