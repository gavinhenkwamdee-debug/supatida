import { NextResponse } from "next/server";
import { getStylingLookbookStats } from "@/lib/styling-lookbook-tracking";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stats = await getStylingLookbookStats();
  return NextResponse.json(stats);
}
