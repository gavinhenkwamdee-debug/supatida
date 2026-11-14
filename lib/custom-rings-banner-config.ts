export interface CustomRingsBannerConfig {
  imageUrl: string;
  // True when the uploaded image is already a finished graphic with its
  // own text/branding baked in (not a plain photo) — the page then skips
  // its own headline/description/scrim overlay instead of stacking text
  // on top of text.
  hideOverlayText: boolean;
}

export const DEFAULT_CUSTOM_RINGS_BANNER: CustomRingsBannerConfig = {
  imageUrl: "",
  hideOverlayText: false,
};
