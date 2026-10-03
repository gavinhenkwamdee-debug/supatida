import { NextResponse } from "next/server";
import { getSilverConfig } from "@/lib/silverJewelry";

export async function GET() {
  const config = await getSilverConfig();
  return NextResponse.json({ enabled: config.enabled });
}
