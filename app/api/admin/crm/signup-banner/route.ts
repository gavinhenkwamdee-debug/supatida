import { NextResponse } from "next/server";
import { getSignupBanner, setSignupBanner } from "@/lib/crm-settings";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getSignupBanner());
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const image = body?.image ? String(body.image) : null;
  await setSignupBanner({ image });
  return NextResponse.json({ image });
}
