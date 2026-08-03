import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";
import { DEFAULT_MOTHERSDAY, type MothersDayConfig } from "@/lib/mothersday-config";

export async function GET() {
  const config = await getSetting<MothersDayConfig>("mothersday", DEFAULT_MOTHERSDAY);
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  const body = await request.json();
  await setSetting("mothersday", body);
  return NextResponse.json(body);
}
