import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";

type Params = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Params) {
  const { id } = await params;
  const product = await getProductById(parseInt(id));
  if (!product) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin"
          className="text-xs tracking-widest uppercase font-sans"
          style={{ color: "var(--muted)" }}
        >
          ← Dashboard
        </Link>
        <span style={{ color: "var(--border)" }}>/</span>
        <span className="text-xs tracking-widest uppercase font-sans" style={{ color: "var(--charcoal)" }}>
          Edit Product
        </span>
      </div>

      <h2
        className="text-xl tracking-wider mb-1"
        style={{ color: "var(--charcoal)" }}
      >
        Edit Product
      </h2>
      <p
        className="text-sm mb-6 font-sans"
        style={{ color: "var(--muted)" }}
      >
        {product.name}
      </p>

      <div className="bg-white p-8" style={{ border: "1px solid var(--border)" }}>
        <ProductForm product={product} />
      </div>
    </div>
  );
}
