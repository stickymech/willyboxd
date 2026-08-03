import { vi, test, expect, describe, beforeAll, afterEach } from "vitest";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_PATH = "./data/test.db";
  process.env.TMDB_API_KEY = "test-key";
  process.env.JWT_SECRET = "test-secret";
  process.env.CLIENT_URL = "http://localhost:5173";
});

import { Hono } from "hono";
import { registerAuthRoutes } from "../routes/auth";
import { db } from "../db";
import { authMiddleware } from "../middleware/auth";

function createTestApp() {
  const app = new Hono();
  app.use("*", authMiddleware);
  registerAuthRoutes(app);
  return app;
}

describe("Auth Routes", () => {
  let app: Hono;

  beforeAll(() => {
    db.exec("DELETE FROM users");
    db.exec("DELETE FROM sessions");
  });

  afterEach(() => {
    db.exec("DELETE FROM sessions");
  });

  test("register creates user and returns 201", async () => {
    app = createTestApp();
    const res = await app.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "newuser@test.com",
        username: "newuser",
        password: "password123",
      }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(201);
    const data = await res.json() as { user: { email: string; username: string } };
    expect(data.user.email).toBe("newuser@test.com");
    expect(data.user.username).toBe("newuser");
  });

  test("register rejects duplicate email", async () => {
    app = createTestApp();
    await app.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "dup@test.com",
        username: "dupuser",
        password: "password123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await app.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "dup@test.com",
        username: "otheruser",
        password: "password123",
      }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(409);
  });

  test("login returns user with session cookie", async () => {
    app = createTestApp();
    await app.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "login@test.com",
        username: "loginuser",
        password: "password123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await app.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "login@test.com", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { user: { email: string } };
    expect(data.user.email).toBe("login@test.com");

    const cookies = res.headers.get("Set-Cookie");
    expect(cookies).toContain("willyboxd_session");
  });

  test("login fails with wrong password", async () => {
    app = createTestApp();
    await app.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "wrongpw@test.com",
        username: "wrongpwuser",
        password: "password123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await app.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "wrongpw@test.com", password: "wrong" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(401);
  });

  test("logout clears session", async () => {
    app = createTestApp();
    const loginRes = await app.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "login@test.com",
        username: "loginuser",
        password: "password123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const cookie = loginRes.headers.get("Set-Cookie")?.split(";")[0] || "";

    const res = await app.request("/auth/logout", {
      method: "POST",
      headers: { cookie },
    });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("Set-Cookie");
    expect(setCookie).toContain("Max-Age=0");
  });

  test("me returns null when not authenticated", async () => {
    app = createTestApp();
    const res = await app.request("/auth/me", { method: "GET" });
    expect(res.status).toBe(200);
    const data = await res.json() as { user: null };
    expect(data.user).toBe(null);
  });
});
