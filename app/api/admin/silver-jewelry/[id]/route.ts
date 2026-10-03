import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { updateSilverProduct, deleteSilverProduct } from "@/lib/silverJewelry";
import type { SilverTier } from "@/lib/silverJewelry";

const TIERS: SilverTier[] = ["starter", "elegance", "luxury"];

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  const product = await updateSilverProduct(Number(id), {
    sku: body.sku !== undefined ? String(body.sku).trim() : undefined,
    name: body.name !== undefined ? String(body.name).trim() : undefined,
    tier: TIERS.includes(body.tier) ? body.tier : undefined,
    price: body.price !== undefined ? Number(body.price) || 0 : undefined,
    category: body.category !== undefined ? String(body.category) : undefined,
    description: body.description !== undefined ? String(body.description) : undefined,
    metal: body.metal !== undefined ? String(body.metal) : undefined,
    weight: body.weight !== undefined ? String(body.weight) : undefined,
    size: body.size !== undefined ? String(body.size) : undefined,
    images: Array.isArray(body.images) ? body.images : undefined,
    soldOut: typeof body.soldOut === "boolean" ? body.soldOut : undefined,
    hidden: typeof body.hidden === "boolean" ? body.hidden : undefined,
    sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function DELETE(request: Request, { params }: Params) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ok = await deleteSilverProduct(Number(id));
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
