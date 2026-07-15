import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";
import { DEFAULT_BANNER, type BannerConfig } from "@/lib/banner-config";

export async function GET() {
  const banner = await getSetting<BannerConfig>("banner", DEFAULT_BANNER);
  return NextResponse.json(banner);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const current = await getSetting<BannerConfig>("banner", DEFAULT_BANNER);
  const updated: BannerConfig = { ...current, ...body };
  await setSetting("banner", updated);
  return NextResponse.json(updated);
}
