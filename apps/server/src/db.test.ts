import { describe, test, expect } from "vitest";
import Database from "better-sqlite3";
import { runMigrations, MIGRATIONS } from "./db";

/**
 * Shape of the films table before the tmdb_id-primary-key migration
 * (auto-increment id + UNIQUE tmdb_id), with no critic-rating columns —
 * i.e. the oldest database the migration must handle.
 */
const OLD_FILMS = `
  CREATE TABLE films (
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
    genres_json TEXT,
    credits_json TEXT,
    images_json TEXT,
    last_updated TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

function seedOldDatabase(d: Database.Database) {
  d.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    ${OLD_FILMS}
    CREATE TABLE diary_entries (
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
    CREATE TABLE watchlist (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      film_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (film_id) REFERENCES films(tmdb_id) ON DELETE CASCADE,
      UNIQUE(user_id, film_id)
    );
    INSERT INTO users (id, email, username, password_hash) VALUES ('u1', 'a@b.c', 'dad', 'hash');
    INSERT INTO films (id, tmdb_id, title, type) VALUES (7, 550, 'Fight Club', 'movie');
    INSERT INTO diary_entries (id, user_id, film_id, watched_date, rating) VALUES ('d1', 'u1', 550, '2026-01-01', 4.5);
    INSERT INTO watchlist (id, user_id, film_id) VALUES ('w1', 'u1', 550);
  `);
}

function filmColumns(d: Database.Database): string[] {
  return (d.prepare("SELECT name FROM pragma_table_info('films')").all() as { name: string }[]).map((c) => c.name);
}

const LATEST_VERSION = Math.max(...MIGRATIONS.map((m) => m.version));

describe("runMigrations", () => {
  test("migrates a legacy database (auto-increment films.id) to tmdb_id primary key without data loss", () => {
    const legacy = new Database(":memory:");
    seedOldDatabase(legacy);

    runMigrations(legacy);

    // Version advanced to the latest.
    expect(legacy.pragma("user_version", { simple: true })).toBe(LATEST_VERSION);

    // films now keyed by tmdb_id, with rating columns added and id gone.
    const columns = filmColumns(legacy);
    expect(columns).not.toContain("id");
    expect(columns).toContain("tmdb_id");
    expect(columns).toContain("imdb_rating");
    expect(columns).toContain("rt_rating");
    expect(columns).toContain("metacritic_rating");

    // Data survived the swap.
    const film = legacy.prepare("SELECT tmdb_id, title FROM films").get() as { tmdb_id: number; title: string };
    expect(film).toEqual({ tmdb_id: 550, title: "Fight Club" });
    expect(legacy.prepare("SELECT COUNT(*) as n FROM diary_entries").get()).toEqual({ n: 1 });
    expect(legacy.prepare("SELECT COUNT(*) as n FROM watchlist").get()).toEqual({ n: 1 });

    // Foreign keys still enforce against films(tmdb_id) after the swap.
    expect(() =>
      legacy
        .prepare("INSERT INTO diary_entries (id, user_id, film_id, watched_date) VALUES ('d2', 'u1', 999, '2026-01-02')")
        .run(),
    ).toThrow(/FOREIGN KEY/);

    legacy.close();
  });

  test("creates a fresh database in the final shape and runs idempotently", () => {
    const fresh = new Database(":memory:");

    runMigrations(fresh);
    runMigrations(fresh); // second run must be a no-op

    expect(fresh.pragma("user_version", { simple: true })).toBe(LATEST_VERSION);

    const columns = filmColumns(fresh);
    expect(columns).not.toContain("id");
    expect(columns).toContain("tmdb_id");

    // A valid insert works end to end.
    fresh
      .prepare("INSERT INTO films (tmdb_id, title, type) VALUES (1, 'Test', 'movie')")
      .run();

    fresh.close();
  });
});
