// Client-safe (no DB / next/cache imports) — the public page, the client
// component and the admin all share these types and the pricing helpers.

export type CampaignTierKey = "wishlist" | "mixmatch" | "extra";
export const CAMPAIGN_TIER_KEYS: CampaignTierKey[] = ["wishlist", "mixmatch", "extra"];

// Tier every product falls into when the admin hasn't assigned it anywhere —
// this is what makes the three tiers collectively exhaustive.
export const DEFAULT_TIER: CampaignTierKey = "extra";

export interface CampaignTierConfig {
  percent: number;
  name: string;
  headline: string;
  // "{percent}" is replaced with the tier's discount at render time so the
  // copy can't drift out of sync when the percent is edited.
  description: string;
}

export interface Campaign1111Config {
  enabled: boolean;
  bannerImage: string;
  tiers: Record<CampaignTierKey, CampaignTierConfig>;
  // productId -> tier. A product has exactly one value (mutually exclusive);
  // anything absent is DEFAULT_TIER, so every product lands in exactly one tier.
  assignments: Record<string, CampaignTierKey>;
}

export const DEFAULT_CAMPAIGN_1111: Campaign1111Config = {
  enabled: false,
  bannerImage: "",
  tiers: {
    wishlist: {
      percent: 15,
      name: "Your Wishlist",
      headline: "เครื่องประดับเพชรพร้อมส่งที่คัดสรรมาเป็นพิเศษ",
      description: "รับส่วนลด {percent}% เฉพาะสินค้าที่ร่วมรายการ",
    },
    mixmatch: {
      percent: 11,
      name: "Your Mix & Match",
      headline: "เลือกเครื่องประดับ 2 ชิ้น จากคอลเลกชันที่ร่วมรายการ",
      description: "จับคู่ดีไซน์ได้อย่างอิสระ รับส่วนลด {percent}%",
    },
    extra: {
      percent: 5,
      name: "Your Little Extra",
      headline: "รับส่วนลด {percent}% สำหรับสินค้าพร้อมส่งอื่น ๆ ทั้งร้าน",
      description: "ที่ไม่ได้ร่วมโปรโมชั่น Your Wishlist และ Mix & Match",
    },
  },
  assignments: {},
};

export function fillPercent(text: string, percent: number): string {
  return text.replace(/\{percent\}/g, String(percent));
}

export function tierOf(config: Campaign1111Config, productId: number): CampaignTierKey {
  return config.assignments[String(productId)] ?? DEFAULT_TIER;
}

// Discounted price, always rounded UP to the next 100 baht (never down).
// Done in integer arithmetic: price * 0.85 in floating point can land a hair
// above a whole hundred (20000 * 0.85 = 17000.000000000002) and ceil() would
// then bump an exact price up a full 100.
export function campaignPrice(price: number, percent: number): number {
  const satang = Math.round(price * 100);
  const basisPoints = Math.round(percent * 100);
  const afterDiscount = satang * (10000 - basisPoints); // units of 1e-6 baht
  return Math.ceil(afterDiscount / 1e8) * 100;
}

// What the rest of the site needs to know about one product while the
// campaign is live, so a product shows the same price everywhere.
//  - "discount": Wishlist / Little Extra — a real standalone price cut.
//  - "mixmatch": the 11% only applies to a PAIR, so it has no single-item
//    price; pages show the normal price plus a pointer to the pair offer.
export type ProductCampaign =
  | { kind: "discount"; percent: number; price: number }
  | { kind: "mixmatch"; percent: number };

export function productCampaign(
  config: Campaign1111Config | null,
  product: { id: number; price: number; soldOut: boolean }
): ProductCampaign | null {
  // Sold-out pieces aren't part of the campaign (same rule as /1111).
  if (!config || !config.enabled || product.soldOut) return null;
  const tier = tierOf(config, product.id);
  const percent = config.tiers[tier].percent;
  if (tier === "mixmatch") return { kind: "mixmatch", percent };
  return { kind: "discount", percent, price: campaignPrice(product.price, percent) };
}

// Fields shared with the server so both sides agree on the exact shape.
function toNumber(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
}

function toText(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

// Whatever comes out of the settings store or an admin request is normalised
// here, so a partial/old/garbled object can never break the page.
export function normalizeCampaign1111(raw: unknown): Campaign1111Config {
  const src = (raw && typeof raw === "object" ? raw : {}) as Partial<Campaign1111Config>;
  const tiers = {} as Record<CampaignTierKey, CampaignTierConfig>;
  for (const key of CAMPAIGN_TIER_KEYS) {
    const def = DEFAULT_CAMPAIGN_1111.tiers[key];
    const t = (src.tiers?.[key] ?? {}) as Partial<CampaignTierConfig>;
    tiers[key] = {
      percent: Math.min(100, Math.max(0, toNumber(t.percent, def.percent))),
      name: toText(t.name, def.name),
      headline: toText(t.headline, def.headline),
      description: toText(t.description, def.description),
    };
  }

  const assignments: Record<string, CampaignTierKey> = {};
  for (const [id, tier] of Object.entries(src.assignments ?? {})) {
    if (/^\d+$/.test(id) && (tier === "wishlist" || tier === "mixmatch")) assignments[id] = tier;
  }

  return {
    enabled: Boolean(src.enabled),
    bannerImage: toText(src.bannerImage, ""),
    tiers,
    assignments,
  };
}
