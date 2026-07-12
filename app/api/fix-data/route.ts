import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // 1. Yellow Gold → Vanilla Gold in names and specs
    await sql`UPDATE products SET name = REPLACE(name, 'Yellow Gold', 'Vanilla Gold') WHERE name LIKE '%Yellow Gold%'`;
    await sql`UPDATE products SET specifications = REPLACE(specifications::text, 'Yellow Gold', 'Vanilla Gold')::jsonb WHERE specifications::text LIKE '%Yellow Gold%'`;

    // 2. Remove "Gold" after karat numbers in names (e.g. "14K Gold" → "14K")
    for (const k of ["8K", "9K", "10K", "14K", "18K", "22K", "24K"]) {
      await sql`UPDATE products SET name = REPLACE(name, ${k + " Gold"}, ${k}) WHERE name LIKE ${"%" + k + " Gold%"}`;
      await sql`UPDATE products SET specifications = REPLACE(specifications::text, ${k + " Gold"}, ${k})::jsonb WHERE specifications::text LIKE ${"%" + k + " Gold%"}`;
    }

    // 3. Catch-all: any remaining "Gold Gold" → "Gold"
    await sql`UPDATE products SET name = REPLACE(name, 'Gold Gold', 'Gold') WHERE name LIKE '%Gold Gold%'`;
    await sql`UPDATE products SET specifications = REPLACE(specifications::text, 'Gold Gold', 'Gold')::jsonb WHERE specifications::text LIKE '%Gold Gold%'`;

    const result = await sql`SELECT COUNT(*) as total FROM products`;
    return NextResponse.json({ ok: true, total: result[0].total });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
