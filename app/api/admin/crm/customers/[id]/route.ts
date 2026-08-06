import { NextResponse } from "next/server";
import { getCustomerById, getCustomerTransactions, getCustomerPrivileges, getTierForPoints } from "@/lib/crm";
import { getCrmTiers } from "@/lib/crm-settings";
import { isAdminRequest } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const customer = await getCustomerById(Number(id));
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [transactions, privileges, tiers] = await Promise.all([
    getCustomerTransactions(customer.id),
    getCustomerPrivileges(customer.id),
    getCrmTiers(),
  ]);
  return NextResponse.json({ customer, transactions, privileges, tier: getTierForPoints(customer.points, tiers) });
}
