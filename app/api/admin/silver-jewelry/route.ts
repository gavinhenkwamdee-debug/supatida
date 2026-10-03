import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getAllSilverProducts, createSilverProduct } from "@/lib/silverJewelry";
import type { SilverTier } from "@/lib/silverJewelry";

const TIERS: SilverTier[] = ["starter", "elegance", "luxury"];

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const products = await getAllSilverProducts();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();

  const product = await createSilverProduct({
    sku: String(body.sku ?? "").trim(),
    name: String(body.name ?? "").trim() || "Untitled",
    tier: TIERS.includes(body.tier) ? body.tier : "starter",
    price: Number(body.price) || 0,
    category: String(body.category ?? ""),
    description: String(body.description ?? ""),
    metal: String(body.metal ?? ""),
    weight: String(body.weight ?? ""),
    size: String(body.size ?? ""),
    images: Array.isArray(body.images) ? body.images : [],
    soldOut: Boolean(body.soldOut),
    hidden: Boolean(body.hidden),
    sortOrder: Number(body.sortOrder) || 0,
  });

  return NextResponse.json(product);
}
