import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import { getSetting } from "@/lib/settings";
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

  // Hidden and sold-out pieces can't be bought, so they never enter any tier.
  const products = (await getAllProducts()).filter((p) => !p.hidden && !p.soldOut);

  // Each product goes through tierOf() exactly once, so a product can only
  // ever appear in a single tab.
  const byTier: Record<CampaignTierKey, CampaignProduct[]> = { wishlist: [], mixmatch: [], extra: [] };
  for (const p of products) {
    byTier[tierOf(config, p.id)].push({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
      image: p.images.find(Boolean) ?? "",
      code: p.specifications["Product Code"] ?? "",
    });
  }
  for (const key of CAMPAIGN_TIER_KEYS) byTier[key].sort((a, b) => a.price - b.price);

  const initialTab = CAMPAIGN_TIER_KEYS.find((k) => k === tab) ?? "wishlist";

  return <Campaign1111Client config={config} productsByTier={byTier} initialTab={initialTab} />;
}
