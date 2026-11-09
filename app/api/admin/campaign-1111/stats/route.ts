import { NextResponse } from "next/server";
import { getCampaign1111Stats } from "@/lib/campaign-1111-tracking";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stats = await getCampaign1111Stats();
  return NextResponse.json(stats);
}
