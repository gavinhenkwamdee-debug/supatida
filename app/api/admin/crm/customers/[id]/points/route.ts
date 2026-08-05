import { NextResponse } from "next/server";
import { addPoints } from "@/lib/crm";
import { isAdminRequest } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const points = Number(body?.points);
  const note = String(body?.note ?? "").trim();

  if (!Number.isFinite(points) || points === 0) {
    return NextResponse.json({ error: "กรอกจำนวนแต้มให้ถูกต้อง" }, { status: 400 });
  }

  const customer = await addPoints(Number(id), Math.round(points), note);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}
