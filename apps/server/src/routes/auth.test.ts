import { vi, test, expect, describe, beforeAll, afterAll, afterEach } from "vitest";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_PATH = "./data/test.db";
  process.env.TMDB_API_KEY = "test-key";
  process.env.JWT_SECRET = "test-secret";
  process.env.CLIENT_URL = "http://localhost:5173";
});

import { Hono } from "hono";
import { registerAuthRoutes } from "../routes/auth";
import { avatarRoutes, AVATAR_DIR, MAX_AVATAR_BYTES, saveAvatarFile } from "../routes/avatars";
import { db } from "../db";
import { authMiddleware } from "../middleware/auth";
import fs from "node:fs";
import path from "node:path";

function createTestApp() {
  const app = new Hono();
  app.use("*", authMiddleware);
  registerAuthRoutes(app);
  return app;
}

async function registerAndLogin(app: Hono, email: string, username: string, password = "password123"): Promise<string> {
  await app.request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, username, password }),
    headers: { "Content-Type": "application/json" },
  });

  const res = await app.request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier: email, password }),
    headers: { "Content-Type": "application/json" },
  });
  return res.headers.get("Set-Cookie")?.split(";")[0] || "";
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
      body: JSON.stringify({ identifier: "login@test.com", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { user: { email: string } };
    expect(data.user.email).toBe("login@test.com");

    const cookies = res.headers.get("Set-Cookie");
    expect(cookies).toContain("willyboxd_session");
  });

  test("login with username works", async () => {
    app = createTestApp();
    await app.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "username@test.com",
        username: "usernameuser",
        password: "password123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await app.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: "usernameuser", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { user: { email: string } };
    expect(data.user.email).toBe("username@test.com");
  });

  test("login fails with unknown identifier", async () => {
    const res = await app.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: "nobody@example.com", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(401);
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
      body: JSON.stringify({ identifier: "wrongpw@test.com", password: "wrong" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(401);
  });

  test("logout clears session", async () => {
    app = createTestApp();
    await app.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "logout@test.com",
        username: "logoutuser",
        password: "password123",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const loginRes = await app.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: "logoutuser", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(loginRes.status).toBe(200);

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

  test("PUT /auth/me updates avatar when authenticated", async () => {
    app = createTestApp();
    const cookie = await registerAndLogin(app, "avatar-set@test.com", "avatarsave");

    const res = await app.request("/auth/me", {
      method: "PUT",
      body: JSON.stringify({ avatar: "https://example.com/a.png" }),
      headers: { "Content-Type": "application/json", cookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { user: { avatar: string } };
    expect(data.user.avatar).toBe("https://example.com/a.png");
  });

  test("PUT /auth/me clears the avatar when set to null", async () => {
    app = createTestApp();
    const cookie = await registerAndLogin(app, "avatar-clear@test.com", "avatarclear");

    // first set a custom avatar
    await app.request("/auth/me", {
      method: "PUT",
      body: JSON.stringify({ avatar: "https://example.com/a.png" }),
      headers: { "Content-Type": "application/json", cookie },
    });

    // then clear it (mirrors the "Remove avatar" button)
    const res = await app.request("/auth/me", {
      method: "PUT",
      body: JSON.stringify({ avatar: null }),
      headers: { "Content-Type": "application/json", cookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { user: { avatar: string | null } };
    expect(data.user.avatar).toBe(null);

    // subsequent GET /auth/me reflects the cleared avatar
    const me = await app.request("/auth/me", { method: "GET", headers: { cookie } });
    const meData = await me.json() as { user: { avatar: string | null } };
    expect(meData.user.avatar).toBe(null);
  });

  test("PUT /auth/me rejects an invalid avatar URL", async () => {
    app = createTestApp();
    const cookie = await registerAndLogin(app, "avatar-bad@test.com", "avatarbad");

    const res = await app.request("/auth/me", {
      method: "PUT",
      body: JSON.stringify({ avatar: "not-a-url" }),
      headers: { "Content-Type": "application/json", cookie },
    });
    expect(res.status).toBe(400);
  });

  test("PUT /auth/me requires authentication", async () => {
    app = createTestApp();

    const res = await app.request("/auth/me", {
      method: "PUT",
      body: JSON.stringify({ avatar: "https://example.com/a.png" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(401);
  });

  test("PUT /auth/password rejects wrong current password", async () => {
    app = createTestApp();
    const cookie = await registerAndLogin(app, "pw-wrong@test.com", "pwwrong");

    const res = await app.request("/auth/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword: "wrong", newPassword: "newpassword123" }),
      headers: { "Content-Type": "application/json", cookie },
    });
    expect(res.status).toBe(401);
    const data = await res.json() as { error: string };
    expect(data.error).toBe("Current password is incorrect");
  });

  test("PUT /auth/password rejects a short new password", async () => {
    app = createTestApp();
    const cookie = await registerAndLogin(app, "pw-short@test.com", "pwshort");

    const res = await app.request("/auth/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword: "password123", newPassword: "short" }),
      headers: { "Content-Type": "application/json", cookie },
    });
    expect(res.status).toBe(400);
  });

  test("PUT /auth/password changes the password on success", async () => {
    app = createTestApp();
    const cookie = await registerAndLogin(app, "pw-ok@test.com", "pwok");

    const res = await app.request("/auth/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword: "password123", newPassword: "brandnewpw123" }),
      headers: { "Content-Type": "application/json", cookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { success: boolean };
    expect(data.success).toBe(true);

    // old password no longer works
    const oldLogin = await app.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: "pw-ok@test.com", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(oldLogin.status).toBe(401);

    // new password works
    const newLogin = await app.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: "pw-ok@test.com", password: "brandnewpw123" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(newLogin.status).toBe(200);
  });
});

describe("Avatar upload", () => {
  let app: Hono;

  beforeAll(() => {
    db.exec("DELETE FROM users");
    db.exec("DELETE FROM sessions");
    if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });
  });

  afterEach(() => {
    db.exec("DELETE FROM sessions");
  });

  afterAll(() => {
    db.exec("DELETE FROM users");
    if (fs.existsSync(AVATAR_DIR)) {
      for (const f of fs.readdirSync(AVATAR_DIR)) {
        fs.rmSync(path.join(AVATAR_DIR, f), { force: true });
      }
    }
  });

  test("POST /auth/avatar stores a PNG and returns its serve path", async () => {
    app = createTestApp();
    const cookie = await registerAndLogin(app, "upload@test.com", "uploaduser");

    const png = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0])],
      "a.png",
      { type: "image/png" },
    );
    const form = new FormData();
    form.append("avatar", png);

    const res = await app.request("/auth/avatar", { method: "POST", body: form, headers: { cookie } });
    expect(res.status).toBe(200);
    const data = await res.json() as { avatar: string };
    expect(data.avatar).toMatch(/^\/api\/avatars\/[a-f0-9-]{36}\.png$/);

    const me = await app.request("/auth/me", { method: "GET", headers: { cookie } });
    const meData = await me.json() as { user: { avatar: string | null } };
    expect(meData.user.avatar).toBe(data.avatar);
  });

  test("POST /auth/avatar rejects an unsupported image format", async () => {
    app = createTestApp();
    const cookie = await registerAndLogin(app, "upload-bad@test.com", "upbad");

    const txt = new File(["not-an-image"], "a.txt", { type: "text/plain" });
    const form = new FormData();
    form.append("avatar", txt);

    const res = await app.request("/auth/avatar", { method: "POST", body: form, headers: { cookie } });
    expect(res.status).toBe(400);
  });

  test("POST /auth/avatar rejects files over the 2MB size limit", async () => {
    app = createTestApp();
    const cookie = await registerAndLogin(app, "upload-big@test.com", "upbig");

    const big = Buffer.alloc(MAX_AVATAR_BYTES + 1, 0x89);
    const form = new FormData();
    form.append("avatar", new File([big], "a.png", { type: "image/png" }));

    const res = await app.request("/auth/avatar", { method: "POST", body: form, headers: { cookie } });
    expect(res.status).toBe(413);
  });

  test("POST /auth/avatar requires authentication", async () => {
    app = createTestApp();

    const png = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      "a.png",
      { type: "image/png" },
    );
    const form = new FormData();
    form.append("avatar", png);

    const res = await app.request("/auth/avatar", { method: "POST", body: form });
    expect(res.status).toBe(401);
  });
});

describe("Avatar serve route", () => {
  const app = new Hono();
  app.route("/avatars", avatarRoutes);

  test("serves an uploaded PNG with the correct content-type", async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]);
    const url = saveAvatarFile(png);
    const filename = path.basename(url);

    const res = await app.request(`/avatars/${filename}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf[0]).toBe(0x89);

    fs.rmSync(path.join(AVATAR_DIR, filename), { force: true });
  });

  test("rejects a filename that is not a served avatar", async () => {
    const res = await app.request("/avatars/foo.png");
    expect(res.status).toBe(400);
  });

  test("404s for a well-formed but missing avatar id", async () => {
    const res = await app.request("/avatars/00000000-0000-0000-0000-000000000000.png");
    expect(res.status).toBe(404);
  });
});
