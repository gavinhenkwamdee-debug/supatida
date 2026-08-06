import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export interface Customer {
  id: number;
  name: string;
  phone: string;
  points: number;
  birthday: string | null;
  budgetRange: string | null;
  interests: string[];
  interestsOther: string | null;
  createdAt: string;
}

export interface CustomerWithAuth extends Customer {
  passwordHash: string;
}

export interface NewCustomerInput {
  name: string;
  phone: string;
  passwordHash: string;
  birthday: string | null;
  budgetRange: string | null;
  interests: string[];
  interestsOther: string | null;
  pdpaConsent: boolean;
}

export interface PointTransaction {
  id: number;
  customerId: number;
  points: number;
  note: string;
  createdAt: string;
}

export interface PrivilegeGrant {
  id: number;
  customerId: number;
  title: string;
  image: string | null;
  source: "signup" | "tier" | "manual";
  sourceDetail: string | null;
  note: string;
  used: boolean;
  usedAt: string | null;
  createdAt: string;
}

// A perk as defined on a tier or as a welcome bonus — becomes a PrivilegeGrant when awarded.
export interface PerkDef {
  title: string;
  image: string | null;
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
      birthday        DATE,
      budget_range    TEXT,
      interests       TEXT[] NOT NULL DEFAULT '{}',
      interests_other TEXT,
      pdpa_consent_at TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS birthday DATE`;
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS budget_range TEXT`;
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS interests TEXT[] NOT NULL DEFAULT '{}'`;
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS interests_other TEXT`;
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS pdpa_consent_at TIMESTAMPTZ`;

  await sql`
    CREATE TABLE IF NOT EXISTS point_transactions (
      id          SERIAL PRIMARY KEY,
      customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      points      INT NOT NULL,
      note        TEXT NOT NULL DEFAULT '',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS customer_privileges (
      id            SERIAL PRIMARY KEY,
      customer_id   INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      title         TEXT NOT NULL,
      image         TEXT,
      source        TEXT NOT NULL DEFAULT 'manual',
      source_detail TEXT,
      note          TEXT NOT NULL DEFAULT '',
      used          BOOLEAN NOT NULL DEFAULT FALSE,
      used_at       TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE customer_privileges ADD COLUMN IF NOT EXISTS image TEXT`;
}

// ── Row mappers ───────────────────────────────────────────
// The pg driver parses DATE columns into a local-time Date object (not UTC midnight),
// so we must read local getters here — .toISOString() would shift the day on
// servers whose local timezone is ahead of UTC (e.g. Thailand, UTC+7).
function formatDateOnly(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCustomer(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    points: row.points,
    birthday: formatDateOnly(row.birthday),
    budgetRange: row.budget_range ?? null,
    interests: Array.isArray(row.interests) ? row.interests : [],
    interestsOther: row.interests_other ?? null,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPrivilege(row: any): PrivilegeGrant {
  return {
    id: row.id,
    customerId: row.customer_id,
    title: row.title,
    image: row.image ?? null,
    source: row.source,
    sourceDetail: row.source_detail ?? null,
    note: row.note ?? "",
    used: row.used,
    usedAt: row.used_at,
    createdAt: row.created_at,
  };
}

// ── Customers ─────────────────────────────────────────────
export async function createCustomer(input: NewCustomerInput): Promise<Customer> {
  await initCrmDB();
  const rows = await sql`
    INSERT INTO customers
      (name, phone, password_hash, birthday, budget_range, interests, interests_other, pdpa_consent_at)
    VALUES (
      ${input.name}, ${input.phone}, ${input.passwordHash}, ${input.birthday}, ${input.budgetRange},
      ${input.interests}, ${input.interestsOther}, ${input.pdpaConsent ? sql`NOW()` : null}
    )
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

// ── Privileges ────────────────────────────────────────────
export async function getCustomerPrivileges(customerId: number): Promise<PrivilegeGrant[]> {
  await initCrmDB();
  const rows = await sql`
    SELECT * FROM customer_privileges WHERE customer_id = ${customerId} ORDER BY created_at DESC
  `;
  return rows.map(toPrivilege);
}

export async function grantPrivilege(
  customerId: number,
  title: string,
  source: "signup" | "tier" | "manual",
  sourceDetail: string | null = null,
  note = "",
  image: string | null = null
): Promise<PrivilegeGrant> {
  await initCrmDB();
  const rows = await sql`
    INSERT INTO customer_privileges (customer_id, title, image, source, source_detail, note)
    VALUES (${customerId}, ${title}, ${image}, ${source}, ${sourceDetail}, ${note})
    RETURNING *
  `;
  return toPrivilege(rows[0]);
}

export async function setPrivilegeUsed(privilegeId: number, used: boolean): Promise<PrivilegeGrant | undefined> {
  await initCrmDB();
  const rows = await sql`
    UPDATE customer_privileges
    SET used = ${used}, used_at = ${used ? sql`NOW()` : null}
    WHERE id = ${privilegeId}
    RETURNING *
  `;
  return rows[0] ? toPrivilege(rows[0]) : undefined;
}

// Grants every perk of each tier newly crossed between oldPoints and newPoints (exclusive/inclusive),
// so a big manual point jump that skips a tier still grants that tier's perks.
export async function grantCrossedTierPrivileges(
  customerId: number,
  oldPoints: number,
  newPoints: number,
  tiers: CrmTier[]
): Promise<PrivilegeGrant[]> {
  const crossed = tiers
    .filter((t) => t.minPoints > oldPoints && t.minPoints <= newPoints)
    .sort((a, b) => a.minPoints - b.minPoints);

  const granted: PrivilegeGrant[] = [];
  for (const tier of crossed) {
    for (const perk of tier.perks) {
      granted.push(await grantPrivilege(customerId, perk.title, "tier", tier.name, "", perk.image));
    }
  }
  return granted;
}

// ── Tiers ─────────────────────────────────────────────────
export interface CrmTier {
  name: string;
  minPoints: number;
  discountPercent: number;
  perks: PerkDef[];
}

export const DEFAULT_TIERS: CrmTier[] = [
  { name: "Bronze", minPoints: 0, discountPercent: 0, perks: [] },
  { name: "Silver", minPoints: 1000, discountPercent: 5, perks: [{ title: "ขัดแหวนฟรี", image: null }] },
  {
    name: "Gold",
    minPoints: 3000,
    discountPercent: 10,
    perks: [{ title: "ขัดแหวนฟรี", image: null }, { title: "จัดส่งฟรี", image: null }],
  },
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
