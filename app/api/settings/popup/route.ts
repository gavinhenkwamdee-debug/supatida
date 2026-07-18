import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";
import { DEFAULT_POPUP, type PopupConfig } from "@/lib/popup-config";

export async function GET() {
  const config = await getSetting<PopupConfig>("popup", DEFAULT_POPUP);
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  const body = await request.json();
  await setSetting("popup", body);
  return NextResponse.json(body);
}
