import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getAllProducts } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { ADMIN_TOKEN_COOKIE, isAdminToken } from "@/lib/admin-auth";
import {
  DEFAULT_CAMPAIGN_1111,
  normalizeCampaign1111,
  tierOf,
  CAMPAIGN_TIER_KEYS,
  type CampaignTierKey,
} from "@/lib/campaign-1111-config";
import Campaign1111Client, { type CampaignProduct } from "@/components/Campaign1111Client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "11.11 Campaign",
  description: "โปรโมชั่น 11.11 — Your Wishlist ลด 15%, Your Mix & Match ลด 11%, Your Little Extra ลด 5%",
};

export default async function Campaign1111Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const config = normalizeCampaign1111(await getSetting("campaign-1111", DEFAULT_CAMPAIGN_1111));

  // Admin can preview the full page via their logged-in cookie even while
  // the campaign is off — customers without that cookie still see the
  // "disabled" placeholder, so the page stays invisible to real shoppers
  // right up until the admin flips it on.
  const cookieStore = await cookies();
  const isAdmin = isAdminToken(cookieStore.get(ADMIN_TOKEN_COOKIE)?.value);
  const isAdminPreview = !config.enabled && isAdmin;

  // Hidden pieces never enter any tier, but sold-out ones stay — shown with
  // a "SOLD OUT" overlay in their normal (price-sorted) spot instead of
  // disappearing, so customers watching the page see pieces sell out one by
  // one in place, which is the point (each piece is one-off stock).
  const products = (await getAllProducts()).filter((p) => !p.hidden);

  // Each product goes through tierOf() exactly once, so a product can only
  // ever appear in a single tab. "none" means explicitly opted out of the
  // campaign, so it never lands in any tab at all.
  const byTier: Record<CampaignTierKey, CampaignProduct[]> = { wishlist: [], mixmatch: [], extra: [] };
  for (const p of products) {
    const tier = tierOf(config, p.id);
    if (tier === "none") continue;
    byTier[tier].push({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      image: p.images.find(Boolean) ?? "",
      code: p.specifications["Product Code"] ?? "",
      soldOut: p.soldOut,
    });
  }
  for (const key of CAMPAIGN_TIER_KEYS) byTier[key].sort((a, b) => a.price - b.price);

  const initialTab = CAMPAIGN_TIER_KEYS.find((k) => k === tab) ?? "wishlist";

  return <Campaign1111Client config={config} productsByTier={byTier} initialTab={initialTab} isAdminPreview={isAdminPreview} />;
}
