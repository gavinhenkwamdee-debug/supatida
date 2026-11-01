import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSetting, setSetting } from "@/lib/settings";
import { DEFAULT_CAMPAIGN_1111, normalizeCampaign1111 } from "@/lib/campaign-1111-config";

const SETTING_KEY = "campaign-1111";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const stored = await getSetting(SETTING_KEY, DEFAULT_CAMPAIGN_1111);
  return NextResponse.json(normalizeCampaign1111(stored));
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clean = normalizeCampaign1111(await request.json());
  await setSetting(SETTING_KEY, clean);
  return NextResponse.json(clean);
}
