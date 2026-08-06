import { NextResponse } from "next/server";
import { addPoints, getCustomerById, grantCrossedTierPrivileges } from "@/lib/crm";
import { getCrmTiers } from "@/lib/crm-settings";
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

  const before = await getCustomerById(Number(id));
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const customer = await addPoints(Number(id), Math.round(points), note);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tiers = await getCrmTiers();
  const grantedPrivileges = await grantCrossedTierPrivileges(customer.id, before.points, customer.points, tiers);

  return NextResponse.json({ customer, grantedPrivileges });
}
