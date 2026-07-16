import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function POST() {
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS igi BOOLEAN NOT NULL DEFAULT FALSE`;
  return NextResponse.json({ ok: true });
}
