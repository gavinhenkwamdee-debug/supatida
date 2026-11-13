import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSetting, setSetting } from "@/lib/settings";
import { DEFAULT_STYLING_LOOKBOOK, normalizeStylingLookbook } from "@/lib/styling-lookbook-config";

const SETTING_KEY = "styling-lookbook";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const stored = await getSetting(SETTING_KEY, DEFAULT_STYLING_LOOKBOOK);
  return NextResponse.json(normalizeStylingLookbook(stored));
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clean = normalizeStylingLookbook(await request.json());
  await setSetting(SETTING_KEY, clean);
  return NextResponse.json(clean);
}
