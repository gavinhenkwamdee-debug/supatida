import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAllProducts, updateProduct } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const TARGET = "D-F Color, VS Clarity Up";
  const products = await getAllProducts();
  let updated = 0, skipped = 0;

  for (const product of products) {
    if (product.specifications["Diamond Quality"] === TARGET) { skipped++; continue; }
    await updateProduct(product.id, {
      specifications: { ...product.specifications, "Diamond Quality": TARGET },
    });
    updated++;
  }

  if (updated > 0) revalidateTag("products", "default");
  return NextResponse.json({ ok: true, updated, skipped });
}
