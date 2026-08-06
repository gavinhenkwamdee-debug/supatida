import { NextResponse } from "next/server";
import { getCrmTiers, setCrmTiers } from "@/lib/crm-settings";
import type { CrmTier, PerkDef } from "@/lib/crm";
import { isAdminRequest } from "@/lib/admin-auth";

function parsePerks(value: unknown): PerkDef[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((p: unknown) => {
      const perk = p as Record<string, unknown>;
      return { title: String(perk.title ?? "").trim(), image: perk.image ? String(perk.image) : null };
    })
    .filter((p) => p.title);
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getCrmTiers());
}

export async function PUT(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid tiers" }, { status: 400 });
  }

  const tiers: CrmTier[] = body.map((t: unknown) => {
    const tier = t as Record<string, unknown>;
    return {
      name: String(tier.name ?? "").trim() || "Tier",
      minPoints: Number(tier.minPoints) || 0,
      discountPercent: Number(tier.discountPercent) || 0,
      perks: parsePerks(tier.perks),
    };
  });

  await setCrmTiers(tiers);
  return NextResponse.json(tiers);
}
