import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { getProductById, updateProduct, deleteProduct } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const product = await getProductById(parseInt(id));
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const product = await updateProduct(parseInt(id), body);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidateTag("products", "default");
    revalidatePath(`/products/${id}`);
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const ok = await deleteProduct(parseInt(id));
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidateTag("products", "default");
  return NextResponse.json({ success: true });
}
