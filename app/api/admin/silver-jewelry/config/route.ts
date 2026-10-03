import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getSilverConfig, setSilverConfig } from "@/lib/silverJewelry";
import type { SilverSectionConfig } from "@/lib/silverJewelry";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getSilverConfig());
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as SilverSectionConfig;
  await setSilverConfig(body);
  return NextResponse.json(await getSilverConfig());
}
