// No DB import here on purpose — this is imported by client components
// (CustomRingForm) and must stay safe to bundle into the browser.
export const DIAMOND_SHAPES = ["pear", "emerald", "baguette", "heart", "oval", "round", "princess", "marquise"] as const;
export type DiamondShape = (typeof DIAMOND_SHAPES)[number];
