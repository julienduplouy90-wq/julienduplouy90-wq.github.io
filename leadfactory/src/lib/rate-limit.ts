import { createHash } from "node:crypto";
import type { Db } from "@/lib/db/client";

export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT ?? "dev-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** Fenêtre fixe d'une heure stockée en base (fonctionne en serverless). */
export async function checkRateLimit(db: Db, key: string, limit: number, windowMinutes = 60): Promise<boolean> {
  const windowMs = windowMinutes * 60000;
  const start = new Date(Math.floor(Date.now() / windowMs) * windowMs).toISOString();
  const [row] = await db.query<{ hits: number }>(
    `insert into rate_limits (key, window_start, hits) values ($1, $2, 1)
       on conflict (key, window_start) do update set hits = rate_limits.hits + 1 returning hits`, [key, start]);
  if (Math.random() < 0.02) await db.query("delete from rate_limits where window_start < now() - interval '1 day'");
  return (row?.hits ?? 0) <= limit;
}
