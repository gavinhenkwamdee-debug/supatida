import { NextResponse } from "next/server";
import { getWelcomePerks, setWelcomePerks } from "@/lib/crm-settings";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getWelcomePerks());
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid perks" }, { status: 400 });
  }
  const perks = body.map((p) => String(p).trim()).filter(Boolean);
  await setWelcomePerks(perks);
  return NextResponse.json(perks);
}
