import { Hono } from "hono";
import { IMAGE_BASE_URL, TMDB_IMAGE_CACHE_TTL_DAYS } from "@willyboxd/shared";
import path from "node:path";
import fs from "node:fs";

const IMAGE_CACHE_DIR = path.join(process.cwd(), "data", "images");

if (!fs.existsSync(IMAGE_CACHE_DIR)) {
  fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
}

export const imageProxy = new Hono();

imageProxy.get("*", async (c) => {
  const imagePath = c.req.path.replace("/api/images", "");
  if (!imagePath || imagePath.startsWith("/")) {
    return c.json({ error: "Image path required" }, 400);
  }

  const cacheKey = imagePath.replace(/\//g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
  const cacheFile = path.join(IMAGE_CACHE_DIR, cacheKey);
  const cacheAgeFile = `${cacheFile}.meta`;

  const now = Date.now();
  const cacheTTL = TMDB_IMAGE_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

  if (fs.existsSync(cacheFile) && fs.existsSync(cacheAgeFile)) {
    const meta = JSON.parse(fs.readFileSync(cacheAgeFile, "utf-8"));
    if (now - meta.timestamp < cacheTTL) {
      const ext = path.extname(cacheFile);
      const contentType = getContentType(ext);
      c.header("Content-Type", contentType);
      c.header("Cache-Control", `public, max-age=${Math.floor(cacheTTL / 1000)}`);
      const buffer = fs.readFileSync(cacheFile);
      return c.body(buffer);
    }
  }

  const imageUrl = `${IMAGE_BASE_URL}${imagePath}`;
  const response = await fetch(imageUrl);

  if (!response.ok) {
    return c.json({ error: "Failed to fetch image" }, 502);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(cacheFile, buffer);
  fs.writeFileSync(cacheAgeFile, JSON.stringify({ timestamp: now }));

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  c.header("Content-Type", contentType);
  c.header("Cache-Control", `public, max-age=${Math.floor(cacheTTL / 1000)}`);

  return c.body(buffer);
});

function getContentType(ext: string): string {
  const types: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return types[ext] || "application/octet-stream";
}
