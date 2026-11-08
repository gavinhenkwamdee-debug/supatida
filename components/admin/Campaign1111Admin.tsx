"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/db";
import {
  CAMPAIGN_TIER_KEYS,
  campaignPrice,
  tierOf,
  type Campaign1111Config,
  type CampaignTierKey,
  type AssignedTier,
} from "@/lib/campaign-1111-config";

const THB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

const NONE_LABEL = "ไม่ร่วมรายการ";

// <input type="datetime-local"> wants/returns local wall-clock time with no
// timezone — Date's getters/setters already work in the browser's local
// timezone, so round-tripping through them is all that's needed.
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "none" (opted out entirely) sits alongside the three real discount tiers
// everywhere products get assigned or filtered, but it has no entry in
// config.tiers — there's no percent/copy to edit for "no discount".
const ASSIGN_KEYS: AssignedTier[] = [...CAMPAIGN_TIER_KEYS, "none"];

const TIER_COLOR: Record<AssignedTier, string> = {
  wishlist: "#C0392B",
  mixmatch: "#0E7490",
  extra: "#6B5E4E",
  none: "#9CA3AF",
};

const ROWS_PER_PAGE = 60;

const inputClass = "w-full px-3 py-2 text-sm font-sans outline-none";
const inputStyle = { border: "1px solid var(--border)", color: "var(--charcoal)" };
const cardClass = "bg-white p-6 mb-4";
const cardStyle = { border: "1px solid var(--border)" };

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1920;
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

