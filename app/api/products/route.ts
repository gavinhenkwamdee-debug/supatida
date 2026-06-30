import { NextResponse } from "next/server";
import { getAllProducts, createProduct, CATEGORIES } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  let products = await getAllProducts();

  if (category && category !== "All")
    products = products.filter((p) => p.category === category);
  if (minPrice)
    products = products.filter((p) => p.price >= parseFloat(minPrice));
  if (maxPrice && maxPrice !== "Infinity")
    products = products.filter((p) => p.price <= parseFloat(maxPrice));

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price, category, description, specifications } = body;

    if (!name || !price || !category)
      return NextResponse.json({ error: "name, price, and category are required" }, { status: 400 });
    if (!CATEGORIES.includes(category))
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });

    const product = await createProduct({
      name: String(name).trim(),
      price: parseFloat(price),
      category,
      description: String(description || "").trim(),
      specifications: specifications || {},
      images: [],
    });

    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
