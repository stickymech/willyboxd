import { RegisterSchema, LoginSchema, SESSION_COOKIE_NAME, SESSION_EXPIRY_DAYS, MAX_SESSIONS_PER_USER } from "@willyboxd/shared";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { requireAuth, serializeCookie, clearCookie, parseCookies } from "../middleware/auth";
import type { Context, Next } from "hono";
import type { Hono } from "hono";

const BCRYPT_ROUNDS = 12;

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function createSession(userId: string): string {
  const sessionId = uuidv4();
  const expiresAt = formatDate(new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000));

  db.prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at < datetime('now')").run(userId);

  const activeSessions = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE user_id = ?").get(userId) as { count: number };

  if (activeSessions.count >= MAX_SESSIONS_PER_USER) {
    db.prepare("DELETE FROM sessions WHERE user_id = ? ORDER BY created_at ASC LIMIT 1").run(userId);
  }

  db.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, datetime('now'))").run(
    sessionId,
    userId,
    expiresAt,
  );

  return sessionId;
}

export function registerAuthRoutes(app: Hono) {
  app.post("/auth/register", async (c: Context) => {
    const body = await c.req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: "Validation failed", details: parsed.error.errors }, 400);
    }

    const { email, username, password } = parsed.data;

    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ? OR username = ?")
      .get(email, username);

    if (existingUser) {
      return c.json({ error: "Email or username already taken" }, 409);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const userId = uuidv4();
    const now = formatDate(new Date());

    db.prepare(
      "INSERT INTO users (id, email, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(userId, email, username, passwordHash, now, now);

    const sessionId = createSession(userId);
    c.header("Set-Cookie", serializeCookie(SESSION_COOKIE_NAME, sessionId, { maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, path: "/" }));

    return c.json(
      {
        user: { id: userId, email, username, avatar: null },
      },
      201,
    );
  });

  app.post("/auth/login", async (c: Context) => {
    const body = await c.req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: "Validation failed", details: parsed.error.errors }, 400);
    }

    const { email, password } = parsed.data;

    const user = db
      .prepare("SELECT id, email, username, password_hash, avatar FROM users WHERE email = ?")
      .get(email) as {
      id: string;
      email: string;
      username: string;
      password_hash: string;
      avatar: string | null;
    } | null;

    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const sessionId = createSession(user.id);
    c.header("Set-Cookie", serializeCookie(SESSION_COOKIE_NAME, sessionId, { maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, path: "/" }));

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
    });
  });

  app.post("/auth/logout", requireAuth as unknown as (c: Context, next: Next) => Promise<void> | Response, async (c: Context) => {
    const cookies = parseCookies(c.req.header("cookie"));
    const sessionId = cookies[SESSION_COOKIE_NAME];

    if (sessionId) {
      db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    }

    c.header("Set-Cookie", clearCookie(SESSION_COOKIE_NAME));

    return c.json({ success: true });
  });

  app.get("/auth/me", async (c: Context) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ user: null });
    }
    return c.json({ user });
  });
}