export default function Campaign1111Admin() {
  const [saved, setSaved] = useState<Campaign1111Config | null>(null);
  const [draft, setDraft] = useState<Campaign1111Config | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState<AssignedTier | "all">("all");
  const [rowLimit, setRowLimit] = useState(ROWS_PER_PAGE);

  useEffect(() => {
    fetch("/api/admin/campaign-1111")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("โหลดไม่สำเร็จ (ต้องล็อกอินแอดมินก่อน)"))))
      .then((c: Campaign1111Config) => { setSaved(c); setDraft(c); })
      .catch((e: Error) => setError(e.message));
    fetch("/api/products?category=All")
      .then((r) => r.json())
      .then((d: Product[]) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  // A sold-out piece that's already assigned still shows (as "SOLD OUT") on
  // the live campaign page, but there's nothing left to manage for it here —
  // it can't be newly assigned or un-assigned to any visible effect, so it's
  // dropped from both the MECE totals and the browsable/searchable list
  // below. Once something sells out it simply stops appearing in this admin
  // tool, instead of lingering as dead clutter in every filter/search.
  const eligible = useMemo(() => products.filter((p) => !p.soldOut), [products]);

  const counts = useMemo(() => {
    const c: Record<AssignedTier, number> = { wishlist: 0, mixmatch: 0, extra: 0, none: 0 };
    if (draft) for (const p of eligible) c[tierOf(draft, p.id)]++;
    return c;
  }, [draft, eligible]);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).filter(Boolean), [products]);

  const filtered = useMemo(() => {
    if (!draft) return [];
    const q = search.trim().toLowerCase();
    return eligible.filter((p) => {
      if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
      if (tierFilter !== "all" && tierOf(draft, p.id) !== tierFilter) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (p.specifications["Product Code"] || "").toLowerCase().includes(q);
    });
  }, [eligible, draft, search, categoryFilter, tierFilter]);

  if (error && !draft) {
    return <div className="p-8 text-sm font-sans" style={{ color: "#C0392B" }}>{error}</div>;
  }
  if (!draft || !saved) {
    return <div className="p-8 text-sm font-sans" style={{ color: "var(--muted)" }}>Loading…</div>;
  }

  const config = draft;

  function patch(next: Partial<Campaign1111Config>) {
    setDraft({ ...config, ...next });
  }

  function patchTier(key: CampaignTierKey, next: Partial<Campaign1111Config["tiers"][CampaignTierKey]>) {
    setDraft({ ...config, tiers: { ...config.tiers, [key]: { ...config.tiers[key], ...next } } });
  }

  // One value per product id, and "extra" is the absence of a value — that's
  // what keeps the three tiers (plus "none", opted out entirely) mutually
  // exclusive and exhaustive.
  function assign(ids: number[], tier: AssignedTier) {
    const assignments = { ...config.assignments };
    for (const id of ids) {
      if (tier === "extra") delete assignments[String(id)];
      else assignments[String(id)] = tier;
    }
    setDraft({ ...config, assignments });
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/campaign-1111", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");
      const next: Campaign1111Config = await res.json();
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

  async function handleBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", await compressImage(file));
      const res = await fetch("/api/upload-banner", { method: "POST", body: formData });
      if (res.ok) patch({ bannerImage: (await res.json()).url });
      else setError("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const total = eligible.length;
  const mece = counts.wishlist + counts.mixmatch + counts.extra + counts.none === total;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl tracking-wider" style={{ color: "var(--charcoal)" }}>แคมเปญ 11.11</h1>
          <p className="text-xs font-sans mt-1" style={{ color: "var(--muted)" }}>
            3 ระดับส่วนลด — สินค้าแต่ละชิ้นอยู่ได้ระดับเดียว ที่ไม่ได้เลือกจะตกไป Little Extra อัตโนมัติ (หรือกด ✕ เพื่อไม่ร่วมรายการเลย)
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <a href="/1111" target="_blank" className="text-xs tracking-widest uppercase underline font-sans" style={{ color: "var(--charcoal)" }}>ดูหน้าแคมเปญ ↗</a>
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

      {/* Enabled */}
      <div className={cardClass} style={cardStyle}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm tracking-wide" style={{ color: "var(--charcoal)" }}>เปิดแคมเปญ 11.11</p>
            <p className="text-xs font-sans mt-0.5" style={{ color: "var(--muted)" }}>เปิดแล้วจะมีแท็บ 11.11 บนเมนู และหน้า /1111 ใช้งานได้</p>
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

      {/* Countdown + urgency note */}
      <div className={cardClass} style={cardStyle}>
        <h2 className="text-xs tracking-widest uppercase mb-4 font-sans" style={{ color: "var(--muted)" }}>ตัวนับถอยหลัง + ข้อความเร่งด่วน</h2>
        <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>แคมเปญสิ้นสุดวันที่ (เว้นว่างเพื่อไม่แสดงตัวนับถอยหลัง)</label>
        <input
          type="datetime-local"
          value={toDatetimeLocal(config.endsAt)}
          onChange={(e) => {
            if (!e.target.value) { patch({ endsAt: "" }); return; }
            const d = new Date(e.target.value);
            if (!Number.isNaN(d.getTime())) patch({ endsAt: d.toISOString() });
          }}
          className={`${inputClass} mb-4`}
          style={inputStyle}
        />
        <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>ข้อความเร่งด่วน (โชว์ใต้ตัวนับถอยหลัง เว้นว่างเพื่อไม่แสดง)</label>
        <input value={config.urgencyNote} onChange={(e) => patch({ urgencyNote: e.target.value })} className={inputClass} style={inputStyle} />
      </div>

      {/* Tiers */}
      <div className={cardClass} style={cardStyle}>
        <h2 className="text-xs tracking-widest uppercase mb-1 font-sans" style={{ color: "var(--muted)" }}>ระดับส่วนลดและข้อความ</h2>
        <p className="text-xs font-sans mb-4" style={{ color: "var(--muted)" }}>
          ใส่ <code>{"{percent}"}</code> ในข้อความเพื่อให้แสดงเลขส่วนลดตามช่อง % อัตโนมัติ · ราคาหลังลดปัดขึ้นเป็นหลักร้อยเสมอ
        </p>
        <div className="space-y-5">
          {CAMPAIGN_TIER_KEYS.map((key) => {
            const t = config.tiers[key];
            return (
              <div key={key} className="p-4" style={{ border: "1px solid var(--border)", borderLeft: `4px solid ${TIER_COLOR[key]}` }}>
                <div className="grid grid-cols-[88px_1fr] gap-3 mb-3">
                  <div>
                    <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>ลด (%)</label>
                    <input type="number" min={0} max={100} step={1} value={t.percent} onChange={(e) => patchTier(key, { percent: Number(e.target.value) })} className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>ชื่อระดับ</label>
                    <input value={t.name} onChange={(e) => patchTier(key, { name: e.target.value })} className={inputClass} style={inputStyle} />
                  </div>
                </div>
                <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>หัวข้อ</label>
                <input value={t.headline} onChange={(e) => patchTier(key, { headline: e.target.value })} className={`${inputClass} mb-3`} style={inputStyle} />
                <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>รายละเอียด</label>
                <input value={t.description} onChange={(e) => patchTier(key, { description: e.target.value })} className={inputClass} style={inputStyle} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Banner */}
      <div className={cardClass} style={cardStyle}>
        <h2 className="text-xs tracking-widest uppercase mb-4 font-sans" style={{ color: "var(--muted)" }}>Banner (ไม่บังคับ)</h2>
        {config.bannerImage && (
          <div className="relative w-full mb-4 overflow-hidden" style={{ aspectRatio: "3/1", backgroundColor: "var(--img-bg)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.bannerImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleBanner} />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex-1 py-6 text-sm font-sans border-2 border-dashed disabled:opacity-50"
            style={{ borderColor: "var(--border)", color: "var(--muted)", backgroundColor: "#FAF8F4" }}
          >
            {uploading ? "กำลังอัปโหลด…" : config.bannerImage ? "เปลี่ยนรูป Banner" : "+ อัปโหลดรูป Banner (แนะนำ 1920×640px, อัตราส่วน 3:1)"}
          </button>
          {config.bannerImage && (
            <button type="button" onClick={() => patch({ bannerImage: "" })} className="px-4 text-xs tracking-wider uppercase underline font-sans" style={{ color: "#C0392B" }}>
              ลบ
            </button>
          )}
        </div>
      </div>

      {/* Assignment */}
      <div className={cardClass} style={cardStyle}>
        <h2 className="text-xs tracking-widest uppercase mb-3 font-sans" style={{ color: "var(--muted)" }}>จัดสินค้าเข้าระดับ</h2>

        <div className="grid grid-cols-4 gap-2 mb-2">
          {ASSIGN_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => { setTierFilter(tierFilter === key ? "all" : key); setRowLimit(ROWS_PER_PAGE); }}
              className="p-3 text-center transition-opacity"
              style={{
                border: `1px solid ${TIER_COLOR[key]}`,
                backgroundColor: tierFilter === key ? TIER_COLOR[key] : "white",
                color: tierFilter === key ? "white" : TIER_COLOR[key],
              }}
            >
              <span className="block text-2xl font-sans font-light leading-none">{counts[key]}</span>
              <span className="block text-[11px] tracking-wider uppercase font-sans mt-1">
                {key === "none" ? NONE_LABEL : `${config.tiers[key].name} · ${config.tiers[key].percent}%`}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs font-sans mb-4" style={{ color: mece ? "#2E7D32" : "#C0392B" }}>
          {mece ? "✓" : "✗"} สินค้าพร้อมขายทั้งหมด {total} ชิ้น = {counts.wishlist} + {counts.mixmatch} + {counts.extra} + {counts.none} (ไม่ซ้ำ ไม่ตกหล่น)
          <span style={{ color: "var(--muted)" }}> · สินค้าหมดสต็อกไม่แสดงในแคมเปญ</span>
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setRowLimit(ROWS_PER_PAGE); }}
            placeholder="ค้นหาชื่อ หรือ Product Code…"
            className="flex-1 min-w-[200px] px-3 py-2 text-xs font-sans outline-none"
            style={inputStyle}
          />
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setRowLimit(ROWS_PER_PAGE); }}
            className="px-3 py-2 text-xs font-sans outline-none bg-white"
            style={inputStyle}
          >
            <option value="All">ทุกหมวด</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4 p-3" style={{ backgroundColor: "#FAF8F4", border: "1px solid var(--border)" }}>
          <span className="text-xs font-sans" style={{ color: "var(--muted)" }}>ตั้งทั้งหมดที่แสดงอยู่ ({filtered.length}) เป็น:</span>
          {ASSIGN_KEYS.map((key) => {
            const label = key === "none" ? NONE_LABEL : config.tiers[key].name;
            return (
              <button
                key={key}
                type="button"
                disabled={filtered.length === 0}
                onClick={() => {
                  if (filtered.length > 1 && !confirm(`ย้ายสินค้า ${filtered.length} ชิ้นไป ${label}?`)) return;
                  assign(filtered.map((p) => p.id), key);
                }}
                className="px-3 py-1.5 text-xs font-sans text-white disabled:opacity-40"
                style={{ backgroundColor: TIER_COLOR[key] }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p className="text-xs font-sans py-8 text-center" style={{ color: "var(--muted)" }}>ไม่พบสินค้า</p>
        ) : (
          <div className="space-y-2">
            {filtered.slice(0, rowLimit).map((p) => {
              const current = tierOf(config, p.id);
              const image = p.images.find(Boolean);
              return (
                <div key={p.id} className="flex items-center gap-3 p-2" style={{ border: "1px solid var(--border)", opacity: p.soldOut ? 0.5 : 1 }}>
                  <div className="relative flex-shrink-0 overflow-hidden" style={{ width: 44, height: 44, backgroundColor: "var(--img-bg)" }}>
                    {image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" style={{ color: "var(--charcoal)" }}>{p.name}</p>
                    <p className="text-xs font-mono truncate" style={{ color: "var(--muted)" }}>
                      {p.specifications["Product Code"] || `#${p.id}`} · {THB(p.price)}
                      {current === "none" ? ` · ${NONE_LABEL}` : ` → ${THB(campaignPrice(p.price, config.tiers[current].percent))}`}
                      {p.soldOut && " · หมดสต็อก"}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0">
                    {ASSIGN_KEYS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => assign([p.id], key)}
                        title={key === "none" ? NONE_LABEL : config.tiers[key].name}
                        className="px-2.5 py-1.5 text-xs font-sans"
                        style={{
                          border: `1px solid ${TIER_COLOR[key]}`,
                          marginLeft: -1,
                          backgroundColor: current === key ? TIER_COLOR[key] : "white",
                          color: current === key ? "white" : TIER_COLOR[key],
                        }}
                      >
                        {key === "none" ? "✕" : `${config.tiers[key].percent}%`}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {filtered.length > rowLimit && (
              <button
                type="button"
                onClick={() => setRowLimit((n) => n + ROWS_PER_PAGE)}
                className="w-full py-3 text-xs tracking-widest uppercase font-sans"
                style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
              >
                แสดงเพิ่ม ({filtered.length - rowLimit})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
