import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";
import { DEFAULT_ABOUT, type AboutConfig } from "@/lib/about-config";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET() {
  const about = await getSetting<AboutConfig>("about", DEFAULT_ABOUT);
  return NextResponse.json(about);
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const current = await getSetting<AboutConfig>("about", DEFAULT_ABOUT);
  const updated: AboutConfig = { ...current, ...body };
  await setSetting("about", updated);
  return NextResponse.json(updated);
}
