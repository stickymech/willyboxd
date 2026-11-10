/**
 * Online backup of the Willyboxd SQLite database.
 *
 * Uses better-sqlite3's backup API, so it is safe to run while the server
 * is live (WAL mode). Restores are a plain file copy.
 *
 * Usage:
 *   npx tsx scripts/backup.ts                # writes ./data/backups/willyboxd-<date>.db
 *   npx tsx scripts/backup.ts /path/out.db   # explicit target
 *
 * Honors DATABASE_PATH from the environment (default ./data/willyboxd.db).
 */
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dbPath = process.env.DATABASE_PATH || "./data/willyboxd.db";
const absoluteDbPath = dbPath.startsWith("/") ? dbPath : path.join(process.cwd(), dbPath);

const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const target = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), "data", "backups", `willyboxd-${stamp}.db`);

if (!fs.existsSync(absoluteDbPath)) {
  console.error(`✗ Database not found at ${absoluteDbPath} — nothing to back up.`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(target), { recursive: true });

async function main() {
  const source = new Database(absoluteDbPath, { readonly: true });
  try {
    await source.backup(target);
    console.log(`✓ Backed up ${absoluteDbPath} → ${target}`);
  } finally {
    source.close();
  }
}

main().catch((err) => {
  console.error("✗ Backup failed:", err);
  process.exit(1);
});
