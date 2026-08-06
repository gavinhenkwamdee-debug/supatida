import { NextResponse } from "next/server";
import { setPrivilegeUsed } from "@/lib/crm";
import { isAdminRequest } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string; privilegeId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { privilegeId } = await params;
  const body = await request.json().catch(() => null);
  const used = Boolean(body?.used);

  const privilege = await setPrivilegeUsed(Number(privilegeId), used);
  if (!privilege) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(privilege);
}
