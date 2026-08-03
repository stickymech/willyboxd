import type { Context, Next } from "hono";
import { db } from "../db";
import { SESSION_COOKIE_NAME } from "@willyboxd/shared";

export interface AuthContext {
  user: {
    id: string;
    email: string;
    username: string;
    avatar: string | null;
  };
}

declare module "hono" {
  interface ContextVariableMap {
    user: AuthContext["user"] | null;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const cookieHeader = c.req.header("cookie");
  const sessionId = parseCookies(cookieHeader)[SESSION_COOKIE_NAME];

  if (!sessionId) {
    c.set("user", null);
    return next();
  }

  try {
    const session = db
      .prepare(
        `
      SELECT s.*, u.id as user_id, u.email as user_email, u.username as user_username, u.avatar as user_avatar
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `,
      )
      .get(sessionId) as {
      user_id: string;
      user_email: string;
      user_username: string;
      user_avatar: string | null;
    } | null;

    if (session) {
      c.set("user", {
        id: session.user_id,
        email: session.user_email,
        username: session.user_username,
        avatar: session.user_avatar,
      });
    } else {
      c.set("user", null);
    }
  } catch {
    c.set("user", null);
  }

  await next();
}

export function requireAuth(c: Context, next: Next) {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Authentication required" }, 401);
  }
  return next();
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const cookie of cookieHeader.split(";")) {
    const [name, ...rest] = cookie.trim().split("=");
    if (name && rest.length > 0) {
      cookies[name] = decodeURIComponent(rest.join("="));
    }
  }

  return cookies;
}

export function serializeCookie(name: string, value: string, options: { maxAge?: number; path?: string } = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  if (options.path) {
    parts.push(`Path=${options.path}`);
  }
  parts.push("HttpOnly", "SameSite=Strict");
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function clearCookie(name: string): string {
  return `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict`;
}
