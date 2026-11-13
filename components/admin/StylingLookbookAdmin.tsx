"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/db";
import type { StylingLook, StylingLookbookConfig } from "@/lib/styling-lookbook-config";
import type { StylingLookbookStats } from "@/lib/styling-lookbook-tracking";

const THB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

const cardClass = "bg-white p-6 mb-4";
const cardStyle = { border: "1px solid var(--border)" };

function nextLookId() {
  return `look-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(new File([blob!], file.name, { type: "image/jpeg" })), "image/jpeg", 0.85);
    };
    img.src = url;
  });
}

async function uploadLookImage(file: File): Promise<string> {
  const compressed = await compressImage(file);
  const formData = new FormData();
  formData.append("file", compressed);
  const res = await fetch("/api/upload-styling-lookbook", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url;
}

function ImageUploadBox({
  src,
  label,
  onUploaded,
  size = 100,
}: {
  src: string;
  label: string;
  onUploaded: (url: string) => void;
  size?: number;
}) {
  const [uploading, setUploading] = useState(false);
  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      onUploaded(await uploadLookImage(file));
    } catch {
      alert("อัพโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }
  return (
    <label
      className="relative flex flex-col items-center justify-center cursor-pointer overflow-hidden flex-shrink-0"
      style={{ width: size, height: size, border: "1px dashed var(--border)", backgroundColor: "#FAF8F4" }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-sans text-center px-1" style={{ color: "var(--muted)" }}>
          {uploading ? "…" : label}
        </span>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={handleChange} disabled={uploading} />
    </label>
  );
}

function LookEditor({
  look,
  products,
  onChange,
  onRemove,
}: {
  look: StylingLook;
  products: Product[];
  onChange: (next: StylingLook) => void;
  onRemove: () => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [browsing, setBrowsing] = useState(false);
  const taggedProducts = look.productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).filter(Boolean), [products]);

  // Picking a category alone (no typed query) is enough to browse — the
  // text box only narrows it further, matching name or product code.
  const q = query.trim().toLowerCase();
  // No cap — the list scrolls, and a hard slice was silently dropping real,
  // in-stock products from a category with more than the cap's worth of
  // items (reported: a product missing from "Earrings" that was just sorted
  // past the cutoff, not actually hidden or sold out). Sorted by name so
  // browsing a category is at least predictable instead of raw DB order.
  const matches = browsing || q
    ? products
        .filter((p) => !p.soldOut)
        .filter((p) => !look.productIds.includes(p.id))
        .filter((p) => categoryFilter === "All" || p.category === categoryFilter)
        .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.specifications["Product Code"] || "").toLowerCase().includes(q))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  function addProduct(id: number) {
    onChange({ ...look, productIds: [...look.productIds, id] });
    setQuery("");
  }
  function removeProduct(id: number) {
    onChange({ ...look, productIds: look.productIds.filter((x) => x !== id) });
  }

  return (
    <div className="p-4 flex gap-4" style={{ border: "1px solid var(--border)" }}>
      <ImageUploadBox src={look.image} label="+ รูปลุค" onUploaded={(url) => onChange({ ...look, image: url })} size={110} />

      <div className="flex-1 min-w-0">
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>
              ธีม (ใช้เป็น filter chip ให้ลูกค้าเลือกดู)
            </label>
            <input
              value={look.theme}
              onChange={(e) => onChange({ ...look, theme: e.target.value })}
              placeholder="เช่น มินิมอล, ใส่ออกงาน, Everyday Stack"
              className="w-full px-2 py-1.5 text-xs font-sans outline-none"
              style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
            />
          </div>
          <button type="button" onClick={onRemove} className="self-end text-xs font-sans h-fit" style={{ color: "#C0392B" }}>
            ลบลุคนี้
          </button>
        </div>

        <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>
          สินค้าที่แท็กในลุคนี้ ({taggedProducts.length})
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {taggedProducts.map((p) => (
            <div key={p.id} className="flex items-center gap-2 pl-1 pr-2 py-1" style={{ border: "1px solid var(--border)", backgroundColor: "#FAF8F4" }}>
              <div className="relative flex-shrink-0 overflow-hidden" style={{ width: 24, height: 24, backgroundColor: "var(--img-bg)" }}>
                {p.images.find(Boolean) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images.find(Boolean)} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <span className="text-xs font-sans max-w-[160px] truncate" title={p.name} style={{ color: "var(--charcoal)" }}>{p.name}</span>
              <button type="button" onClick={() => removeProduct(p.id)} className="text-xs" style={{ color: "#C0392B" }}>✕</button>
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setBrowsing(true); }}
              className="px-2 py-1.5 text-xs font-sans outline-none bg-white flex-shrink-0"
              style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
            >
              <option value="All">ทุกหมวด</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setBrowsing(true)}
              placeholder="+ ค้นหาชื่อหรือรหัสสินค้าเพื่อแท็ก… (หรือเลือกหมวดด้านซ้ายเพื่อไล่ดู)"
              className="flex-1 min-w-0 px-2 py-1.5 text-xs font-sans outline-none"
              style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
            />
            {browsing && (
              <button
                type="button"
                onClick={() => { setBrowsing(false); setQuery(""); setCategoryFilter("All"); }}
                className="text-xs font-sans flex-shrink-0 px-2"
                style={{ color: "var(--muted)" }}
              >
                ปิด
              </button>
            )}
          </div>
          {matches.length > 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-white max-h-72 overflow-y-auto" style={{ border: "1px solid var(--border)" }}>
              {matches.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-gray-50"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div className="relative flex-shrink-0 overflow-hidden" style={{ width: 28, height: 28, backgroundColor: "var(--img-bg)" }}>
                    {p.images.find(Boolean) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images.find(Boolean)} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-sans truncate" style={{ color: "var(--charcoal)" }}>{p.name}</p>
                    <p className="text-[10px] font-sans" style={{ color: "var(--muted)" }}>{p.category}</p>
                  </div>
                  <span className="text-xs font-sans ml-auto flex-shrink-0" style={{ color: "var(--gold)" }}>{THB(p.price)}</span>
                </button>
              ))}
            </div>
          )}
          {browsing && matches.length === 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-white px-2 py-3 text-center" style={{ border: "1px solid var(--border)" }}>
              <p className="text-xs font-sans" style={{ color: "var(--muted)" }}>ไม่พบสินค้า</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StylingLookbookAdmin() {
  const [saved, setSaved] = useState<StylingLookbookConfig | null>(null);
  const [draft, setDraft] = useState<StylingLookbookConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<StylingLookbookStats | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/styling-lookbook")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("โหลดไม่สำเร็จ (ต้องล็อกอินแอดมินก่อน)"))))
      .then((c: StylingLookbookConfig) => { setSaved(c); setDraft(c); })
      .catch((e: Error) => setError(e.message));
    // x-admin includes hidden products too — an item hidden from the main
    // catalog can still be tagged in a look, and the admin needs to see it
    // to notice a product they expected is just hidden, not missing.
    fetch("/api/products?category=All", { headers: { "x-admin": "1" } })
      .then((r) => r.json())
      .then((d: Product[]) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch("/api/admin/styling-lookbook/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: StylingLookbookStats | null) => setStats(d))
      .catch(() => {});
  }, []);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  if (error && !draft) return <div className="p-8 text-sm font-sans" style={{ color: "#C0392B" }}>{error}</div>;
  if (!draft) return <div className="p-8 text-sm font-sans" style={{ color: "var(--muted)" }}>Loading…</div>;

  const config = draft;
  function patch(next: Partial<StylingLookbookConfig>) {
    setDraft({ ...config, ...next });
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/styling-lookbook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");
      const next: StylingLookbookConfig = await res.json();
      setSaved(next);
      setDraft(next);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  function addLook() {
    patch({ looks: [...config.looks, { id: nextLookId(), image: "", theme: "", productIds: [] }] });
  }
  function updateLook(id: string, next: StylingLook) {
    patch({ looks: config.looks.map((l) => (l.id === id ? next : l)) });
  }
  function removeLook(id: string) {
    patch({ looks: config.looks.filter((l) => l.id !== id) });
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl tracking-wider" style={{ color: "var(--charcoal)" }}>แต่งแบบไหนดี — Styling Lookbook</h1>
          <p className="text-xs font-sans mt-1" style={{ color: "var(--muted)" }}>
            หน้ารวมไอเดียการจัดสไตล์ แยกจากหน้าแคมเปญ 11.11 — เชื่อมด้วยแบนเนอร์บนหน้า /1111
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <a href="/styling" target="_blank" className="text-xs tracking-widest uppercase underline font-sans" style={{ color: "var(--charcoal)" }}>ดูหน้าจริง ↗</a>
          <a href="/admin" className="text-xs tracking-widest uppercase underline font-sans" style={{ color: "var(--muted)" }}>← Back</a>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 mb-4" style={{ backgroundColor: dirty ? "#FFF8E1" : "white", border: "1px solid var(--border)" }}>
        <p className="text-xs font-sans" style={{ color: error ? "#C0392B" : dirty ? "#856404" : "var(--muted)" }}>
          {error || (dirty ? "มีการแก้ไขที่ยังไม่ได้บันทึก" : justSaved ? "บันทึกแล้ว ✓" : "ไม่มีการเปลี่ยนแปลง")}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="px-6 py-2.5 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
        >
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </button>
      </div>

      {/* Traffic stats — scoped to just /styling, separate from the
          site-wide view/click counters and from the 11.11 campaign stats. */}
      <div className={cardClass} style={cardStyle}>
        <h2 className="text-sm tracking-wide mb-3" style={{ color: "var(--charcoal)" }}>สถิติการเข้าชมหน้า Styling Lookbook</h2>
        {!stats ? (
          <p className="text-xs font-sans" style={{ color: "var(--muted)" }}>กำลังโหลด…</p>
        ) : (
          <>
            <p className="text-xs font-sans mb-4" style={{ color: "var(--muted)" }}>
              คนเข้ามาดูหน้านี้ทั้งหมด{" "}
              <span className="text-base font-bold" style={{ color: "var(--charcoal)" }}>{stats.pageViews.toLocaleString()}</span>{" "}
              ครั้ง
            </p>
            <p className="text-xs tracking-widest uppercase font-sans mb-2" style={{ color: "var(--muted)" }}>
              สินค้าที่มีคนกดดูเยอะที่สุด
            </p>
            {stats.productClicks.length === 0 ? (
              <p className="text-xs font-sans" style={{ color: "var(--muted)" }}>ยังไม่มีคนกดดูสินค้าในหน้านี้</p>
            ) : (
              <div className="space-y-1.5">
                {stats.productClicks.slice(0, 10).map((s, i) => {
                  const p = productById.get(s.productId);
                  return (
                    <div key={s.productId} className="flex items-center gap-3 p-1.5" style={{ border: "1px solid var(--border)" }}>
                      <span className="text-xs font-sans w-4 text-center flex-shrink-0" style={{ color: "var(--muted)" }}>{i + 1}</span>
                      <div className="relative flex-shrink-0 overflow-hidden" style={{ width: 36, height: 36, backgroundColor: "var(--img-bg)" }}>
                        {p?.images.find(Boolean) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images.find(Boolean)} alt="" className="w-full h-full object-cover" loading="lazy" />
                        )}
                      </div>
                      <p className="text-xs flex-1 min-w-0 truncate" style={{ color: "var(--charcoal)" }}>
                        {p?.name ?? `สินค้า #${s.productId} (ถูกลบแล้ว)`}
                      </p>
                      <span className="text-xs font-sans flex-shrink-0" style={{ color: "var(--charcoal)" }}>{s.clicks.toLocaleString()} ครั้ง</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Enabled toggle */}
      <div className={cardClass} style={cardStyle}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm tracking-wide" style={{ color: "var(--charcoal)" }}>เปิดหน้า Styling Lookbook</p>
            <p className="text-xs font-sans mt-0.5" style={{ color: "var(--muted)" }}>
              ปิดไว้ก่อนได้ถ้ารูปยังไม่ครบ — ปิดอยู่จะไม่โชว์แบนเนอร์บนหน้า /1111 ด้วย
            </p>
          </div>
          <button
            type="button"
            onClick={() => patch({ enabled: !config.enabled })}
            className="relative w-14 h-7 rounded-full transition-colors duration-200"
            style={{ backgroundColor: config.enabled ? "#C0392B" : "#D1D5DB" }}
            aria-pressed={config.enabled}
          >
            <span className="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200" style={{ left: config.enabled ? "30px" : "4px" }} />
          </button>
        </div>
      </div>

      {/* Banner */}
      <div className={cardClass} style={cardStyle}>
        <h2 className="text-xs tracking-widest uppercase mb-3 font-sans" style={{ color: "var(--muted)" }}>
          Banner เชื่อมจากหน้า /1111
        </h2>
        <div className="flex gap-4 items-start">
          <ImageUploadBox src={config.bannerImage} label="+ อัพโหลด Banner" onUploaded={(url) => patch({ bannerImage: url })} size={140} />
          <p className="text-xs font-sans flex-1" style={{ color: "var(--muted)" }}>
            รูปกว้าง แนะนำอัตราส่วนประมาณ 16:6 — ถ้าไม่ใส่รูปจะใช้พื้นหลังไล่สีทองแทนไปก่อน
          </p>
        </div>
      </div>

      {/* Looks */}
      <div className={cardClass} style={cardStyle}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs tracking-widest uppercase font-sans" style={{ color: "var(--muted)" }}>
            ลุคการจัดสไตล์ ({config.looks.length})
          </h2>
          <button
            type="button"
            onClick={addLook}
            className="px-4 py-2 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
            style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
          >
            + เพิ่มลุค
          </button>
        </div>

        {config.looks.length === 0 ? (
          <p className="text-xs font-sans py-8 text-center" style={{ color: "var(--muted)" }}>ยังไม่มีลุค — กด &ldquo;+ เพิ่มลุค&rdquo; เพื่อเริ่มต้น</p>
        ) : (
          <div className="space-y-3">
            {config.looks.map((look) => (
              <LookEditor
                key={look.id}
                look={look}
                products={products}
                onChange={(next) => updateLook(look.id, next)}
                onRemove={() => removeLook(look.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
