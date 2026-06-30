import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export interface Specifications {
  [key: string]: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  specifications: Specifications;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Schema init ───────────────────────────────────────────
export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id          SERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      price       NUMERIC NOT NULL,
      category    TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      specifications JSONB NOT NULL DEFAULT '{}',
      images      JSONB NOT NULL DEFAULT '[]',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

// ── Row mapper ────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    price: parseFloat(row.price),
    category: row.category,
    description: row.description,
    specifications: row.specifications ?? {},
    images: row.images ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── CRUD ─────────────────────────────────────────────────
export async function getAllProducts(): Promise<Product[]> {
  const rows = await sql`SELECT * FROM products ORDER BY created_at DESC`;
  return rows.map(toProduct);
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const rows = await sql`SELECT * FROM products WHERE id = ${id}`;
  return rows[0] ? toProduct(rows[0]) : undefined;
}

export async function createProduct(
  data: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<Product> {
  const rows = await sql`
    INSERT INTO products (name, price, category, description, specifications, images)
    VALUES (
      ${data.name},
      ${data.price},
      ${data.category},
      ${data.description},
      ${JSON.stringify(data.specifications)},
      ${JSON.stringify(data.images)}
    )
    RETURNING *
  `;
  return toProduct(rows[0]);
}

export async function updateProduct(
  id: number,
  data: Partial<Omit<Product, "id" | "createdAt">>
): Promise<Product | null> {
  const rows = await sql`
    UPDATE products SET
      name          = COALESCE(${data.name ?? null}, name),
      price         = COALESCE(${data.price ?? null}, price),
      category      = COALESCE(${data.category ?? null}, category),
      description   = COALESCE(${data.description ?? null}, description),
      specifications = COALESCE(${data.specifications ? JSON.stringify(data.specifications) : null}::jsonb, specifications),
      images        = COALESCE(${data.images ? JSON.stringify(data.images) : null}::jsonb, images),
      updated_at    = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? toProduct(rows[0]) : null;
}

export async function deleteProduct(id: number): Promise<boolean> {
  const rows = await sql`DELETE FROM products WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export const CATEGORIES = [
  "Rings", "Necklaces", "Earrings", "Bracelets", "Pendants",
];

export const PRICE_RANGES = [
  { label: "Below ฿10,000", min: 0, max: 10000 },
  { label: "฿10,000 – ฿30,000", min: 10000, max: 30000 },
  { label: "฿30,000 – ฿50,000", min: 30000, max: 50000 },
  { label: "฿50,000 – ฿100,000", min: 50000, max: 100000 },
  { label: "฿100,000+", min: 100000, max: Infinity },
];
