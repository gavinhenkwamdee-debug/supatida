import { NextResponse } from "next/server";
import { getWelcomePerks, setWelcomePerks } from "@/lib/crm-settings";
import type { PerkDef } from "@/lib/crm";
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
  const perks: PerkDef[] = body
    .map((p: unknown) => {
      const perk = p as Record<string, unknown>;
      return { title: String(perk.title ?? "").trim(), image: perk.image ? String(perk.image) : null };
    })
    .filter((p) => p.title);
  await setWelcomePerks(perks);
  return NextResponse.json(perks);
}
