import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getProductById, updateProduct } from "@/lib/db";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

async function uploadToCloudinary(file: File, publicId: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { public_id: publicId, folder: "supatida", overwrite: true, resource_type: "image" },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    ).end(buffer);
  });
}

async function deleteFromCloudinary(url: string) {
  try {
    const match = url.match(/supatida\/([^.]+)/);
    if (match) await cloudinary.uploader.destroy(`supatida/${match[1]}`);
  } catch {}
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") as string | null;
    const slot = parseInt((formData.get("slot") as string) || "0");

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, AVIF allowed" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE)
      return NextResponse.json({ error: "File exceeds 8 MB" }, { status: 400 });

    const product = await getProductById(parseInt(productId));
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const publicId = `product-${productId}-slot${slot}-${Date.now()}`;
    const url = await uploadToCloudinary(file, publicId);

    const images = [...(product.images || [])];
    while (images.length <= slot) images.push("");

    // Delete old Cloudinary image if exists
    if (images[slot] && images[slot].includes("cloudinary.com")) {
      await deleteFromCloudinary(images[slot]);
    }

    images[slot] = url;
    await updateProduct(parseInt(productId), { images });

    return NextResponse.json({ url, slot });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { productId, slot, url } = await request.json();
    const product = await getProductById(parseInt(productId));
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const images = [...(product.images || [])];
    while (images.length <= slot) images.push("");
    images[slot] = url;
    await updateProduct(parseInt(productId), { images });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/upload error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { productId, slot } = await request.json();
    const product = await getProductById(parseInt(productId));
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const images = [...(product.images || [])];
    if (slot >= 0 && slot < images.length && images[slot]) {
      if (images[slot].includes("cloudinary.com")) {
        await deleteFromCloudinary(images[slot]);
      }
      images[slot] = "";
    }

    await updateProduct(parseInt(productId), { images });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove image" }, { status: 500 });
  }
}
