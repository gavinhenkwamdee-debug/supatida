import { NextResponse } from "next/server";
import { trackStylingLookbookPageView, trackStylingLookbookProductClick } from "@/lib/styling-lookbook-tracking";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const type = body?.type;

  if (type === "page_view") {
    await trackStylingLookbookPageView();
  } else if (type === "product_click") {
    const productId = Number(body?.productId);
    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    }
    await trackStylingLookbookProductClick(productId);
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
