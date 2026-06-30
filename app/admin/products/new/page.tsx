import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
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
          New Product
        </span>
      </div>

      <h2
        className="text-xl tracking-wider mb-6"
        style={{ color: "var(--charcoal)" }}
      >
        Add New Product
      </h2>

      <div className="bg-white p-8" style={{ border: "1px solid var(--border)" }}>
        <ProductForm />
      </div>
    </div>
  );
}
