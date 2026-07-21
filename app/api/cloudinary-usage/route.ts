import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  const usage = await cloudinary.api.usage();
  const resources = await cloudinary.api.resources({
    type: "upload",
    prefix: "supatida",
    max_results: 500,
  });

  const totalBytes = resources.resources.reduce(
    (sum: number, r: { bytes: number }) => sum + (r.bytes || 0),
    0
  );

  return NextResponse.json({
    plan: usage.plan,
    credits_usage_percent: usage.credits?.usage_percent,
    storage_mb: Math.round(usage.storage?.usage / 1024 / 1024),
    bandwidth_mb: Math.round(usage.bandwidth?.usage / 1024 / 1024),
    image_count: resources.resources.length,
    image_total_mb: Math.round(totalBytes / 1024 / 1024 * 10) / 10,
    avg_kb_per_image: resources.resources.length
      ? Math.round(totalBytes / resources.resources.length / 1024)
      : 0,
  });
}
