import { NextResponse } from "next/server";
import { getAllProducts, updateProduct } from "@/lib/db";
import { uploadToR2 } from "@/lib/r2";
import { getSetting, setSetting } from "@/lib/settings";
import { DEFAULT_HERO_BANNER, type HeroBannerConfig } from "@/lib/hero-banner-config";
import { DEFAULT_POPUP, type PopupConfig } from "@/lib/popup-config";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function isCloudinaryUrl(url: string): boolean {
  const publicUrl = process.env.R2_PUBLIC_URL!;
  if (!url || url.includes(publicUrl) || url.includes("r2.dev")) return false;
  return url.includes("cloudinary.com");
}

async function migrateUrl(url: string, key: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const ext = contentType.split("/")[1].replace("jpeg", "jpg");
  return uploadToR2(buffer, `${key}.${ext}`, contentType);
}

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
      if (!isCloudinaryUrl(url)) { skipped++; continue; }

      try {
        images[i] = await migrateUrl(url, `products/product-${product.id}-slot${i}-migrated`);
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

  // Hero banner slides
  const heroBanner = await getSetting<HeroBannerConfig>("hero-banner", DEFAULT_HERO_BANNER);
  let heroChanged = false;
  for (let i = 0; i < heroBanner.slides.length; i++) {
    const url = heroBanner.slides[i].imageUrl;
    if (!url) { skipped++; continue; }
    if (!isCloudinaryUrl(url)) { skipped++; continue; }

    try {
      heroBanner.slides[i].imageUrl = await migrateUrl(url, `banners/hero-slide${i}-migrated`);
      migrated++;
      heroChanged = true;
    } catch (e) {
      console.error(`Failed hero banner slide ${i}:`, e);
      errors.push(`hero banner slide ${i}: ${e}`);
      failed++;
    }
  }
  if (heroChanged) await setSetting("hero-banner", heroBanner);

  // Popup banner image
  const popup = await getSetting<PopupConfig>("popup", DEFAULT_POPUP);
  if (popup.imageUrl && isCloudinaryUrl(popup.imageUrl)) {
    try {
      popup.imageUrl = await migrateUrl(popup.imageUrl, "banners/popup-migrated");
      migrated++;
      await setSetting("popup", popup);
    } catch (e) {
      console.error(`Failed popup image:`, e);
      errors.push(`popup image: ${e}`);
      failed++;
    }
  } else if (popup.imageUrl) {
    skipped++;
  }

  return NextResponse.json({ ok: true, migrated, failed, skipped, errors });
}
