import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";
import { DEFAULT_CUSTOM_RINGS_BANNER, type CustomRingsBannerConfig } from "@/lib/custom-rings-banner-config";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET() {
  const config = await getSetting<CustomRingsBannerConfig>("custom-rings-banner", DEFAULT_CUSTOM_RINGS_BANNER);
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const config: CustomRingsBannerConfig = { imageUrl: String(body.imageUrl ?? "") };
  await setSetting("custom-rings-banner", config);
  return NextResponse.json(config);
}
