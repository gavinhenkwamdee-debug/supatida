// No DB import here on purpose — this is imported by client components
// (CustomRingForm, CustomRingConfigurator) and must stay safe to bundle into the browser.
export const DIAMOND_SHAPES = ["pear", "emerald", "baguette", "heart", "oval", "round", "princess", "marquise"] as const;
export type DiamondShape = (typeof DIAMOND_SHAPES)[number];

export const DIAMOND_SHAPE_LABELS: Record<string, string> = {
  pear: "ทรงหยดน้ำ (Pear)",
  emerald: "ทรงมรกต (Emerald)",
  baguette: "ทรงแบเกตต์ (Baguette)",
  heart: "ทรงหัวใจ (Heart)",
  oval: "ทรงไข่ (Oval)",
  round: "ทรงกลม (Round)",
  princess: "ทรงเหลี่ยม (Princess)",
  marquise: "ทรงมาร์คีส์ (Marquise)",
};
