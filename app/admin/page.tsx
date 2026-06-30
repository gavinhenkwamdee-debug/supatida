import Link from "next/link";
import { getAllProducts } from "@/lib/db";
import AdminProductRow from "@/components/admin/AdminProductRow";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const products = await getAllProducts();

  return (
    <div>
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Products", value: products.length },
          {
            label: "Avg. Price",
            value:
              products.length > 0
                ? new Intl.NumberFormat("th-TH", {
                    style: "currency",
                    currency: "THB",
                    maximumFractionDigits: 0,
                  }).format(
                    products.reduce((s, p) => s + p.price, 0) / products.length
                  )
                : "$0",
          },
          {
            label: "Categories",
            value: new Set(products.map((p) => p.category)).size,
          },
          {
            label: "With Images",
            value: products.filter((p) => p.images.some(Boolean)).length,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-5"
            style={{ border: "1px solid var(--border)" }}
          >
            <p
              className="text-xs tracking-widest uppercase mb-1"
              style={{ color: "var(--muted)" }}
            >
              {stat.label}
            </p>
            <p
              className="text-2xl font-light"
              style={{ color: "var(--charcoal)" }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-lg tracking-wider"
          style={{ color: "var(--charcoal)" }}
        >
          Products
        </h2>
        <Link
          href="/admin/products/new"
          className="px-5 py-2.5 text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
        >
          + Add Product
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white" style={{ border: "1px solid var(--border)" }}>
        {products.length === 0 ? (
          <div className="text-center py-16">
            <p style={{ color: "var(--muted)" }} className="text-sm mb-4">
              No products yet.
            </p>
            <Link
              href="/admin/products/new"
              className="text-xs tracking-widest uppercase underline"
              style={{ color: "var(--gold)" }}
            >
              Add your first product
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "#FAF8F4" }}>
                {["Product", "Category", "Price", "Images", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs tracking-widest uppercase"
                    style={{ color: "var(--muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <AdminProductRow key={product.id} product={product} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
