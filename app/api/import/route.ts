import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { parseExcelRows } from "@/lib/importMapper";
import { createProduct, getAllProducts } from "@/lib/db";

// POST /api/import  — body: FormData with file=xlsx (action=preview)
//                  — body: JSON { action:"execute", products:[...] }
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  // ── PREVIEW ──────────────────────────────────────────────
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

      const buffer = Buffer.from(await file.arrayBuffer());
      const wb = XLSX.read(buffer, { type: "buffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];

      const products = parseExcelRows(rows.slice(1)); // skip header row

      // Check for duplicates against existing products
      const existing = getAllProducts().map((p) =>
        Object.values(p.specifications).find((v) =>
          v.includes("ready") || v.includes("ZBR")
        )
      );
      const existingCodes = new Set(
        getAllProducts()
          .map((p) => p.specifications["Item ID"] || "")
          .filter(Boolean)
      );

      const preview = products.map((p) => ({
        ...p,
        duplicate: existingCodes.has(p.specifications["Item ID"] || "__none__"),
      }));

      return NextResponse.json({ products: preview, total: preview.length });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Failed to parse Excel file" }, { status: 500 });
    }
  }

  // ── EXECUTE ──────────────────────────────────────────────
  if (contentType.includes("application/json")) {
    try {
      const { products } = await request.json();
      if (!Array.isArray(products) || products.length === 0) {
        return NextResponse.json({ error: "No products provided" }, { status: 400 });
      }

      const created = [];
      for (const p of products) {
        const product = createProduct({
          name: p.name,
          price: p.price,
          category: p.category,
          description: "",
          specifications: p.specifications || {},
          images: [],
        });
        created.push(product);
      }

      return NextResponse.json({ created: created.length });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Import failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
}
