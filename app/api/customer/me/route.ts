import { NextResponse } from "next/server";
import { getCustomerById, getTierForPoints, getNextTier } from "@/lib/crm";
import { getCustomerIdFromRequest } from "@/lib/customer-auth";
import { getCrmTiers } from "@/lib/crm-settings";

export async function GET(request: Request) {
  const customerId = getCustomerIdFromRequest(request);
  if (!customerId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const customer = await getCustomerById(customerId);
  if (!customer) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const tiers = await getCrmTiers();
  return NextResponse.json({
    customer,
    tier: getTierForPoints(customer.points, tiers),
    nextTier: getNextTier(customer.points, tiers),
  });
}
