export interface BannerConfig {
  enabled: boolean;
  messages: string[];
  speed: number;
}

export const DEFAULT_BANNER: BannerConfig = {
  enabled: false,
  messages: ["Free Shipping on All Orders", "100% Lab Grown Diamonds", "IGI Certified Option"],
  speed: 4,
};
