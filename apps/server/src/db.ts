import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = process.env.DATABASE_PATH || "./data/willyboxd.db";

const absoluteDbPath = DB_PATH.startsWith("/") ? DB_PATH : path.join(process.cwd(), DB_PATH);

fs.mkdirSync(path.dirname(absoluteDbPath), { recursive: true });

const db = new Database(absoluteDbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export interface Migration {
  version: number;
  name: string;
  /** DDL applied verbatim. */
  sql?: string;
  /** JS-side migration step, for logic SQLite can't express declaratively. */
  apply?: (db: Database.Database) => void;
  /**
   * Set for migrations that must toggle PRAGMA foreign_keys off (a no-op
   * inside a transaction, so these run outside one). Only used by the
   * films primary-key swap.
   */
  requiresForeignKeysOff?: boolean;
}

/**
 * The films table is created in its final shape (`tmdb_id` as primary key).
 * Databases predating that change have an `id` autoincrement column and are
 * migrated by version 2 below.
 */
const FILMS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS films (
    tmdb_id INTEGER PRIMARY KEY,
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
  );
`;

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "baseline",
    sql: `
      ${FILMS_SCHEMA}
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS film_ratings (
        tmdb_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('movie', 'tv')),
        imdb_id TEXT,
        imdb_rating REAL,
        rt_rating REAL,
        metacritic_rating REAL,
        last_updated TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (tmdb_id, type)
      );
      CREATE TABLE IF NOT EXISTS genres (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS film_genres (
        film_id INTEGER NOT NULL,
        genre_id INTEGER NOT NULL,
        PRIMARY KEY (film_id, genre_id),
        FOREIGN KEY (film_id) REFERENCES films(tmdb_id) ON DELETE CASCADE,
        FOREIGN KEY (genre_id) REFERENCES genres(id)
      );
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
      );
      CREATE TABLE IF NOT EXISTS watchlist (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        film_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (film_id) REFERENCES films(tmdb_id) ON DELETE CASCADE,
        UNIQUE(user_id, film_id)
      );
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
      );
      CREATE TABLE IF NOT EXISTS list_items (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL,
        film_id INTEGER NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
        FOREIGN KEY (film_id) REFERENCES films(tmdb_id) ON DELETE CASCADE,
        UNIQUE(list_id, film_id)
      );
      CREATE TABLE IF NOT EXISTS follows (
        id TEXT PRIMARY KEY,
        follower_id TEXT NOT NULL,
        followee_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (followee_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(follower_id, followee_id)
      );
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS review_likes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        diary_entry_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (diary_entry_id) REFERENCES diary_entries(id) ON DELETE CASCADE,
        UNIQUE(user_id, diary_entry_id)
      );
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        diary_entry_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (diary_entry_id) REFERENCES diary_entries(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_diary_user ON diary_entries(user_id);
      CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    `,
  },
  {
    version: 2,
    name: "films_tmdb_id_primary_key",
    requiresForeignKeysOff: true,
    apply(db) {
      const columns = (db.prepare("SELECT name FROM pragma_table_info('films')").all() as { name: string }[]).map(
        (c) => c.name,
      );

      // Fresh databases are created in the final shape by the baseline.
      if (!columns.includes("id")) return;

      // Databases from before the rating columns existed.
      if (!columns.includes("imdb_id")) db.exec("ALTER TABLE films ADD COLUMN imdb_id TEXT");
      if (!columns.includes("imdb_rating")) db.exec("ALTER TABLE films ADD COLUMN imdb_rating REAL");
      if (!columns.includes("rt_rating")) db.exec("ALTER TABLE films ADD COLUMN rt_rating REAL");
      if (!columns.includes("metacritic_rating")) db.exec("ALTER TABLE films ADD COLUMN metacritic_rating REAL");

      db.exec(`
        CREATE TABLE films_v2 (
          tmdb_id INTEGER PRIMARY KEY,
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
        );
        INSERT INTO films_v2 (tmdb_id, title, type, poster_path, backdrop_path, overview, release_date,
                              first_air_date, runtime, vote_average, imdb_id, imdb_rating, rt_rating,
                              metacritic_rating, genres_json, credits_json, images_json, last_updated)
          SELECT tmdb_id, title, type, poster_path, backdrop_path, overview, release_date,
                 first_air_date, runtime, vote_average, imdb_id, imdb_rating, rt_rating,
                 metacritic_rating, genres_json, credits_json, images_json, last_updated
          FROM films;
        DROP TABLE films;
        ALTER TABLE films_v2 RENAME TO films;
      `);
    },
  },
];

export function runMigrations(db: Database.Database): void {
  const current = db.pragma("user_version", { simple: true }) as number;

  for (const migration of MIGRATIONS) {
    if (migration.version <= current) continue;

    if (migration.requiresForeignKeysOff) {
      // PRAGMA foreign_keys is a no-op inside a transaction.
      db.pragma("foreign_keys = OFF");
      try {
        if (migration.sql) db.exec(migration.sql);
        migration.apply?.(db);
      } finally {
        db.pragma("foreign_keys = ON");
      }
    } else {
      db.transaction(() => {
        if (migration.sql) db.exec(migration.sql);
        migration.apply?.(db);
      })();
    }

    db.pragma(`user_version = ${migration.version}`);
  }

  const violations = db.pragma("foreign_key_check") as unknown[];
  if (violations.length > 0) {
    console.warn(`⚠️  Foreign key violations detected (${violations.length})`);
  }
}

runMigrations(db);

export { db };
export default db;
