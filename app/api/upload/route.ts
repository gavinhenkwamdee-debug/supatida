import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { getProductById, updateProduct } from "@/lib/db";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

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

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `product-${productId}-slot${slot}-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const images = [...(product.images || [])];
    while (images.length <= slot) images.push("");

    // Delete old blob if exists
    if (images[slot] && images[slot].startsWith("https://")) {
      try { await del(images[slot], { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
    }

    images[slot] = blob.url;
    await updateProduct(parseInt(productId), { images });

    return NextResponse.json({ url: blob.url, slot });
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
  } catch {
    return NextResponse.json({ error: "Failed to save image URL" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { productId, slot } = await request.json();
    const product = await getProductById(parseInt(productId));
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const images = [...(product.images || [])];
    if (slot >= 0 && slot < images.length && images[slot]) {
      try { await del(images[slot], { token: process.env.BLOB_READ_WRITE_TOKEN }); } catch {}
      images[slot] = "";
    }

    await updateProduct(parseInt(productId), { images });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove image" }, { status: 500 });
  }
}
