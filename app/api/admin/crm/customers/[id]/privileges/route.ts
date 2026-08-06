import { NextResponse } from "next/server";
import { getCustomerPrivileges, grantPrivilege } from "@/lib/crm";
import { isAdminRequest } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  return NextResponse.json(await getCustomerPrivileges(Number(id)));
}

export async function POST(request: Request, { params }: Params) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const note = String(body?.note ?? "").trim();

  if (!title) {
    return NextResponse.json({ error: "กรอกชื่อสิทธิพิเศษ" }, { status: 400 });
  }

  const privilege = await grantPrivilege(Number(id), title, "manual", null, note);
  return NextResponse.json(privilege);
}
