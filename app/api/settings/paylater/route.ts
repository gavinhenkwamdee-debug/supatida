import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";
import { DEFAULT_PAYLATER, type PayLaterConfig } from "@/lib/paylater-config";

export async function GET() {
  const config = await getSetting<PayLaterConfig>("paylater", DEFAULT_PAYLATER);
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  const body = await request.json();
  await setSetting("paylater", body);
  return NextResponse.json(body);
}
