import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_out BOOLEAN NOT NULL DEFAULT FALSE`;
  return NextResponse.json({ ok: true });
}
