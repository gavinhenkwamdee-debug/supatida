export interface StylingLook {
  id: string;
  image: string;
  theme: string;
  productIds: number[];
}

export interface StylingLookbookConfig {
  enabled: boolean;
  bannerImage: string;
  looks: StylingLook[];
}

export const DEFAULT_STYLING_LOOKBOOK: StylingLookbookConfig = {
  enabled: false,
  bannerImage: "",
  looks: [],
};

function toText(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

// Whatever comes out of the settings store or an admin request is normalised
// here, so a partial/old/garbled object can never break the page.
export function normalizeStylingLookbook(raw: unknown): StylingLookbookConfig {
  const src = (raw && typeof raw === "object" ? raw : {}) as Partial<StylingLookbookConfig>;
  const looks: StylingLook[] = Array.isArray(src.looks)
    ? src.looks.map((l, i) => {
        const look = (l && typeof l === "object" ? l : {}) as Partial<StylingLook>;
        return {
          id: toText(look.id, `look-${i}`),
          image: toText(look.image, ""),
          theme: toText(look.theme, ""),
          productIds: Array.isArray(look.productIds)
            ? look.productIds.filter((id): id is number => typeof id === "number" && Number.isFinite(id))
            : [],
        };
      })
    : [];

  return {
    enabled: Boolean(src.enabled),
    bannerImage: toText(src.bannerImage, ""),
    looks,
  };
}
