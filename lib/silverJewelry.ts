import { neon } from "@neondatabase/serverless";
import { unstable_cache, revalidateTag } from "next/cache";
import { getSetting, setSetting } from "./settings";
import { DEFAULT_SILVER_CONFIG } from "./silverJewelryTypes";
import type { SilverSectionConfig, SilverProduct, SilverProductInput } from "./silverJewelryTypes";

const sql = neon(process.env.DATABASE_URL!);

export type {
  SilverTier,
  SilverMediaType,
  SilverProduct,
  SilverProductInput,
  SilverBannerConfig,
  SilverPopupConfig,
  SilverTierConfig,
  SilverSectionConfig,
} from "./silverJewelryTypes";
export { SILVER_TIERS, DEFAULT_SILVER_CONFIG } from "./silverJewelryTypes";

const SILVER_CONFIG_KEY = "silver-section-config";

export async function getSilverConfig(): Promise<SilverSectionConfig> {
  const stored = await getSetting<Partial<SilverSectionConfig>>(SILVER_CONFIG_KEY, {});
  return {
    ...DEFAULT_SILVER_CONFIG,
    ...stored,
    tiers: { ...DEFAULT_SILVER_CONFIG.tiers, ...(stored.tiers || {}) },
    banner: { ...DEFAULT_SILVER_CONFIG.banner, ...(stored.banner || {}) },
    popup: { ...DEFAULT_SILVER_CONFIG.popup, ...(stored.popup || {}) },
  };
}

export async function setSilverConfig(config: SilverSectionConfig): Promise<void> {
  await setSetting(SILVER_CONFIG_KEY, config);
}

// ── Schema init ───────────────────────────────────────────
export async function initSilverDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS silver_products (
      id          SERIAL PRIMARY KEY,
      sku         TEXT NOT NULL DEFAULT '',
      name        TEXT NOT NULL,
      tier        TEXT NOT NULL DEFAULT 'starter',
      price       NUMERIC NOT NULL DEFAULT 0,
      category    TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      metal       TEXT NOT NULL DEFAULT '',
      weight      TEXT NOT NULL DEFAULT '',
      size        TEXT NOT NULL DEFAULT '',
      images      JSONB NOT NULL DEFAULT '[]',
      sold_out    BOOLEAN NOT NULL DEFAULT FALSE,
      hidden      BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order  INT NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSilverProduct(row: any): SilverProduct {
  return {
    id: row.id,
    sku: row.sku ?? "",
    name: row.name,
    tier: row.tier ?? "starter",
    price: parseFloat(row.price) || 0,
    category: row.category ?? "",
    description: row.description ?? "",
    metal: row.metal ?? "",
    weight: row.weight ?? "",
    size: row.size ?? "",
    images: row.images ?? [],
    soldOut: row.sold_out ?? false,
    hidden: row.hidden ?? false,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const _getAllSilverProducts = async (): Promise<SilverProduct[]> => {
  await initSilverDB();
  const rows = await sql`SELECT * FROM silver_products ORDER BY tier, sort_order, created_at`;
  return rows.map(toSilverProduct);
};

export const getAllSilverProducts = unstable_cache(_getAllSilverProducts, ["all-silver-products"], {
  revalidate: 60,
  tags: ["silver-products"],
});

export async function createSilverProduct(data: SilverProductInput): Promise<SilverProduct> {
  await initSilverDB();
  const rows = await sql`
    INSERT INTO silver_products
      (sku, name, tier, price, category, description, metal, weight, size, images, sold_out, hidden, sort_order)
    VALUES (
      ${data.sku}, ${data.name}, ${data.tier}, ${data.price}, ${data.category},
      ${data.description}, ${data.metal}, ${data.weight}, ${data.size},
      ${JSON.stringify(data.images)}, ${data.soldOut}, ${data.hidden}, ${data.sortOrder}
    )
    RETURNING *
  `;
  revalidateTag("silver-products", { expire: 0 });
  return toSilverProduct(rows[0]);
}

export async function updateSilverProduct(
  id: number,
  data: Partial<SilverProductInput>
): Promise<SilverProduct | null> {
  await initSilverDB();
  const rows = await sql`
    UPDATE silver_products SET
      sku          = COALESCE(${data.sku ?? null}, sku),
      name         = COALESCE(${data.name ?? null}, name),
      tier         = COALESCE(${data.tier ?? null}, tier),
      price        = COALESCE(${data.price ?? null}, price),
      category     = COALESCE(${data.category ?? null}, category),
      description  = COALESCE(${data.description ?? null}, description),
      metal        = COALESCE(${data.metal ?? null}, metal),
      weight       = COALESCE(${data.weight ?? null}, weight),
      size         = COALESCE(${data.size ?? null}, size),
      images       = COALESCE(${data.images ? JSON.stringify(data.images) : null}::jsonb, images),
      sold_out     = COALESCE(${data.soldOut ?? null}, sold_out),
      hidden       = COALESCE(${data.hidden ?? null}, hidden),
      sort_order   = COALESCE(${data.sortOrder ?? null}, sort_order),
      updated_at   = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  revalidateTag("silver-products", { expire: 0 });
  return rows[0] ? toSilverProduct(rows[0]) : null;
}

export async function deleteSilverProduct(id: number): Promise<boolean> {
  const rows = await sql`DELETE FROM silver_products WHERE id = ${id} RETURNING id`;
  revalidateTag("silver-products", { expire: 0 });
  return rows.length > 0;
}

// Bulk upsert used by the Google Sheet import — matches on SKU when present,
// otherwise always inserts a new row (an empty SKU can't be used to find an
// existing product to update).
export async function upsertSilverProductsBySku(
  items: SilverProductInput[]
): Promise<{ created: number; updated: number }> {
  await initSilverDB();
  let created = 0;
  let updated = 0;
  for (const item of items) {
    if (item.sku) {
      const existing = await sql`SELECT id FROM silver_products WHERE sku = ${item.sku} LIMIT 1`;
      if (existing[0]) {
        await updateSilverProduct(existing[0].id, item);
        updated++;
        continue;
      }
    }
    await createSilverProduct(item);
    created++;
  }
  revalidateTag("silver-products", { expire: 0 });
  return { created, updated };
}
