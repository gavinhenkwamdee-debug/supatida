import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function initSettings() {
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key   TEXT PRIMARY KEY,
      value JSONB NOT NULL
    )
  `;
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  await initSettings();
  const rows = await sql`SELECT value FROM site_settings WHERE key = ${key}`;
  return rows[0] ? (rows[0].value as T) : fallback;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await initSettings();
  await sql`
    INSERT INTO site_settings (key, value)
    VALUES (${key}, ${JSON.stringify(value)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

export type { BannerConfig } from "./banner-config";
export { DEFAULT_BANNER } from "./banner-config";
