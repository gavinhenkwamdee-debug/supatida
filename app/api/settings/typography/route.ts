import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";
import { DEFAULT_TYPOGRAPHY, type TypographyConfig } from "@/lib/typography-config";

export async function GET() {
  const config = await getSetting<TypographyConfig>("typography", DEFAULT_TYPOGRAPHY);
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  const body = await request.json();
  await setSetting("typography", body);
  return NextResponse.json(body);
}
