import { Hono } from "hono";
import fs from "node:fs";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export const AVATAR_DIR = path.join(process.cwd(), "data", "avatars");
if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

export function detectImageExt(buffer: Buffer): "png" | "jpg" | null {
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }
  return null;
}

export function saveAvatarFile(buffer: Buffer): string {
  const ext = detectImageExt(buffer) ?? "png";
  const filename = `${uuidv4()}.${ext}`;
  fs.writeFileSync(path.join(AVATAR_DIR, filename), buffer);
  return `/api/avatars/${filename}`;
}

export const avatarRoutes = new Hono();

avatarRoutes.get("/:filename", async (c) => {
  const filename = c.req.param("filename");
  if (!/^[a-f0-9-]{36}\.(png|jpe?g)$/.test(filename)) {
    return c.json({ error: "Invalid filename" }, 400);
  }

  const filePath = path.join(AVATAR_DIR, path.basename(filename));
  if (!fs.existsSync(filePath)) {
    return c.json({ error: "Not found" }, 404);
  }

  const ext = path.extname(filename).toLowerCase();
  c.header("Content-Type", ext === ".png" ? "image/png" : "image/jpeg");
  c.header("Cache-Control", "public, max-age=31536000, immutable");

  return c.body(fs.readFileSync(filePath));
});
