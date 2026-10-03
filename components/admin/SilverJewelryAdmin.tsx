"use client";

import { useEffect, useRef, useState } from "react";
import type { SilverSectionConfig, SilverProduct, SilverTier, SilverMediaType } from "@/lib/silverJewelryTypes";
import { SILVER_TIERS } from "@/lib/silverJewelryTypes";

const THB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

const TIER_LABEL_TH: Record<SilverTier, string> = {
  starter: "Starter",
  elegance: "Elegance",
  luxury: "Luxury",
};

const labelClass = "block text-xs tracking-widest uppercase mb-1.5 font-sans";
const labelStyle = { color: "#6B7686" };
const fieldClass = "w-full px-3 py-2 text-sm font-sans outline-none";
const fieldStyle = { border: "1px solid #D4D8DD", color: "#1B2A4A", backgroundColor: "white" };
const sectionStyle = { backgroundColor: "white", border: "1px solid #D4D8DD" };

type EmptyProduct = Omit<SilverProduct, "id" | "createdAt" | "updatedAt">;

function emptyProduct(tier: SilverTier): EmptyProduct {
  return {
    sku: "",
    name: "",
    tier,
    price: 0,
    category: "",
    description: "",
    metal: "Sterling Silver 925",
    weight: "",
    size: "",
    images: [],
    soldOut: false,
    hidden: false,
    sortOrder: 0,
  };
}

