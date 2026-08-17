export interface PayLaterConfig {
  enabled: boolean;
  bannerImage: string;
  productIds: number[];
  // All customer-facing copy — editable from admin so a new campaign
  // (different offer, different dates) never needs a code change.
  campaignName: string;
  headline: string;
  subtext: string;
  tagline: string;
}

export const DEFAULT_PAYLATER: PayLaterConfig = {
  enabled: false,
  bannerImage: "",
  productIds: [],
  campaignName: "Special Occasion",
  headline: "",
  subtext: "",
  tagline: "",
};
