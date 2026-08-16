import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";
import { DEFAULT_BIRTHDAY, type BirthdayConfig } from "@/lib/birthday-config";

export async function GET() {
  const config = await getSetting<BirthdayConfig>("birthday", DEFAULT_BIRTHDAY);
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  const body = await request.json();
  await setSetting("birthday", body);
  return NextResponse.json(body);
}
