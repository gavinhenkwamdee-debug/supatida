import { neon } from "@neondatabase/serverless";
import { unstable_cache, revalidateTag } from "next/cache";

const sql = neon(process.env.DATABASE_URL!);

export async function initSettings() {
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key   TEXT PRIMARY KEY,
      value JSONB NOT NULL
    )
  `;
}

async function fetchSetting<T>(key: string, fallback: T): Promise<T> {
  await initSettings();
  const rows = await sql`SELECT value FROM site_settings WHERE key = ${key}`;
  return rows[0] ? (rows[0].value as T) : fallback;
}

// Every page view re-fetches several of these (nav toggles, banners, campaign
// copy) — caching them cuts that down to one DB round trip per key per
// minute instead of one per request, which is what was driving Neon's
// compute-hour usage sky-high. setSetting below busts the cache immediately
// on save, so admin edits still show up right away.
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const cached = unstable_cache(
    () => fetchSetting(key, fallback),
    ["site-setting", key],
    { revalidate: 60, tags: [`site-setting:${key}`] }
  );
  return cached();
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await initSettings();
  await sql`
    INSERT INTO site_settings (key, value)
    VALUES (${key}, ${JSON.stringify(value)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
  revalidateTag(`site-setting:${key}`, { expire: 0 });
}

export type { BannerConfig } from "./banner-config";
export { DEFAULT_BANNER } from "./banner-config";
