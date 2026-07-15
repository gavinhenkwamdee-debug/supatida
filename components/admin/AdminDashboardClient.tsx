"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/db";

const CATEGORIES = ["All", "Rings", "Necklaces", "Earrings", "Bracelets", "Pendants"];
const SORT_OPTIONS = [
  { label: "Newest First", value: "id-desc" },
  { label: "Oldest First", value: "id-asc" },
  { label: "Price: Low → High", value: "price-asc" },
  { label: "Price: High → Low", value: "price-desc" },
  { label: "Name A → Z", value: "name-asc" },
  { label: "No Image First", value: "noimage" },
];

const THB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

function Thumbnail({ src }: { src: string }) {
  if (!src) {
    return (
      <div className="w-12 h-12 flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "var(--img-bg)", border: "1px solid var(--border)" }}>
        <span className="text-xs" style={{ color: "var(--border)" }}>—</span>
      </div>
    );
  }
  return (
    <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden"
      style={{ border: "1px solid var(--border)" }}>
      <Image src={src} alt="" fill className="object-cover" sizes="48px" />
    </div>
  );
}

function AdminRow({ product, onDeleted, onUpdated }: { product: Product; onDeleted: () => void; onUpdated: (p: Product) => void }) {
  const router = useRouter();
  const firstImage = product.images.find(Boolean) || "";
  const imageCount = product.images.filter(Boolean).length;
  const code = product.specifications["Product Code"] || "";
  const itemId = product.specifications["Item ID"] || "";
  const [toggling, setToggling] = useState(false);
  const [togglingHide, setTogglingHide] = useState(false);
  const [savingBadge, setSavingBadge] = useState(false);

  async function handleDelete() {
    if (!confirm(`ลบ "${product.name}"? ไม่สามารถกู้คืนได้`)) return;
    const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    if (res.ok) { onDeleted(); router.refresh(); }
    else alert("ลบไม่สำเร็จ");
  }

  async function toggleSoldOut() {
    setToggling(true);
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soldOut: !product.soldOut }),
    });
    if (res.ok) { const updated = await res.json(); onUpdated(updated); }
    setToggling(false);
  }

  async function setBadge(badge: string | null) {
    setSavingBadge(true);
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge }),
    });
    if (res.ok) { const updated = await res.json(); onUpdated(updated); }
    setSavingBadge(false);
  }

  async function toggleHidden() {
    setTogglingHide(true);
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: !product.hidden }),
    });
    if (res.ok) { const updated = await res.json(); onUpdated(updated); }
    setTogglingHide(false);
  }

  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}
      className="transition-colors hover:bg-amber-50/30">
      {/* Image + Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Thumbnail src={firstImage} />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate max-w-[200px]" style={{ color: "var(--charcoal)" }}>
              {product.name}
            </p>
            <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--muted)" }}>
              DB #{product.id}
              {code && <span className="ml-1.5" style={{ color: "var(--gold-dark)" }}>· {code}</span>}
              {itemId && <span className="ml-1" style={{ color: "var(--muted)" }}>({itemId})</span>}
            </p>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3">
        <span className="text-xs px-2 py-1 tracking-wide"
          style={{ backgroundColor: "#F5F0E8", color: "var(--gold-dark)", border: "1px solid var(--border)" }}>
          {product.category}
        </span>
      </td>

      {/* Price */}
      <td className="px-4 py-3 font-light text-sm" style={{ color: "var(--charcoal)" }}>
        {THB(product.price)}
      </td>

      {/* Images */}
      <td className="px-4 py-3">
        <span className="text-xs font-sans" style={{ color: imageCount > 0 ? "#2E7D32" : "var(--muted)" }}>
          {imageCount} / 5
        </span>
      </td>

      {/* Badge selector */}
      <td className="px-4 py-3">
        <select
          value={product.badge ?? ""}
          disabled={savingBadge}
          onChange={(e) => setBadge(e.target.value || null)}
          className="text-xs px-2 py-1 font-sans outline-none disabled:opacity-50"
          style={{
            border: "1px solid var(--border)",
            backgroundColor: product.badge === "hot-item" ? "#B8922A"
              : product.badge === "best-deal" ? "#2E7D32"
              : product.badge === "super-sale" ? "#C0392B"
              : "white",
            color: product.badge ? "white" : "var(--muted)",
            borderRadius: "3px",
          }}
        >
          <option value="" style={{ background: "white", color: "#666" }}>— None —</option>
          <option value="hot-item" style={{ background: "white", color: "#B8922A" }}>🔥 Hot Item</option>
          <option value="best-deal" style={{ background: "white", color: "#2E7D32" }}>💚 Best Deal</option>
          <option value="super-sale" style={{ background: "white", color: "#C0392B" }}>🔴 Super Sale</option>
        </select>
      </td>

      {/* Sold Out toggle */}
      <td className="px-4 py-3">
        <button
          onClick={toggleSoldOut}
          disabled={toggling}
          className="text-xs px-2 py-1 rounded font-sans transition-all disabled:opacity-50"
          style={{
            backgroundColor: product.soldOut ? "#C0392B" : "#F5F0E8",
            color: product.soldOut ? "white" : "var(--muted)",
            border: "1px solid",
            borderColor: product.soldOut ? "#C0392B" : "var(--border)",
          }}
        >
          {product.soldOut ? "SOLD OUT" : "In Stock"}
        </button>
      </td>

      {/* Hide toggle */}
      <td className="px-4 py-3">
        <button
          onClick={toggleHidden}
          disabled={togglingHide}
          className="text-xs px-2 py-1 rounded font-sans transition-all disabled:opacity-50"
          style={{
            backgroundColor: product.hidden ? "#374151" : "#F5F0E8",
            color: product.hidden ? "white" : "var(--muted)",
            border: "1px solid",
            borderColor: product.hidden ? "#374151" : "var(--border)",
          }}
        >
          {product.hidden ? "Hidden" : "Visible"}
        </button>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex gap-3">
          <Link href={`/products/${product.id}`} target="_blank"
            className="text-xs tracking-wider uppercase underline" style={{ color: "var(--muted)" }}>
            View ↗
          </Link>
          <Link href={`/admin/products/${product.id}/edit`}
            className="text-xs tracking-wider uppercase underline" style={{ color: "var(--gold-dark)" }}>
            Edit
          </Link>
          <button onClick={handleDelete}
            className="text-xs tracking-wider uppercase underline" style={{ color: "#C0392B" }}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminDashboardClient({ products: initial }: { products: Product[] }) {
  const [products, setProducts] = useState(initial);

  function handleUpdated(updated: Product) {
    setProducts((prev) => prev.map((p) => p.id === updated.id ? updated : p));
  }
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("id-desc");
  const [imageFilter, setImageFilter] = useState<"all" | "with" | "without">("all");
  const [visFilter, setVisFilter] = useState<"all" | "visible" | "hidden">("all");

  const filtered = useMemo(() => {
    let list = [...products];

    // Search: name, code, item ID
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.specifications["Product Code"] || "").toLowerCase().includes(q) ||
        (p.specifications["Item ID"] || "").toLowerCase().includes(q)
      );
    }

    // Category
    if (category !== "All") list = list.filter((p) => p.category === category);

    // Image filter
    if (imageFilter === "with") list = list.filter((p) => p.images.some(Boolean));
    if (imageFilter === "without") list = list.filter((p) => !p.images.some(Boolean));
    if (visFilter === "visible") list = list.filter((p) => !p.hidden);
    if (visFilter === "hidden") list = list.filter((p) => p.hidden);

    // Sort
    switch (sort) {
      case "id-asc": list.sort((a, b) => a.id - b.id); break;
      case "id-desc": list.sort((a, b) => b.id - a.id); break;
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "name-asc": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "noimage": list.sort((a, b) => {
        const aHas = a.images.some(Boolean) ? 1 : 0;
        const bHas = b.images.some(Boolean) ? 1 : 0;
        return aHas - bHas;
      }); break;
    }

    return list;
  }, [products, search, category, sort, imageFilter, visFilter]);

  const withImages = products.filter((p) => p.images.some(Boolean)).length;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Products", value: products.length },
          { label: "Avg. Price", value: products.length > 0 ? THB(products.reduce((s, p) => s + p.price, 0) / products.length) : "—" },
          { label: "Categories", value: new Set(products.map((p) => p.category)).size },
          { label: "With Images", value: `${withImages} / ${products.length}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5" style={{ border: "1px solid var(--border)" }}>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--muted)" }}>{stat.label}</p>
            <p className="text-2xl font-light" style={{ color: "var(--charcoal)" }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Header + Add */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg tracking-wider" style={{ color: "var(--charcoal)" }}>
          Products <span className="text-sm font-sans font-normal" style={{ color: "var(--muted)" }}>({filtered.length})</span>
        </h2>
        <div className="flex gap-2">
          <Link href="/admin/banner"
            className="px-4 py-2.5 text-xs tracking-widest uppercase transition-opacity hover:opacity-80 font-sans"
            style={{ backgroundColor: "var(--gold)", color: "white" }}>
            🎯 Banner
          </Link>
          <Link href="/admin/products/new"
            className="px-5 py-2.5 text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
            style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}>
            + Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 mb-4 flex flex-wrap gap-3 items-center" style={{ border: "1px solid var(--border)" }}>
        {/* Search */}
        <input
          type="text"
          placeholder="ค้นหาชื่อ / รหัส / Item ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 text-xs font-sans outline-none flex-1 min-w-[180px]"
          style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
        />

        {/* Category */}
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 text-xs font-sans outline-none"
          style={{ border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" }}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Image filter */}
        <select value={imageFilter} onChange={(e) => setImageFilter(e.target.value as "all" | "with" | "without")}
          className="px-3 py-2 text-xs font-sans outline-none"
          style={{ border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" }}>
          <option value="all">All Images</option>
          <option value="with">มีรูปแล้ว</option>
          <option value="without">ยังไม่มีรูป</option>
        </select>

        {/* Visibility filter */}
        <select value={visFilter} onChange={(e) => setVisFilter(e.target.value as "all" | "visible" | "hidden")}
          className="px-3 py-2 text-xs font-sans outline-none"
          style={{ border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" }}>
          <option value="all">All Visibility</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>

        {/* Sort */}
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 text-xs font-sans outline-none"
          style={{ border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" }}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Clear */}
        {(search || category !== "All" || imageFilter !== "all" || visFilter !== "all" || sort !== "id-desc") && (
          <button onClick={() => { setSearch(""); setCategory("All"); setImageFilter("all"); setVisFilter("all"); setSort("id-desc"); }}
            className="text-xs underline font-sans" style={{ color: "var(--muted)" }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white" style={{ border: "1px solid var(--border)" }}>
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>ไม่พบสินค้าที่ตรงกัน</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "#FAF8F4" }}>
                  {["Product", "Category", "Price", "Images", "Best Seller", "Status", "Visibility", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs tracking-widest uppercase"
                      style={{ color: "var(--muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <AdminRow
                    key={product.id}
                    product={product}
                    onDeleted={() => setProducts((prev) => prev.filter((p) => p.id !== product.id))}
                    onUpdated={handleUpdated}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
