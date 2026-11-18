import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";
import { DEFAULT_CAMPAIGN_1111, normalizeCampaign1111, isCampaignLive } from "@/lib/campaign-1111-config";

// Header only needs the on/off flag — the full config carries every product
// assignment, which would be wasted bytes on every page load. "enabled" here
// means *live* (isCampaignLive), not just the admin's switch, so the tab
// disappears on its own once endsAt passes.
export async function GET() {
  const stored = await getSetting("campaign-1111", DEFAULT_CAMPAIGN_1111);
  return NextResponse.json({ enabled: isCampaignLive(normalizeCampaign1111(stored)) });
}
