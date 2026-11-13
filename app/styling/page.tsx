import Link from "next/link";
import { cookies } from "next/headers";
import { getAllProducts, type Product } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { ADMIN_TOKEN_COOKIE, isAdminToken } from "@/lib/admin-auth";
import { DEFAULT_STYLING_LOOKBOOK, normalizeStylingLookbook } from "@/lib/styling-lookbook-config";
import { getActiveCampaign1111 } from "@/lib/campaign-1111";
import { productCampaign } from "@/lib/campaign-1111-config";
import StylingLookbookClient, { type ResolvedLook } from "@/components/StylingLookbookClient";

export const dynamic = "force-dynamic";

export default async function StylingLookbookPage() {
  const config = normalizeStylingLookbook(await getSetting("styling-lookbook", DEFAULT_STYLING_LOOKBOOK));

  // Same pattern as /1111: an admin can preview the full page via their
  // logged-in cookie even while it's off, so they don't have to switch it
  // on for real customers just to check how the looks they just uploaded
  // will read.
  const cookieStore = await cookies();
  const isAdmin = isAdminToken(cookieStore.get(ADMIN_TOKEN_COOKIE)?.value);
  const isAdminPreview = !config.enabled && isAdmin;

  const products = config.enabled || isAdminPreview ? await getAllProducts() : [];
  const productById = new Map(products.map((p) => [p.id, p]));
  const campaign1111 = await getActiveCampaign1111();

  // Only a look with its own photo is "ready" to show — a look an admin is
  // still mid-tagging (no photo yet) would just render as a broken image.
  const looks: ResolvedLook[] = config.looks
    .filter((l) => l.image)
    .map((l) => ({
      id: l.id,
      image: l.image,
      theme: l.theme,
      items: l.productIds
        .map((id) => productById.get(id))
        .filter((p): p is Product => p !== undefined)
        .filter((p) => !p.hidden)
        .map((p) => {
          // Mix & Match has no single-item campaign price (the 11% only
          // applies to a pair bought together) — flag it separately so the
          // page can say "this piece qualifies for Mix & Match" instead of
          // just showing it as if there were no promo on it at all.
          const pc = productCampaign(campaign1111, p);
          const campaignPrice = pc?.kind === "discount" ? pc.price : null;
          const isMixMatch = pc?.kind === "mixmatch";
          return {
            id: p.id,
            name: p.name,
            price: p.price,
            campaignPrice,
            isMixMatch,
            image: p.images.find(Boolean) ?? "",
          };
        }),
    }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--ivory)" }}>
      <div className="text-center py-6" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "white" }}>
        <Link href="/" className="inline-block">
          <h1 className="text-2xl tracking-[0.2em]" style={{ color: "var(--charcoal)" }}>SUPATIDA</h1>
          <p className="text-xs tracking-[0.3em] uppercase mt-1 font-sans" style={{ color: "var(--muted)" }}>
            Lab Grown Diamond Jewelry
          </p>
        </Link>
      </div>

      {!config.enabled && !isAdminPreview ? (
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>หน้านี้ยังไม่เปิดให้ชมตอนนี้</p>
        </div>
      ) : (
        <StylingLookbookClient looks={looks} isAdminPreview={isAdminPreview} />
      )}
    </div>
  );
}
