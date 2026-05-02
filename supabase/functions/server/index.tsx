import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check
app.get("/make-server-038d188e/health", (c) => c.json({ status: "ok" }));

// ── Nickname sanitization ─────────────────────────────────────────────────────
// Whitelist: Unicode letters/numbers, spaces, and a small set of safe symbols.
// Everything outside this set is stripped, protecting against XSS and
// injection of any kind (the KV store isn't SQL, but defence-in-depth matters).
const NICKNAME_STRIP = /[^\p{L}\p{N} _.'\-!?]/gu;

function sanitizeNickname(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw
    .replace(/[<>]/g, "")    // strip angle brackets (XSS guard)
    .replace(/[&"]/g, "")    // strip & and " (HTML entity / attribute injection)
    .replace(/[`\\]/g, "")   // strip backticks and backslashes
    .replace(NICKNAME_STRIP, "") // strip anything outside the safe whitelist
    .trim()
    .slice(0, 20);
  return cleaned.length >= 1 ? cleaned : null;
}

// ── Global press counter ──────────────────────────────────────────────────────

app.get("/make-server-038d188e/counter", async (c) => {
  try {
    const val = await kv.get("global_counter");
    return c.json({ total: val ? parseInt(val as string, 10) : 0 });
  } catch (err) {
    console.log(`Error fetching counter: ${err}`);
    return c.json({ error: `Failed to fetch counter: ${err}` }, 500);
  }
});

app.post("/make-server-038d188e/press", async (c) => {
  try {
    const current = await kv.get("global_counter");
    const count = (current ? parseInt(current as string, 10) : 0) + 1;
    await kv.set("global_counter", count.toString());
    return c.json({ total: count });
  } catch (err) {
    console.log(`Error incrementing counter: ${err}`);
    return c.json({ error: `Failed to increment counter: ${err}` }, 500);
  }
});

// ── Leaderboard ───────────────────────────────────────────────────────────────

app.post("/make-server-038d188e/leaderboard", async (c) => {
  try {
    const body = await c.req.json();
    const { nickname: rawNick, time_ms, presses } = body;

    // Validate & sanitize nickname
    const nickname = sanitizeNickname(rawNick);
    if (!nickname) {
      return c.json({ error: "Invalid nickname: use 1–20 characters (letters, numbers, spaces, or . _ - ! ?)" }, 400);
    }

    // Validate time_ms: must be a positive finite number
    if (typeof time_ms !== "number" || !isFinite(time_ms) || time_ms <= 0) {
      return c.json({ error: "Invalid time_ms: must be a positive number" }, 400);
    }

    // Validate presses: must be a non-negative integer
    const safePresses =
      typeof presses === "number" && isFinite(presses) && presses >= 0
        ? Math.floor(presses)
        : 0;

    const key = `leaderboard_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const entry = {
      nickname,
      time_ms: Math.floor(time_ms),
      presses: safePresses,
      date: new Date().toISOString(),
    };
    await kv.set(key, JSON.stringify(entry));
    return c.json({ success: true });
  } catch (err) {
    console.log(`Error submitting leaderboard entry: ${err}`);
    return c.json({ error: `Failed to submit: ${err}` }, 500);
  }
});

app.get("/make-server-038d188e/leaderboard", async (c) => {
  try {
    const raw = await kv.getByPrefix("leaderboard_");
    const parsed = (raw as string[])
      .map((v) => { try { return JSON.parse(v); } catch { return null; } })
      .filter(Boolean)
      .sort((a, b) => a.time_ms - b.time_ms)
      .slice(0, 10);
    return c.json({ entries: parsed });
  } catch (err) {
    console.log(`Error fetching leaderboard: ${err}`);
    return c.json({ error: `Failed to fetch leaderboard: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);
