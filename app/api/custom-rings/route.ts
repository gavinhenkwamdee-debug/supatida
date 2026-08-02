import { NextResponse } from "next/server";
import { getEnabledCustomRings } from "@/lib/customRings";

export async function GET() {
  const rings = await getEnabledCustomRings();
  return NextResponse.json(rings);
}
