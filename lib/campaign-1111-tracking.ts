import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// One row per event — a page view, or a click into a specific product from
// the campaign page. Kept separate from products.views/line_clicks (lib/db.ts)
// since those count traffic from anywhere on the site; this is scoped to
// just the 11.11 page, which is the whole point (which campaign item gets
// the most attention, not which product overall).
async function initCampaign1111Tracking() {
  await sql`
    CREATE TABLE IF NOT EXISTS campaign_1111_events (
      id BIGSERIAL PRIMARY KEY,
      kind TEXT NOT NULL,
      product_id INT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

export async function trackCampaign1111PageView(): Promise<void> {
  await initCampaign1111Tracking();
  await sql`INSERT INTO campaign_1111_events (kind) VALUES ('page_view')`;
}

export async function trackCampaign1111ProductClick(productId: number): Promise<void> {
  await initCampaign1111Tracking();
  await sql`INSERT INTO campaign_1111_events (kind, product_id) VALUES ('product_click', ${productId})`;
}

export interface Campaign1111ProductStat {
  productId: number;
  clicks: number;
}

export interface Campaign1111Stats {
  pageViews: number;
  productClicks: Campaign1111ProductStat[]; // sorted most-clicked first
}

export async function getCampaign1111Stats(): Promise<Campaign1111Stats> {
  await initCampaign1111Tracking();
  const [pageViewRows, clickRows] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM campaign_1111_events WHERE kind = 'page_view'`,
    sql`
      SELECT product_id, COUNT(*)::int AS n FROM campaign_1111_events
      WHERE kind = 'product_click'
      GROUP BY product_id
      ORDER BY n DESC
    `,
  ]);
  return {
    pageViews: pageViewRows[0]?.n ?? 0,
    productClicks: clickRows.map((r) => ({ productId: r.product_id, clicks: r.n })),
  };
}
