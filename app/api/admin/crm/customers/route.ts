import { NextResponse } from "next/server";
import { getAllCustomers, getTierForPoints } from "@/lib/crm";
import { getCrmTiers } from "@/lib/crm-settings";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const search = new URL(request.url).searchParams.get("search") || undefined;
  const [customers, tiers] = await Promise.all([getAllCustomers(search), getCrmTiers()]);
  return NextResponse.json(
    customers.map((c) => ({ ...c, tier: getTierForPoints(c.points, tiers).name }))
  );
}
