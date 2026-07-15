export interface HeroBannerSlide {
  imageUrl: string;
  link?: string;
}

export interface HeroBannerConfig {
  slides: HeroBannerSlide[];
}

export const DEFAULT_HERO_BANNER: HeroBannerConfig = {
  slides: [],
};
