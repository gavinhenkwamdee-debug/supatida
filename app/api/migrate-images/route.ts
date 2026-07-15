import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getAllProducts, updateProduct } from "@/lib/db";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadUrlToCloudinary(url: string, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(url, {
      public_id: publicId,
      folder: "supatida",
      overwrite: true,
      resource_type: "image",
    }, (error, result) => {
      if (error || !result) return reject(error);
      resolve(result.secure_url);
    });
  });
}

export async function POST() {
  const products = await getAllProducts();
  const results: { id: number; migrated: number; failed: number; skipped: number }[] = [];

  for (const product of products) {
    const images = [...(product.images || [])];
    let migrated = 0, failed = 0, skipped = 0;
    let changed = false;

    for (let i = 0; i < images.length; i++) {
      const url = images[i];
      if (!url) { skipped++; continue; }
      if (url.includes("cloudinary.com")) { skipped++; continue; }
      if (!url.includes("vercel-storage.com") && !url.includes("blob.vercel")) { skipped++; continue; }

      try {
        const publicId = `product-${product.id}-slot${i}-migrated`;
        const newUrl = await uploadUrlToCloudinary(url, publicId);
        images[i] = newUrl;
        migrated++;
        changed = true;
      } catch (e) {
        console.error(`Failed ${url}:`, e);
        failed++;
        if (failed === 1) {
          // Return early with first error for debugging
          return NextResponse.json({ debug: true, url, error: String(e), product_id: product.id });
        }
      }
    }

    if (changed) await updateProduct(product.id, { images });
    results.push({ id: product.id, migrated, failed, skipped });
  }

  const total = results.reduce((a, r) => ({ migrated: a.migrated + r.migrated, failed: a.failed + r.failed }), { migrated: 0, failed: 0 });
  return NextResponse.json({ ok: true, total, results });
}
