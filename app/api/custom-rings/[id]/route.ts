import { NextResponse } from "next/server";
import { getCustomRingById } from "@/lib/customRings";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const ring = await getCustomRingById(Number(id));
  if (!ring || !ring.enabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(ring);
}
