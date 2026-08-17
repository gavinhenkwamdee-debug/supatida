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
  campaignName: "Own Now Pay Later",
  headline: "ผ่อน 0% 3 เดือน ผ่าน Beam ได้แล้ววันนี้",
  subtext: "เฉพาะสินค้าที่ร่วมรายการ ตั้งแต่ 17 - 23 สิงหาคมเท่านั้น",
  tagline: "โอกาสพิเศษที่ไม่ได้มีบ่อยๆ",
};
