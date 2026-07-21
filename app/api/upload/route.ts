import { NextResponse } from "next/server";
import { getProductById, updateProduct } from "@/lib/db";
import { uploadToR2, deleteFromR2 } from "@/lib/r2";

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

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const key = `products/product-${productId}-slot${slot}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2(buffer, key, file.type);

    const images = [...(product.images || [])];
    while (images.length <= slot) images.push("");

    if (images[slot]) await deleteFromR2(images[slot]);

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
      await deleteFromR2(images[slot]);
      images[slot] = "";
    }

    await updateProduct(parseInt(productId), { images });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove image" }, { status: 500 });
  }
}
