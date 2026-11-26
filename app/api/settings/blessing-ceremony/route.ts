import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";
import { DEFAULT_BLESSING_CEREMONY, type BlessingCeremonyConfig } from "@/lib/blessing-ceremony-config";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET() {
  const config = await getSetting<BlessingCeremonyConfig>("blessing-ceremony", DEFAULT_BLESSING_CEREMONY);
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const config: BlessingCeremonyConfig = {
    enabled: Boolean(body.enabled),
    note: String(body.note ?? ""),
  };
  await setSetting("blessing-ceremony", config);
  return NextResponse.json(config);
}