export default function SilverJewelryAdmin() {
  const [config, setConfig] = useState<SilverSectionConfig | null>(null);
  const [products, setProducts] = useState<SilverProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/silver-jewelry/config").then((r) => r.json()),
      fetch("/api/admin/silver-jewelry").then((r) => r.json()),
    ]).then(([c, p]) => {
      setConfig(c);
      setProducts(p);
      setLoading(false);
    });
  }, []);

  async function saveConfig(next: SilverSectionConfig) {
    setConfig(next);
    setSavingConfig(true);
    setConfigSaved(false);
    const res = await fetch("/api/admin/silver-jewelry/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const saved = await res.json();
    setConfig(saved);
    setSavingConfig(false);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  }

  function refreshProducts() {
    fetch("/api/admin/silver-jewelry").then((r) => r.json()).then(setProducts);
  }

  if (loading || !config) {
    return <div className="p-8 text-sm font-sans" style={{ color: "#6B7686" }}>Loading…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-wider" style={{ color: "#1B2A4A" }}>Premium Silver</h1>
          <p className="text-xs font-sans mt-1" style={labelStyle}>
            หมวด Silver Jewelry — Starter / Elegance / Luxury
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/admin" className="text-xs tracking-widest uppercase underline font-sans" style={labelStyle}>← Back</a>
          <a href="/silver-jewelry" target="_blank" className="text-xs tracking-widest uppercase underline font-sans" style={{ color: "#1B2A4A" }}>
            View Page ↗
          </a>
        </div>
      </div>

      {/* Section toggle */}
      <div className="p-5 flex items-center justify-between" style={sectionStyle}>
        <div>
          <p className="text-sm font-sans" style={{ color: "#1B2A4A" }}>เปิดใช้งานหมวด Premium Silver</p>
          <p className="text-xs font-sans mt-0.5" style={labelStyle}>ปิดแล้วหน้า /silver-jewelry จะขึ้น 404 ทันที</p>
        </div>
        <ToggleSwitch checked={config.enabled} onChange={(v) => saveConfig({ ...config, enabled: v })} />
      </div>

      {/* Tiers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SILVER_TIERS.map((tier) => (
          <div key={tier} className="p-5" style={sectionStyle}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm tracking-wide" style={{ color: "#1B2A4A" }}>{TIER_LABEL_TH[tier]}</span>
              <ToggleSwitch
                checked={config.tiers[tier].enabled}
                onChange={(v) =>
                  saveConfig({ ...config, tiers: { ...config.tiers, [tier]: { ...config.tiers[tier], enabled: v } } })
                }
              />
            </div>
            <label className={labelClass} style={labelStyle}>ชื่อที่โชว์</label>
            <input
              className={fieldClass}
              style={{ ...fieldStyle, marginBottom: 8 }}
              value={config.tiers[tier].label}
              onChange={(e) =>
                saveConfig({ ...config, tiers: { ...config.tiers, [tier]: { ...config.tiers[tier], label: e.target.value } } })
              }
            />
            <label className={labelClass} style={labelStyle}>แท็กไลน์</label>
            <input
              className={fieldClass}
              style={fieldStyle}
              value={config.tiers[tier].tagline}
              onChange={(e) =>
                saveConfig({ ...config, tiers: { ...config.tiers, [tier]: { ...config.tiers[tier], tagline: e.target.value } } })
              }
            />
            <p className="text-xs font-sans mt-3" style={labelStyle}>
              {products.filter((p) => p.tier === tier).length} สินค้า
            </p>
          </div>
        ))}
      </div>

      {/* Banner */}
      <BannerEditor config={config} onChange={saveConfig} />

      {/* Popup */}
      <PopupEditor config={config} onChange={saveConfig} />

      {(savingConfig || configSaved) && (
        <p className="text-xs font-sans" style={{ color: configSaved ? "#2E7D32" : "#6B7686" }}>
          {savingConfig ? "กำลังบันทึก…" : "บันทึกแล้ว ✓"}
        </p>
      )}

      {/* Import */}
      <ImportFromSheet onImported={refreshProducts} />

      {/* Products */}
      <ProductsManager products={products} onChange={refreshProducts} />
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 transition-colors flex-shrink-0"
      style={{ backgroundColor: checked ? "#1B2A4A" : "#D4D8DD" }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 bg-white transition-transform"
        style={{ left: 2, transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

function MediaUploader({
  mediaType,
  mediaUrl,
  onUploaded,
}: {
  mediaType: SilverMediaType;
  mediaUrl: string;
  onUploaded: (url: string, mediaType: SilverMediaType) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-silver", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onUploaded(data.url, data.mediaType);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {mediaUrl && (
        <div className="mb-2 relative" style={{ width: 240, aspectRatio: "16/9", backgroundColor: "#0F1626" }}>
          {mediaType === "video" ? (
            <video src={mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 text-xs tracking-widest uppercase font-sans transition-opacity disabled:opacity-60"
        style={{ backgroundColor: "#1B2A4A", color: "#E8EAED" }}
      >
        {uploading ? "กำลังอัปโหลด…" : mediaUrl ? "เปลี่ยนไฟล์" : "อัปโหลดรูป/วิดีโอ"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
      <p className="text-xs mt-1 font-sans" style={labelStyle}>รูป ≤ 8MB หรือวิดีโอ ≤ 50MB</p>
      {error && <p className="text-xs mt-1 font-sans" style={{ color: "#C0392B" }}>{error}</p>}
    </div>
  );
}

function BannerEditor({
  config,
  onChange,
}: {
  config: SilverSectionConfig;
  onChange: (c: SilverSectionConfig) => void;
}) {
  const banner = config.banner;
  return (
    <div className="p-5" style={sectionStyle}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm tracking-wide" style={{ color: "#1B2A4A" }}>Banner บนหน้า Premium Silver</p>
        <ToggleSwitch checked={banner.enabled} onChange={(v) => onChange({ ...config, banner: { ...banner, enabled: v } })} />
      </div>
      <MediaUploader
        mediaType={banner.mediaType}
        mediaUrl={banner.mediaUrl}
        onUploaded={(url, mediaType) => onChange({ ...config, banner: { ...banner, mediaUrl: url, mediaType } })}
      />
      <div className="mt-4">
        <label className={labelClass} style={labelStyle}>ลิงก์เมื่อกด Banner (ไม่ใส่ก็ได้)</label>
        <input
          className={fieldClass}
          style={fieldStyle}
          value={banner.link}
          placeholder="https://..."
          onChange={(e) => onChange({ ...config, banner: { ...banner, link: e.target.value } })}
        />
      </div>
    </div>
  );
}

function PopupEditor({
  config,
  onChange,
}: {
  config: SilverSectionConfig;
  onChange: (c: SilverSectionConfig) => void;
}) {
  const popup = config.popup;
  const set = (patch: Partial<SilverSectionConfig["popup"]>) => onChange({ ...config, popup: { ...popup, ...patch } });

  return (
    <div className="p-5" style={sectionStyle}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm tracking-wide" style={{ color: "#1B2A4A" }}>Popup (โชว์บนหน้า Premium Silver เท่านั้น)</p>
        <ToggleSwitch checked={popup.enabled} onChange={(v) => set({ enabled: v })} />
      </div>

      <MediaUploader
        mediaType={popup.mediaType}
        mediaUrl={popup.mediaUrl}
        onUploaded={(url, mediaType) => set({ mediaUrl: url, mediaType })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className={labelClass} style={labelStyle}>หัวข้อ</label>
          <input className={fieldClass} style={fieldStyle} value={popup.heading} onChange={(e) => set({ heading: e.target.value })} />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>ปุ่ม CTA</label>
          <input className={fieldClass} style={fieldStyle} value={popup.ctaText} onChange={(e) => set({ ctaText: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} style={labelStyle}>ข้อความ</label>
          <textarea className={fieldClass} style={{ ...fieldStyle, minHeight: 70 }} value={popup.text} onChange={(e) => set({ text: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} style={labelStyle}>ลิงก์ CTA</label>
          <input className={fieldClass} style={fieldStyle} value={popup.ctaLink} onChange={(e) => set({ ctaLink: e.target.value })} />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Trigger</label>
          <select
            className={fieldClass}
            style={fieldStyle}
            value={popup.triggerType}
            onChange={(e) => set({ triggerType: e.target.value as "delay" | "scroll" })}
          >
            <option value="delay">หน่วงเวลา (วินาที)</option>
            <option value="scroll">เลื่อนหน้าจอ (%)</option>
          </select>
        </div>
        <div>
          {popup.triggerType === "delay" ? (
            <>
              <label className={labelClass} style={labelStyle}>วินาที</label>
              <input type="number" min={0} className={fieldClass} style={fieldStyle} value={popup.delaySeconds}
                onChange={(e) => set({ delaySeconds: Number(e.target.value) || 0 })} />
            </>
          ) : (
            <>
              <label className={labelClass} style={labelStyle}>เปอร์เซ็นต์การเลื่อน</label>
              <input type="number" min={0} max={100} className={fieldClass} style={fieldStyle} value={popup.scrollPercent}
                onChange={(e) => set({ scrollPercent: Number(e.target.value) || 0 })} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Bulk import from the Google Sheet tab (export that tab as CSV/XLSX, upload here) ──
function ImportFromSheet({ onImported }: { onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null);

  const HEADER_MAP: Record<string, keyof EmptyProduct> = {
    sku: "sku",
    tier: "tier",
    name: "name",
    price: "price",
    category: "category",
    description: "description",
    metal: "metal",
    weight: "weight",
    size: "size",
  };

  async function handleFile(file: File) {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (rows.length < 2) throw new Error("ไฟล์ว่างหรือไม่มีข้อมูล");

      const headers = rows[0].map((h: string) => String(h).trim().toLowerCase());
      const colIndex: Partial<Record<keyof EmptyProduct, number>> = {};
      headers.forEach((h: string, i: number) => {
        const key = HEADER_MAP[h];
        if (key) colIndex[key] = i;
      });
      const imgIdx = [0, 1, 2].map((n) => headers.indexOf(`image url ${n + 1}`));
      const soldOutIdx = headers.indexOf("sold out");
      const hiddenIdx = headers.indexOf("hidden");

      const products = [];
      for (const row of rows.slice(1)) {
        const name = String(row[colIndex.name ?? -1] ?? "").trim();
        if (!name) continue;
        const tierRaw = String(row[colIndex.tier ?? -1] ?? "starter").trim().toLowerCase();
        const tier = (["starter", "elegance", "luxury"].includes(tierRaw) ? tierRaw : "starter") as SilverTier;
        const images = imgIdx.map((idx) => (idx >= 0 ? String(row[idx] ?? "").trim() : "")).filter(Boolean);

        products.push({
          sku: String(row[colIndex.sku ?? -1] ?? "").trim(),
          name,
          tier,
          price: Number(row[colIndex.price ?? -1]) || 0,
          category: String(row[colIndex.category ?? -1] ?? "").trim(),
          description: String(row[colIndex.description ?? -1] ?? "").trim(),
          metal: String(row[colIndex.metal ?? -1] ?? "").trim(),
          weight: String(row[colIndex.weight ?? -1] ?? "").trim(),
          size: String(row[colIndex.size ?? -1] ?? "").trim(),
          images,
          soldOut: soldOutIdx >= 0 ? /^(y|yes|true|1)$/i.test(String(row[soldOutIdx] ?? "")) : false,
          hidden: hiddenIdx >= 0 ? /^(y|yes|true|1)$/i.test(String(row[hiddenIdx] ?? "")) : false,
        });
      }
      if (products.length === 0) throw new Error("ไม่พบแถวข้อมูลที่ใช้ได้ (ต้องมีคอลัมน์ Name อย่างน้อย)");

      const res = await fetch("/api/admin/silver-jewelry/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
      onImported();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "อ่านไฟล์ไม่ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-5" style={sectionStyle}>
      <p className="text-sm tracking-wide mb-1" style={{ color: "#1B2A4A" }}>Bulk Import จาก Google Sheet</p>
      <p className="text-xs font-sans mb-4" style={labelStyle}>
        ไปที่แท็บ &quot;Premium Silver Import&quot; ในชีท Stock → File → Download → CSV (แท็บปัจจุบัน) หรือ Excel (.xlsx)
        แล้วอัปโหลดไฟล์นั้นที่นี่ สินค้าที่มี SKU ตรงกับของเดิมจะอัปเดตราคา/ข้อมูลแทนการสร้างซ้ำ
      </p>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="px-5 py-2.5 text-xs tracking-widest uppercase font-sans transition-opacity disabled:opacity-60"
        style={{ backgroundColor: "#1B2A4A", color: "#E8EAED" }}
      >
        {loading ? "กำลังนำเข้า…" : "เลือกไฟล์ .csv / .xlsx"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
      {error && <p className="text-xs mt-3 font-sans" style={{ color: "#C0392B" }}>{error}</p>}
      {result && (
        <p className="text-xs mt-3 font-sans" style={{ color: "#2E7D32" }}>
          สำเร็จ — เพิ่มใหม่ {result.created} รายการ, อัปเดต {result.updated} รายการ
        </p>
      )}
    </div>
  );
}

// ── Product list + inline add/edit ──
function ProductsManager({ products, onChange }: { products: SilverProduct[]; onChange: () => void }) {
  const [editing, setEditing] = useState<SilverProduct | EmptyProduct | null>(null);

  async function handleDelete(p: SilverProduct) {
    if (!confirm(`ลบ "${p.name}"?`)) return;
    await fetch(`/api/admin/silver-jewelry/${p.id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div className="space-y-6">
      {SILVER_TIERS.map((tier) => {
        const list = products.filter((p) => p.tier === tier);
        return (
          <div key={tier} className="p-5" style={sectionStyle}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm tracking-wide" style={{ color: "#1B2A4A" }}>
                {TIER_LABEL_TH[tier]} <span className="text-xs font-sans" style={labelStyle}>({list.length})</span>
              </p>
              <button
                onClick={() => setEditing(emptyProduct(tier))}
                className="px-4 py-2 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
                style={{ backgroundColor: "#1B2A4A", color: "#E8EAED" }}
              >
                + Add Product
              </button>
            </div>
            {list.length === 0 ? (
              <p className="text-xs font-sans" style={labelStyle}>ยังไม่มีสินค้าในระดับนี้</p>
            ) : (
              <div className="space-y-2">
                {list.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3" style={{ border: "1px solid #D4D8DD" }}>
                    <div className="relative flex-shrink-0 overflow-hidden" style={{ width: 48, height: 48, backgroundColor: "#EEF0F3" }}>
                      {p.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-sans truncate" style={{ color: "#1B2A4A" }}>{p.name}</p>
                      <p className="text-xs font-sans" style={labelStyle}>
                        {THB(p.price)} {p.sku && `· ${p.sku}`} {p.hidden && "· ซ่อนอยู่"} {p.soldOut && "· Sold Out"}
                      </p>
                    </div>
                    <button onClick={() => setEditing(p)} className="text-xs tracking-wider uppercase underline font-sans flex-shrink-0" style={{ color: "#1B2A4A" }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p)} className="text-xs tracking-wider uppercase underline font-sans flex-shrink-0" style={{ color: "#C0392B" }}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {editing && (
        <ProductEditorModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onChange(); }}
        />
      )}
    </div>
  );
}

function ProductEditorModal({
  product,
  onClose,
  onSaved,
}: {
  product: SilverProduct | EmptyProduct;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = "id" in product;
  const [form, setForm] = useState(product);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  function set<K extends keyof EmptyProduct>(key: K, value: EmptyProduct[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageUpload(file: File) {
    setUploadingImg(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-silver", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      set("images", [...form.images, data.url].slice(0, 5));
    } catch {
      setError("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadingImg(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, name: form.name.trim() || "Untitled" };
      const res = isEdit
        ? await fetch(`/api/admin/silver-jewelry/${(product as SilverProduct).id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/silver-jewelry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) throw new Error("Save failed");
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(10,16,30,0.6)" }}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" style={{ backgroundColor: "white" }}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-base tracking-wide" style={{ color: "#1B2A4A" }}>
            {isEdit ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"} — {TIER_LABEL_TH[form.tier]}
          </p>
          <button onClick={onClose} className="text-sm" style={{ color: "#6B7686" }}>✕</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={labelStyle}>ชื่อสินค้า</label>
            <input className={fieldClass} style={fieldStyle} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>SKU</label>
            <input className={fieldClass} style={fieldStyle} value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>ราคา (THB)</label>
            <input type="number" className={fieldClass} style={fieldStyle} value={form.price} onChange={(e) => set("price", Number(e.target.value) || 0)} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Tier</label>
            <select className={fieldClass} style={fieldStyle} value={form.tier} onChange={(e) => set("tier", e.target.value as SilverTier)}>
              {SILVER_TIERS.map((t) => <option key={t} value={t}>{TIER_LABEL_TH[t]}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>หมวดหมู่</label>
            <input className={fieldClass} style={fieldStyle} value={form.category} placeholder="Ring / Necklace / Earring / Bracelet" onChange={(e) => set("category", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>น้ำหนัก</label>
            <input className={fieldClass} style={fieldStyle} value={form.weight} placeholder="e.g. 3.5 g" onChange={(e) => set("weight", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>เนื้อโลหะ</label>
            <input className={fieldClass} style={fieldStyle} value={form.metal} onChange={(e) => set("metal", e.target.value)} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>ไซส์</label>
            <input className={fieldClass} style={fieldStyle} value={form.size} onChange={(e) => set("size", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} style={labelStyle}>คำอธิบาย</label>
            <textarea className={fieldClass} style={{ ...fieldStyle, minHeight: 70 }} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelClass} style={labelStyle}>รูปภาพ ({form.images.length}/5)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.images.map((img, i) => (
              <div key={i} className="relative" style={{ width: 64, height: 64, backgroundColor: "#EEF0F3" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => set("images", form.images.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 text-xs flex items-center justify-center"
                  style={{ backgroundColor: "rgba(0,0,0,0.65)", color: "white" }}
                >✕</button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => imgInputRef.current?.click()}
            disabled={uploadingImg || form.images.length >= 5}
            className="px-4 py-2 text-xs tracking-widest uppercase font-sans transition-opacity disabled:opacity-50"
            style={{ border: "1px solid #D4D8DD", color: "#1B2A4A" }}
          >
            {uploadingImg ? "กำลังอัปโหลด…" : "+ เพิ่มรูป"}
          </button>
          <input ref={imgInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ""; }} />
        </div>

        <div className="flex items-center gap-6 mt-4">
          <label className="flex items-center gap-2 text-xs font-sans" style={{ color: "#1B2A4A" }}>
            <input type="checkbox" checked={form.soldOut} onChange={(e) => set("soldOut", e.target.checked)} />
            Sold Out
          </label>
          <label className="flex items-center gap-2 text-xs font-sans" style={{ color: "#1B2A4A" }}>
            <input type="checkbox" checked={form.hidden} onChange={(e) => set("hidden", e.target.checked)} />
            ซ่อนสินค้านี้
          </label>
        </div>

        {error && <p className="text-xs mt-3 font-sans" style={{ color: "#C0392B" }}>{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 text-xs tracking-widest uppercase font-sans transition-opacity disabled:opacity-60"
            style={{ backgroundColor: "#1B2A4A", color: "#E8EAED" }}
          >
            {saving ? "กำลังบันทึก…" : "บันทึก"}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 text-xs tracking-widest uppercase font-sans" style={{ border: "1px solid #D4D8DD", color: "#6B7686" }}>
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
