import { NextResponse } from "next/server";
import { trackCampaign1111PageView, trackCampaign1111ProductClick } from "@/lib/campaign-1111-tracking";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const type = body?.type;

  if (type === "page_view") {
    await trackCampaign1111PageView();
  } else if (type === "product_click") {
    const productId = Number(body?.productId);
    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    }
    await trackCampaign1111ProductClick(productId);
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
