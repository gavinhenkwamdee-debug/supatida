import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // 1. Yellow Gold → Vanilla Gold in product names
    await sql`UPDATE products SET name = REPLACE(name, 'Yellow Gold', 'Vanilla Gold') WHERE name LIKE '%Yellow Gold%'`;

    // 2. Yellow Gold → Vanilla Gold in specifications JSON
    await sql`UPDATE products SET specifications = REPLACE(specifications::text, 'Yellow Gold', 'Vanilla Gold')::jsonb WHERE specifications::text LIKE '%Yellow Gold%'`;

    // 3. Remove duplicate " Gold Gold" → " Gold" in names (after step 1)
    await sql`UPDATE products SET name = REGEXP_REPLACE(name, 'Gold Gold', 'Gold', 'g') WHERE name LIKE '%Gold Gold%'`;

    // 4. Same cleanup in specifications
    await sql`UPDATE products SET specifications = REGEXP_REPLACE(specifications::text, 'Gold Gold', 'Gold', 'g')::jsonb WHERE specifications::text LIKE '%Gold Gold%'`;

    const result = await sql`SELECT COUNT(*) as total FROM products`;
    return NextResponse.json({ ok: true, total: result[0].total });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
