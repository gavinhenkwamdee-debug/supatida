import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// One row per event — a /styling page view, or a click into a specific
// product tagged in a look. Same shape/reasoning as campaign_1111_events
// (lib/campaign-1111-tracking.ts): scoped to this page only, separate from
// the site-wide products.views/line_clicks counters in lib/db.ts.
async function initStylingLookbookTracking() {
  await sql`
    CREATE TABLE IF NOT EXISTS styling_lookbook_events (
      id BIGSERIAL PRIMARY KEY,
      kind TEXT NOT NULL,
      product_id INT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

export async function trackStylingLookbookPageView(): Promise<void> {
  await initStylingLookbookTracking();
  await sql`INSERT INTO styling_lookbook_events (kind) VALUES ('page_view')`;
}

export async function trackStylingLookbookProductClick(productId: number): Promise<void> {
  await initStylingLookbookTracking();
  await sql`INSERT INTO styling_lookbook_events (kind, product_id) VALUES ('product_click', ${productId})`;
}

export interface StylingLookbookProductStat {
  productId: number;
  clicks: number;
}

export interface StylingLookbookStats {
  pageViews: number;
  productClicks: StylingLookbookProductStat[]; // sorted most-clicked first
}

export async function getStylingLookbookStats(): Promise<StylingLookbookStats> {
  await initStylingLookbookTracking();
  const [pageViewRows, clickRows] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM styling_lookbook_events WHERE kind = 'page_view'`,
    sql`
      SELECT product_id, COUNT(*)::int AS n FROM styling_lookbook_events
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
