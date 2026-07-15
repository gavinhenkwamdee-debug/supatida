import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";
import { DEFAULT_HERO_BANNER, type HeroBannerConfig } from "@/lib/hero-banner-config";

export async function GET() {
  const config = await getSetting<HeroBannerConfig>("hero-banner", DEFAULT_HERO_BANNER);
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  const body = await request.json();
  await setSetting("hero-banner", body);
  return NextResponse.json(body);
}
