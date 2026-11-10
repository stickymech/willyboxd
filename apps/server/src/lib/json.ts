import type { Context } from "hono";

export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; response: Response };

/**
 * Reads a JSON request body, returning a 400 JSON response (rather than an
 * unhandled 500) when the body is missing or malformed.
 */
export async function parseJsonBody(c: Context): Promise<JsonBodyResult> {
  try {
    return { ok: true, value: await c.req.json() };
  } catch {
    return { ok: false, response: c.json({ error: "Invalid JSON body" }, 400) };
  }
}
