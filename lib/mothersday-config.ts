export interface MothersDayConfig {
  enabled: boolean;
  bannerImage: string;
  productIds: number[];
}

export const DEFAULT_MOTHERSDAY: MothersDayConfig = {
  enabled: false,
  bannerImage: "",
  productIds: [],
};

// Super Sale items and Pink Diamond pieces (rare/limited, flagged only via
// name/description text — there's no dedicated field for it) don't get the
// extra sitewide Mother's Day 5% on top of their existing pricing.
export function isMothersDayDiscountExcluded(product: { badge: string | null; name: string; description: string }): boolean {
  if (product.badge === "super-sale") return true;
  const pinkPattern = /pink diamond|เพชรชมพู/i;
  return pinkPattern.test(product.name) || pinkPattern.test(product.description);
}
