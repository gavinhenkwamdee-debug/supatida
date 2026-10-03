// Client-safe types + constants for the Premium Silver section — no DB or
// next/cache imports here, so client components can import runtime values
// (SILVER_TIERS, DEFAULT_SILVER_CONFIG) without accidentally pulling
// lib/silverJewelry.ts's server-only code (unstable_cache/revalidateTag)
// into the browser bundle.

export type SilverTier = "starter" | "elegance" | "luxury";
export const SILVER_TIERS: SilverTier[] = ["starter", "elegance", "luxury"];

export type SilverMediaType = "image" | "video";

export interface SilverProduct {
  id: number;
  sku: string;
  name: string;
  tier: SilverTier;
  price: number;
  category: string;
  description: string;
  metal: string;
  weight: string;
  size: string;
  images: string[];
  soldOut: boolean;
  hidden: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type SilverProductInput = Omit<SilverProduct, "id" | "createdAt" | "updatedAt">;

export interface SilverBannerConfig {
  enabled: boolean;
  mediaType: SilverMediaType;
  mediaUrl: string;
  link: string;
}

export interface SilverPopupConfig {
  enabled: boolean;
  mediaType: SilverMediaType;
  mediaUrl: string;
  heading: string;
  text: string;
  ctaText: string;
  ctaLink: string;
  triggerType: "delay" | "scroll";
  delaySeconds: number;
  scrollPercent: number;
}

export interface SilverTierConfig {
  enabled: boolean;
  label: string;
  tagline: string;
}

export interface SilverSectionConfig {
  enabled: boolean;
  tiers: Record<SilverTier, SilverTierConfig>;
  banner: SilverBannerConfig;
  popup: SilverPopupConfig;
}

export const DEFAULT_SILVER_CONFIG: SilverSectionConfig = {
  enabled: true,
  tiers: {
    starter: { enabled: true, label: "Starter", tagline: "เริ่มต้นความเรียบหรู" },
    elegance: { enabled: true, label: "Elegance", tagline: "ความสง่างามที่ลงตัว" },
    luxury: { enabled: true, label: "Luxury", tagline: "หรูหราเหนือระดับ" },
  },
  banner: { enabled: true, mediaType: "image", mediaUrl: "", link: "" },
  popup: {
    enabled: false,
    mediaType: "image",
    mediaUrl: "",
    heading: "",
    text: "",
    ctaText: "",
    ctaLink: "",
    triggerType: "delay",
    delaySeconds: 5,
    scrollPercent: 30,
  },
};
