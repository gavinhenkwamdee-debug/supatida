"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/db";

export default function AdminProductRow({ product }: { product: Product }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Failed to delete product.");
  }

  const imageCount = product.images.filter(Boolean).length;

  return (
    <tr
      style={{ borderBottom: "1px solid var(--border)" }}
      className="transition-colors hover:bg-amber-50/30"
    >
      <td className="px-5 py-4">
        <p className="font-medium text-sm" style={{ color: "var(--charcoal)" }}>
          {product.name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
          ID #{product.id}
        </p>
      </td>
      <td className="px-5 py-4">
        <span
          className="text-xs px-2 py-1 tracking-wide"
          style={{
            backgroundColor: "#F5F0E8",
            color: "var(--gold-dark)",
            border: "1px solid var(--border)",
          }}
        >
          {product.category}
        </span>
      </td>
      <td className="px-5 py-4 font-light" style={{ color: "var(--charcoal)" }}>
        {new Intl.NumberFormat("th-TH", {
          style: "currency",
          currency: "THB",
          maximumFractionDigits: 0,
        }).format(product.price)}
      </td>
      <td className="px-5 py-4">
        <span
          className="text-xs font-sans"
          style={{ color: imageCount > 0 ? "#2E7D32" : "var(--muted)" }}
        >
          {imageCount} / 5
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex gap-3">
          <Link
            href={`/products/${product.id}`}
            target="_blank"
            className="text-xs tracking-wider uppercase underline"
            style={{ color: "var(--muted)" }}
          >
            View ↗
          </Link>
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="text-xs tracking-wider uppercase underline"
            style={{ color: "var(--gold-dark)" }}
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="text-xs tracking-wider uppercase underline"
            style={{ color: "#C0392B" }}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
