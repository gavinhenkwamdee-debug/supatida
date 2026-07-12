import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // 1. Yellow Gold → Vanilla Gold in names
    await sql`UPDATE products SET name = REPLACE(name, 'Yellow Gold', 'Vanilla Gold') WHERE name LIKE '%Yellow Gold%'`;

    // 2. Yellow Gold → Vanilla Gold in specifications JSON
    await sql`UPDATE products SET specifications = REPLACE(specifications::text, 'Yellow Gold', 'Vanilla Gold')::jsonb WHERE specifications::text LIKE '%Yellow Gold%'`;

    // 3. Remove "Gold" that comes right after karat e.g. "14K Gold" → "14K", "18K Gold" → "18K"
    await sql`UPDATE products SET name = REGEXP_REPLACE(name, '(\d+K) Gold', '\1', 'g') WHERE name ~ '\d+K Gold'`;

    // 4. Same for specifications
    await sql`UPDATE products SET specifications = REGEXP_REPLACE(specifications::text, '(\d+K) Gold', '\1', 'g')::jsonb WHERE specifications::text ~ '\d+K Gold'`;

    // 5. Catch-all: any remaining "Gold Gold" → "Gold"
    await sql`UPDATE products SET name = REGEXP_REPLACE(name, 'Gold Gold', 'Gold', 'g') WHERE name LIKE '%Gold Gold%'`;
    await sql`UPDATE products SET specifications = REGEXP_REPLACE(specifications::text, 'Gold Gold', 'Gold', 'g')::jsonb WHERE specifications::text LIKE '%Gold Gold%'`;

    const result = await sql`SELECT COUNT(*) as total FROM products`;
    return NextResponse.json({ ok: true, total: result[0].total });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
