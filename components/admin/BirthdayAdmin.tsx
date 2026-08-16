"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BirthdayConfig } from "@/lib/birthday-config";
import type { Product } from "@/lib/db";

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 1800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => resolve(new File([blob!], file.name, { type: "image/jpeg" })),
        "image/jpeg",
        0.85
      );
    };
    img.src = url;
  });
}

export default function BirthdayAdmin() {
  const [enabled, setEnabled] = useState(false);
  const [bannerImage, setBannerImage] = useState("");
  const [productIds, setProductIds] = useState<number[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings/birthday")
      .then((r) => r.json())
      .then((d: BirthdayConfig) => {
        setEnabled(d.enabled);
        setBannerImage(d.bannerImage);
        setProductIds(d.productIds || []);
        setLoading(false);
      });
    fetch("/api/products?category=All")
      .then((r) => r.json())
      .then((d: Product[]) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  async function saveConfig(next: { enabled: boolean; bannerImage: string; productIds: number[] }) {
    setSaving(true);
    await fetch("/api/settings/birthday", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);
      const res = await fetch("/api/upload-banner", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setBannerImage(data.url);
        await saveConfig({ enabled, bannerImage: data.url, productIds });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function addProduct(id: number) {
    if (productIds.includes(id)) return;
    const next = [...productIds, id];
    setProductIds(next);
    saveConfig({ enabled, bannerImage, productIds: next });
    setSearch("");
  }

  function removeProduct(id: number) {
    const next = productIds.filter((x) => x !== id);
    setProductIds(next);
    saveConfig({ enabled, bannerImage, productIds: next });
  }

  async function toggleSoldOut(product: Product) {
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soldOut: !product.soldOut }),
    });
    if (res.ok) {
      const updated: Product = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
  }

  const selectedProducts = useMemo(
    () => productIds.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p)),
    [productIds, products]
  );

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => !productIds.includes(p.id))
      .filter((p) => p.name.toLowerCase().includes(q) || (p.specifications["Product Code"] || "").toLowerCase().includes(q))
      .slice(0, 10);
  }, [search, products, productIds]);

  const THB = (n: number) =>
    new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

  if (loading) return (
    <div className="p-8 text-sm font-sans" style={{ color: "var(--muted)" }}>Loading…</div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl tracking-wider" style={{ color: "var(--charcoal)" }}>Supatida Birthday Promotion</h1>
          <p className="text-xs font-sans mt-1" style={{ color: "var(--muted)" }}>
            แท็บโปรโมชั่นวันเกิด SUPATIDA พร้อม Hero Banner และรายการสินค้าลด 12%
          </p>
        </div>
        <a href="/admin" className="text-xs tracking-widest uppercase underline font-sans" style={{ color: "var(--muted)" }}>
          ← Back
        </a>
      </div>

      {/* Toggle */}
      <div className="bg-white p-6 mb-4" style={{ border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm tracking-wide" style={{ color: "var(--charcoal)" }}>แสดงแท็บวันเกิด</p>
            <p className="text-xs font-sans mt-0.5" style={{ color: "var(--muted)" }}>
              เปิด/ปิดแท็บ + หน้าโปรโมชั่นวันเกิด SUPATIDA บนหน้าเว็บ
            </p>
          </div>
          <button
            onClick={() => { const next = !enabled; setEnabled(next); saveConfig({ enabled: next, bannerImage, productIds }); }}
            disabled={saving}
            className="relative w-14 h-7 rounded-full transition-colors duration-200 disabled:opacity-50"
            style={{ backgroundColor: enabled ? "#0284C7" : "#D1D5DB" }}
          >
            <span
              className="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
              style={{ left: enabled ? "30px" : "4px" }}
            />
          </button>
        </div>
      </div>

      {/* Banner upload */}
      <div className="bg-white p-6 mb-4" style={{ border: "1px solid var(--border)" }}>
        <h2 className="text-xs tracking-widest uppercase mb-4 font-sans" style={{ color: "var(--muted)" }}>
          Hero Banner วันเกิด
        </h2>

        {bannerImage && (
          <div className="relative w-full mb-4 overflow-hidden" style={{ aspectRatio: "3/1", backgroundColor: "var(--img-bg)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full py-8 text-sm font-sans tracking-wide border-2 border-dashed transition-colors hover:opacity-80 disabled:opacity-50"
          style={{ borderColor: "var(--border)", color: "var(--muted)", backgroundColor: "#FAF8F4" }}
        >
          {uploading ? "กำลัง upload…" : bannerImage ? "เปลี่ยนรูป Banner" : "+ คลิกเพื่ออัพโหลดรูป Banner"}
        </button>
        <div className="mt-3 p-3 text-xs font-sans space-y-1" style={{ backgroundColor: "#FAF8F4", border: "1px solid var(--border)", color: "var(--muted)" }}>
          <p className="font-medium" style={{ color: "var(--charcoal)" }}>ขนาดที่แนะนำ:</p>
          <p>• ratio <strong>3:1</strong> → upload <strong>1920×640px</strong> · JPG, PNG, WebP</p>
        </div>
      </div>

      {/* Product picker */}
      <div className="bg-white p-6" style={{ border: "1px solid var(--border)" }}>
        <h2 className="text-xs tracking-widest uppercase mb-1 font-sans" style={{ color: "var(--muted)" }}>
          สินค้าที่ร่วมโปรโมชั่น ({selectedProducts.length})
        </h2>
        <p className="text-xs font-sans mb-4" style={{ color: "var(--muted)" }}>
          ลดราคาพิเศษ 12% ทุกชิ้นที่เลือกไว้ · {saved ? "✓ บันทึกแล้ว" : "บันทึกอัตโนมัติเมื่อเพิ่ม/ลบ"}
        </p>

        <div className="relative mb-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ หรือรหัสสินค้า (Product Code) เพื่อเพิ่ม…"
            className="w-full px-3 py-2 text-xs font-sans outline-none"
            style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-white max-h-64 overflow-y-auto" style={{ border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-amber-50/50 transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div className="relative flex-shrink-0 overflow-hidden" style={{ width: 36, height: 36, backgroundColor: "var(--img-bg)" }}>
                    {p.images.find(Boolean) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images.find(Boolean)} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: "var(--charcoal)" }}>{p.name}</p>
                    <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>{p.specifications["Product Code"] || "—"} · {THB(p.price)}</p>
                  </div>
                  <span className="text-xs tracking-wider uppercase flex-shrink-0" style={{ color: "var(--gold-dark)" }}>+ เพิ่ม</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedProducts.length === 0 ? (
          <p className="text-xs font-sans py-6 text-center" style={{ color: "var(--muted)" }}>ยังไม่ได้เลือกสินค้า — ค้นหาด้านบนเพื่อเพิ่ม</p>
        ) : (
          <div className="space-y-2">
            {selectedProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2" style={{ border: "1px solid var(--border)" }}>
                <div className="relative flex-shrink-0 overflow-hidden" style={{ width: 40, height: 40, backgroundColor: "var(--img-bg)" }}>
                  {p.images.find(Boolean) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images.find(Boolean)} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: "var(--charcoal)" }}>{p.name}</p>
                  <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>{p.specifications["Product Code"] || "—"} · {THB(p.price)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSoldOut(p)}
                  className="text-xs px-2 py-1 rounded font-sans transition-all flex-shrink-0"
                  style={{
                    backgroundColor: p.soldOut ? "#C0392B" : "#F5F0E8",
                    color: p.soldOut ? "white" : "var(--muted)",
                    border: "1px solid",
                    borderColor: p.soldOut ? "#C0392B" : "var(--border)",
                  }}
                >
                  {p.soldOut ? "SOLD OUT" : "In Stock"}
                </button>
                <button
                  type="button"
                  onClick={() => removeProduct(p.id)}
                  className="text-xs tracking-wider uppercase underline flex-shrink-0"
                  style={{ color: "#C0392B" }}
                >
                  ลบ
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
