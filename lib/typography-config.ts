// Lets the admin pick which loaded brand font drives each of the site's two
// text roles — "heading" (the body default, used by headlines/brand name/
// product names wherever no font-sans class overrides it) and "body" (the
// .font-sans utility, used for labels/paragraphs/UI text everywhere).
// Louella is a script/accent face, deliberately left out of these two roles
// since it isn't legible as running heading or body text.
export type FontChoice = "millerBanner" | "graphie" | "georgia" | "system";

export interface TypographyConfig {
  headingFont: FontChoice;
  bodyFont: FontChoice;
}

// Body reverted to the original system default here (not Graphie) — the
// first rollout used Graphie SemiBold everywhere and read as "too bold"
// site-wide; admin can opt back into Graphie for body from this panel.
export const DEFAULT_TYPOGRAPHY: TypographyConfig = {
  headingFont: "millerBanner",
  bodyFont: "system",
};

export const FONT_LABELS: Record<FontChoice, string> = {
  millerBanner: "Miller Banner — เซอริฟหรูหรา",
  graphie: "Graphie SemiBold — ซานเซอริฟหนา",
  georgia: "Georgia — เซอริฟดั้งเดิม",
  system: "System Default — ซานเซอริฟดั้งเดิม",
};

// Actual CSS font-family stacks — kept in one place so the admin preview,
// the layout injection, and any future usage stay in sync.
export const FONT_STACK: Record<FontChoice, string> = {
  millerBanner: "var(--font-miller-banner), Georgia, 'Times New Roman', serif",
  graphie: "var(--font-graphie), system-ui, -apple-system, sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  system: "system-ui, -apple-system, sans-serif",
};
