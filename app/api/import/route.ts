import { NextResponse } from "next/server";
import { createProduct } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { products } = await request.json();
    if (!Array.isArray(products) || products.length === 0)
      return NextResponse.json({ error: "No products provided" }, { status: 400 });

    const created = [];
    for (const p of products) {
      const product = await createProduct({
        name: p.name,
        price: p.price,
        category: p.category,
        description: "",
        specifications: p.specifications || {},
        images: [],
        soldOut: false,
        hidden: false,
      });
      created.push(product);
    }

    return NextResponse.json({ created: created.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
