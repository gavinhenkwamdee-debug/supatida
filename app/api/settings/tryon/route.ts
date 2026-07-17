import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";

export async function GET() {
  const enabled = await getSetting<boolean>("tryon-enabled", false);
  return NextResponse.json({ enabled });
}

export async function PUT(request: Request) {
  const { enabled } = await request.json();
  await setSetting("tryon-enabled", enabled);
  return NextResponse.json({ enabled });
}
