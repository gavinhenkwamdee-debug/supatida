import { NextResponse } from "next/server";
import { getCrmEnabled, setCrmEnabled } from "@/lib/crm-settings";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ enabled: await getCrmEnabled() });
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const enabled = Boolean(body?.enabled);
  await setCrmEnabled(enabled);
  return NextResponse.json({ enabled });
}
