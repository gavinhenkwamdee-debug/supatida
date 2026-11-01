import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getAllProducts } from "@/lib/db";
import { getSetting, setSetting } from "@/lib/settings";
import { DEFAULT_CAMPAIGN_1111, normalizeCampaign1111, type StoredAssignment } from "@/lib/campaign-1111-config";

const SETTING_KEY = "campaign-1111";

// One-time import from the admin's "Supatida 11.11 all items by group.xlsx"
// spreadsheet (Nov 2026) — [Product Code, group]. "extra" codes don't need
// an explicit assignment (it's the default), but are listed here so this
// endpoint can still report whether they're still live on the site.
const ENTRIES: [string, StoredAssignment | "extra"][] = [
  ["ready208", "wishlist"],
  ["ready231", "wishlist"],
  ["ready251", "wishlist"],
  ["ready252", "wishlist"],
  ["ready273", "wishlist"],
  ["ready280", "wishlist"],
  ["ready296", "wishlist"],
  ["ready322", "wishlist"],
  ["ready326", "wishlist"],
  ["ready327", "wishlist"],
  ["ready359", "wishlist"],
  ["ready271", "wishlist"],
  ["ready119", "wishlist"],
  ["ready12", "wishlist"],
  ["ready188", "wishlist"],
  ["ready194", "wishlist"],
  ["ready245", "wishlist"],
  ["ready246", "wishlist"],
  ["ready295", "wishlist"],
  ["ready324", "wishlist"],
  ["ready328", "wishlist"],
  ["ready334", "wishlist"],
  ["ready349", "wishlist"],
  ["ready351", "wishlist"],
  ["ready353", "wishlist"],
  ["ready356", "wishlist"],
  ["ready204", "mixmatch"],
  ["ready223", "mixmatch"],
  ["ready276", "mixmatch"],
  ["ready277", "mixmatch"],
  ["ready282", "mixmatch"],
  ["ready298", "mixmatch"],
  ["ready299", "mixmatch"],
  ["ready300", "mixmatch"],
  ["ready301", "mixmatch"],
  ["ready303", "mixmatch"],
  ["ready306", "mixmatch"],
  ["ready308", "mixmatch"],
  ["ready311", "mixmatch"],
  ["ready325", "mixmatch"],
  ["ready336", "mixmatch"],
  ["ready337", "mixmatch"],
  ["ready338", "mixmatch"],
  ["ready346", "mixmatch"],
  ["ready97", "mixmatch"],
  ["ready263", "mixmatch"],
  ["ready50", "mixmatch"],
  ["ready149", "mixmatch"],
  ["ready281", "mixmatch"],
  ["ready294", "mixmatch"],
  ["ready104", "mixmatch"],
  ["ready120", "mixmatch"],
  ["ready14", "mixmatch"],
  ["ready155", "mixmatch"],
  ["ready173", "mixmatch"],
  ["ready203", "mixmatch"],
  ["ready247", "mixmatch"],
  ["ready279", "mixmatch"],
  ["ready315", "mixmatch"],
  ["ready316", "mixmatch"],
  ["ready348", "mixmatch"],
  ["ready355", "mixmatch"],
  ["ready358", "mixmatch"],
  ["ready360", "mixmatch"],
  ["ready77", "mixmatch"],
  ["DN700016-16INCH", "mixmatch"],
  ["KN703228", "mixmatch"],
  ["KN703347", "mixmatch"],
  ["KN704924", "mixmatch"],
  ["KN704928", "mixmatch"],
  ["KN704929", "mixmatch"],
  ["KP201348LGD", "mixmatch"],
  ["KP201903", "mixmatch"],
  ["KP201924", "mixmatch"],
  ["KP201928", "mixmatch"],
  ["KP615152", "mixmatch"],
  ["ready274", "extra"],
  ["ready283", "extra"],
  ["ready309", "extra"],
  ["ready148", "extra"],
  ["ready265", "extra"],
  ["ready112", "extra"],
  ["ready113", "extra"],
  ["ready130", "extra"],
  ["ready184", "extra"],
  ["ready189", "extra"],
  ["ready347", "extra"],
  ["ready74", "extra"],
  ["ready75", "extra"],
  ["KC401770", "extra"],
  ["E42323", "extra"],
  ["KE303139", "extra"],
  ["KE303395LGD", "extra"],
  ["KE703959", "extra"],
  ["KB500967", "extra"],
  ["KB500974", "extra"],
  ["KB607473A", "extra"],
  ["KR106241A", "extra"],
  ["KR610459", "extra"],
  ["ready304", "none"],
  ["ready307", "none"],
  ["ready266", "none"],
  ["ready272", "none"],
  ["ready286", "none"],
  ["ready287", "none"],
  ["ready288", "none"],
  ["ready289", "none"],
  ["ready290", "none"],
  ["ready291", "none"],
  ["ready229", "none"],
  ["ready230", "none"],
  ["ready238", "none"],
  ["ready248", "none"],
  ["ready350", "none"],
];

const norm = (s: string) => s.trim().toLowerCase();

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await getAllProducts();
  const byCode = new Map<string, number[]>();
  for (const p of products) {
    const code = p.specifications["Product Code"];
    if (!code) continue;
    const key = norm(code);
    const list = byCode.get(key) ?? [];
    list.push(p.id);
    byCode.set(key, list);
  }

  const config = normalizeCampaign1111(await getSetting(SETTING_KEY, DEFAULT_CAMPAIGN_1111));
  const assignments = { ...config.assignments };

  const found: { code: string; tier: string; productId: number }[] = [];
  const notFound: { code: string; tier: string }[] = [];
  const duplicates: { code: string; productIds: number[] }[] = [];

  for (const [code, tier] of ENTRIES) {
    const matches = byCode.get(norm(code));
    if (!matches || matches.length === 0) {
      notFound.push({ code, tier });
      continue;
    }
    if (matches.length > 1) duplicates.push({ code, productIds: matches });

    for (const productId of matches) {
      found.push({ code, tier, productId });
      if (tier === "extra") delete assignments[String(productId)];
      else assignments[String(productId)] = tier;
    }
  }

  const next = { ...config, assignments };
  await setSetting(SETTING_KEY, next);

  const summary = { wishlist: 0, mixmatch: 0, extra: 0, none: 0 };
  for (const f of found) summary[f.tier as keyof typeof summary]++;

  return NextResponse.json({
    ok: true,
    totalEntries: ENTRIES.length,
    matched: found.length,
    unmatched: notFound.length,
    matchedByTier: summary,
    unmatchedCodes: notFound,
    duplicateCodes: duplicates,
  });
}
