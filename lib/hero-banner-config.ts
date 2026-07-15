export interface HeroBannerSlide {
  imageUrl: string;
  link?: string;
}

export interface HeroBannerConfig {
  slides: HeroBannerSlide[];
  enabled: boolean;
}

export const DEFAULT_HERO_BANNER: HeroBannerConfig = {
  slides: [],
  enabled: true,
};
