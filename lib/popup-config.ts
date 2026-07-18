export interface PopupConfig {
  enabled: boolean;
  pages: "all" | "home" | "products";
  triggerType: "delay" | "scroll";
  delaySeconds: number;
  scrollPercent: number;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  text: string;
  ctaText: string;
  ctaLink: string;
}

export const DEFAULT_POPUP: PopupConfig = {
  enabled: false,
  pages: "all",
  triggerType: "delay",
  delaySeconds: 5,
  scrollPercent: 30,
  imageUrl: "",
  imageWidth: 400,
  imageHeight: 300,
  text: "",
  ctaText: "",
  ctaLink: "",
};
