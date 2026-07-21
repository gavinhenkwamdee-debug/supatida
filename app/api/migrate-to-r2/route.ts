import { NextResponse } from "next/server";
import { getAllProducts, updateProduct } from "@/lib/db";
import { uploadToR2 } from "@/lib/r2";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST() {
  const products = await getAllProducts();
  let migrated = 0, failed = 0, skipped = 0;
  const errors: string[] = [];

  for (const product of products) {
    const images = [...(product.images || [])];
    let changed = false;

    for (let i = 0; i < images.length; i++) {
      const url = images[i];
      if (!url) { skipped++; continue; }

      // Skip if already on R2
      const publicUrl = process.env.R2_PUBLIC_URL!;
      if (url.includes(publicUrl) || url.includes("r2.dev")) { skipped++; continue; }

      // Only migrate Cloudinary images
      if (!url.includes("cloudinary.com")) { skipped++; continue; }

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        const contentType = res.headers.get("content-type") || "image/jpeg";
        const ext = contentType.split("/")[1].replace("jpeg", "jpg");
        const key = `products/product-${product.id}-slot${i}-migrated.${ext}`;
        const newUrl = await uploadToR2(buffer, key, contentType);
        images[i] = newUrl;
        migrated++;
        changed = true;
      } catch (e) {
        console.error(`Failed product ${product.id} slot ${i}:`, e);
        errors.push(`product ${product.id} slot ${i}: ${e}`);
        failed++;
      }
    }

    if (changed) await updateProduct(product.id, { images });
  }

  return NextResponse.json({ ok: true, migrated, failed, skipped, errors });
}
