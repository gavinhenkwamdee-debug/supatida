import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { upsertSilverProductsBySku } from "@/lib/silverJewelry";
import type { SilverTier } from "@/lib/silverJewelry";

const TIERS: SilverTier[] = ["starter", "elegance", "luxury"];

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { products } = await request.json();
  if (!Array.isArray(products) || products.length === 0)
    return NextResponse.json({ error: "No products provided" }, { status: 400 });

  const items = products.map((p) => ({
    sku: String(p.sku ?? "").trim(),
    name: String(p.name ?? "").trim() || "Untitled",
    tier: (TIERS.includes(p.tier) ? p.tier : "starter") as SilverTier,
    price: Number(p.price) || 0,
    category: String(p.category ?? ""),
    description: String(p.description ?? ""),
    metal: String(p.metal ?? ""),
    weight: String(p.weight ?? ""),
    size: String(p.size ?? ""),
    images: Array.isArray(p.images) ? p.images : [],
    soldOut: Boolean(p.soldOut),
    hidden: Boolean(p.hidden),
    sortOrder: 0,
  }));

  const result = await upsertSilverProductsBySku(items);
  return NextResponse.json(result);
}
