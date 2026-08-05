import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export interface Customer {
  id: number;
  name: string;
  phone: string;
  points: number;
  createdAt: string;
}

export interface CustomerWithAuth extends Customer {
  passwordHash: string;
}

export interface PointTransaction {
  id: number;
  customerId: number;
  points: number;
  note: string;
  createdAt: string;
}

// ── Schema init ───────────────────────────────────────────
export async function initCrmDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      phone         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      points        INT NOT NULL DEFAULT 0,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS point_transactions (
      id          SERIAL PRIMARY KEY,
      customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      points      INT NOT NULL,
      note        TEXT NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

// ── Row mappers ───────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCustomer(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    points: row.points,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTransaction(row: any): PointTransaction {
  return {
    id: row.id,
    customerId: row.customer_id,
    points: row.points,
    note: row.note,
    createdAt: row.created_at,
  };
}

// ── Customers ─────────────────────────────────────────────
export async function createCustomer(name: string, phone: string, passwordHash: string): Promise<Customer> {
  await initCrmDB();
  const rows = await sql`
    INSERT INTO customers (name, phone, password_hash)
    VALUES (${name}, ${phone}, ${passwordHash})
    RETURNING *
  `;
  return toCustomer(rows[0]);
}

export async function getCustomerByPhone(phone: string): Promise<CustomerWithAuth | undefined> {
  await initCrmDB();
  const rows = await sql`SELECT * FROM customers WHERE phone = ${phone}`;
  if (!rows[0]) return undefined;
  return { ...toCustomer(rows[0]), passwordHash: rows[0].password_hash };
}

export async function getCustomerById(id: number): Promise<Customer | undefined> {
  await initCrmDB();
  const rows = await sql`SELECT * FROM customers WHERE id = ${id}`;
  return rows[0] ? toCustomer(rows[0]) : undefined;
}

export async function getAllCustomers(search?: string): Promise<Customer[]> {
  await initCrmDB();
  const rows = search
    ? await sql`
        SELECT * FROM customers
        WHERE name ILIKE ${"%" + search + "%"} OR phone ILIKE ${"%" + search + "%"}
        ORDER BY created_at DESC
      `
    : await sql`SELECT * FROM customers ORDER BY created_at DESC`;
  return rows.map(toCustomer);
}

export async function getCustomerTransactions(customerId: number): Promise<PointTransaction[]> {
  await initCrmDB();
  const rows = await sql`
    SELECT * FROM point_transactions WHERE customer_id = ${customerId} ORDER BY created_at DESC
  `;
  return rows.map(toTransaction);
}

export async function addPoints(customerId: number, points: number, note: string): Promise<Customer | undefined> {
  await initCrmDB();
  await sql`
    INSERT INTO point_transactions (customer_id, points, note)
    VALUES (${customerId}, ${points}, ${note})
  `;
  const rows = await sql`
    UPDATE customers SET points = points + ${points} WHERE id = ${customerId} RETURNING *
  `;
  return rows[0] ? toCustomer(rows[0]) : undefined;
}

// ── Tiers ─────────────────────────────────────────────────
export interface CrmTier {
  name: string;
  minPoints: number;
  discountPercent: number;
  perks: string[];
}

export const DEFAULT_TIERS: CrmTier[] = [
  { name: "Bronze", minPoints: 0, discountPercent: 0, perks: [] },
  { name: "Silver", minPoints: 1000, discountPercent: 5, perks: ["ขัดแหวนฟรี"] },
  { name: "Gold", minPoints: 3000, discountPercent: 10, perks: ["ขัดแหวนฟรี", "จัดส่งฟรี"] },
];

export function getTierForPoints(points: number, tiers: CrmTier[]): CrmTier {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  let current = sorted[0] ?? DEFAULT_TIERS[0];
  for (const tier of sorted) {
    if (points >= tier.minPoints) current = tier;
  }
  return current;
}

export function getNextTier(points: number, tiers: CrmTier[]): CrmTier | null {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  return sorted.find((t) => t.minPoints > points) ?? null;
}
