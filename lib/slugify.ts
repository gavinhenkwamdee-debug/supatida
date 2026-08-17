// Turns a campaign name into a URL-safe slug, e.g. "Special Occasion" -> "special-occasion".
// Falls back to "campaign" if the name has no Latin/digit characters to work with
// (e.g. an all-Thai name), so the page never ends up with an empty/broken URL.
export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "campaign";
}
