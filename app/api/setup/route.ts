import { NextResponse } from "next/server";
import { initDB, createProduct, getAllProducts } from "@/lib/db";
import type { Specifications } from "@/lib/db";

interface SeedProduct {
  name: string; price: number; category: string;
  description: string; specifications: Specifications; images: string[]; soldOut: boolean; hidden: boolean;
}

const SEED_PRODUCTS: SeedProduct[] = [
  {
    name: "Radiant Cut Solitaire Ring", price: 125000, category: "Rings",
    description: "A timeless solitaire featuring a stunning radiant cut lab grown diamond set in 18K white gold.",
    specifications: { "Carat Weight": "1.5 ct", "Cut": "Radiant", "Color": "F", "Clarity": "VS1", "Metal": "18K White Gold", "Certification": "IGI Certified" },
    images: [], soldOut: false, hidden: false,
  },
  {
    name: "Oval Halo Engagement Ring", price: 185000, category: "Rings",
    description: "A breathtaking oval lab grown diamond surrounded by a delicate halo of brilliant pavé diamonds.",
    specifications: { "Carat Weight": "2.0 ct", "Cut": "Oval", "Color": "G", "Clarity": "VVS2", "Metal": "Platinum 950", "Certification": "IGI Certified" },
    images: [], soldOut: false, hidden: false,
  },
  {
    name: "Diamond Tennis Necklace", price: 315000, category: "Necklaces",
    description: "A classic tennis necklace featuring 45 perfectly matched round brilliant lab grown diamonds.",
    specifications: { "Total Carat Weight": "5.0 ct", "Number of Stones": "45", "Color": "H", "Clarity": "VS2", "Metal": "18K White Gold", "Length": "16 inches" },
    images: [], soldOut: false, hidden: false,
  },
  {
    name: "Princess Cut Stud Earrings", price: 98000, category: "Earrings",
    description: "Elegant princess cut lab grown diamond studs set in 14K white gold.",
    specifications: { "Total Carat Weight": "1.0 ct", "Cut": "Princess", "Color": "E", "Clarity": "VS1", "Metal": "14K White Gold", "Certification": "IGI Certified" },
    images: [], soldOut: false, hidden: false,
  },
];

export async function POST() {
  try {
    await initDB();
    const existing = await getAllProducts();
    if (existing.length === 0) {
      for (const p of SEED_PRODUCTS) {
        await createProduct(p);
      }
      return NextResponse.json({ ok: true, seeded: SEED_PRODUCTS.length });
    }
    return NextResponse.json({ ok: true, seeded: 0, note: "Already has data" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
