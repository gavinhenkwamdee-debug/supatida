import { NextResponse } from "next/server";
import { createCustomRingShell, getAllCustomRings } from "@/lib/customRings";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rings = await getAllCustomRings();
  return NextResponse.json(rings);
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "New Ring";
  const basePrice = Number(body.basePrice) || 0;
  const ring = await createCustomRingShell(name, basePrice);
  return NextResponse.json(ring);
}
