import { NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "fs";
import { join, extname } from "path";
import { getProductById, updateProduct } from "@/lib/db";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(request: Request) {
  try {
    mkdirSync(UPLOAD_DIR, { recursive: true });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") as string | null;
    const slot = parseInt((formData.get("slot") as string) || "0");

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, AVIF allowed" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 8 MB" }, { status: 400 });
    }

    const product = getProductById(parseInt(productId));
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const ext = extname(file.name) || ".jpg";
    const filename = `product-${productId}-slot${slot}-${Date.now()}${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    const arrayBuffer = await file.arrayBuffer();
    writeFileSync(filepath, Buffer.from(arrayBuffer));

    const images = [...(product.images || [])];
    // Pad array to slot index if needed
    while (images.length <= slot) images.push("");
    images[slot] = `/uploads/${filename}`;

    updateProduct(parseInt(productId), { images });

    return NextResponse.json({ url: `/uploads/${filename}`, slot });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { productId, slot } = await request.json();
    const product = getProductById(parseInt(productId));
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const images = [...(product.images || [])];
    if (slot >= 0 && slot < images.length) images[slot] = "";

    updateProduct(parseInt(productId), { images });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove image" }, { status: 500 });
  }
}
