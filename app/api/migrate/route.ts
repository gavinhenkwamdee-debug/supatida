import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function runMigration() {
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS igi BOOLEAN NOT NULL DEFAULT FALSE`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS gci BOOLEAN NOT NULL DEFAULT FALSE`;
  return NextResponse.json({ ok: true });
}

// GET is intentionally supported alongside POST — ADD COLUMN IF NOT EXISTS is
// idempotent and side-effect-free, so this can be triggered by just opening
// the URL in a browser instead of needing a script.
export async function GET() {
  return runMigration();
}

export async function POST() {
  return runMigration();
}
