"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PreviewProduct {
  code: string;
  name: string;
  category: string;
  price: number;
  specifications: Record<string, string>;
  duplicate: boolean;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

export default function ImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<PreviewProduct[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importedCount, setImportedCount] = useState(0);

  // ── Step 1: Upload & Preview ──────────────────────────────
  async function handleFile(file: File) {
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      setProducts(data.products);
      // Pre-select all non-duplicates
      const sel = new Set<number>();
      data.products.forEach((p: PreviewProduct, i: number) => {
        if (!p.duplicate) sel.add(i);
      });
      setSelected(sel);
      setStep("preview");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Execute Import ────────────────────────────────
  async function handleImport() {
    setLoading(true);
    setError("");
    const toImport = products.filter((_, i) => selected.has(i));
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: toImport }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setImportedCount(data.created);
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  function toggleAll() {
    if (selected.size === products.filter((p) => !p.duplicate).length) {
      setSelected(new Set());
    } else {
      const sel = new Set<number>();
      products.forEach((p, i) => { if (!p.duplicate) sel.add(i); });
      setSelected(sel);
    }
  }

  const labelStyle = { color: "var(--muted)" };
  const nonDupCount = products.filter((p) => !p.duplicate).length;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-xs tracking-widest uppercase font-sans" style={labelStyle}>
          ← Dashboard
        </Link>
        <span style={{ color: "var(--border)" }}>/</span>
        <span className="text-xs tracking-widest uppercase font-sans" style={{ color: "var(--charcoal)" }}>
          Bulk Import
        </span>
      </div>

      <h2 className="text-xl tracking-wider mb-2" style={{ color: "var(--charcoal)" }}>
        Bulk Import from Excel
      </h2>
      <p className="text-sm font-sans mb-6" style={labelStyle}>
        อัปโหลดไฟล์ Stock Excel — ระบบจะ import เฉพาะรายการที่มีสถานะ <strong>ขาย</strong> เท่านั้น
      </p>

      {/* ── STEP: UPLOAD ── */}
      {step === "upload" && (
        <div className="bg-white p-10 text-center" style={{ border: "2px dashed var(--border)" }}>
          <div className="text-4xl mb-4" style={{ color: "var(--gold)" }}>📊</div>
          <p className="text-sm font-sans mb-1" style={{ color: "var(--charcoal)" }}>
            ลากไฟล์ Excel มาวางที่นี่ หรือ
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="mt-3 px-8 py-3 text-xs tracking-widest uppercase font-sans transition-opacity disabled:opacity-60"
            style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
          >
            {loading ? "กำลังอ่านไฟล์…" : "เลือกไฟล์ .xlsx"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <p className="text-xs mt-4 font-sans" style={labelStyle}>รองรับ .xlsx และ .xls</p>
          {error && <p className="text-xs mt-3 font-sans" style={{ color: "#C0392B" }}>{error}</p>}
        </div>
      )}

      {/* ── STEP: PREVIEW ── */}
      {step === "preview" && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "รายการทั้งหมด", value: products.length },
              { label: "เลือก Import", value: selected.size },
              { label: "ข้ามแล้ว (ซ้ำ)", value: products.length - nonDupCount },
            ].map((s) => (
              <div key={s.label} className="bg-white p-4 text-center" style={{ border: "1px solid var(--border)" }}>
                <p className="text-2xl font-light mb-1" style={{ color: "var(--charcoal)" }}>{s.value}</p>
                <p className="text-xs uppercase tracking-widest font-sans" style={labelStyle}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <button onClick={toggleAll} className="text-xs tracking-widest uppercase underline font-sans"
                style={{ color: "var(--gold-dark)" }}>
                {selected.size === nonDupCount ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
              </button>
              <span className="text-xs font-sans" style={labelStyle}>
                เลือก {selected.size} / {nonDupCount} รายการ
              </span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("upload")}
                className="px-5 py-2.5 text-xs tracking-widest uppercase font-sans"
                style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
                เลือกไฟล์ใหม่
              </button>
              <button
                onClick={handleImport}
                disabled={loading || selected.size === 0}
                className="px-6 py-2.5 text-xs tracking-widest uppercase font-sans transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
              >
                {loading ? "กำลัง Import…" : `Import ${selected.size} รายการ`}
              </button>
            </div>
          </div>

          {error && <p className="text-xs mb-4 font-sans" style={{ color: "#C0392B" }}>{error}</p>}

          {/* Table */}
          <div className="bg-white overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "#FAF8F4" }}>
                  <th className="w-10 px-4 py-3"></th>
                  {["รหัส", "ชื่อสินค้า (Auto)", "หมวด", "โลหะ", "น้ำหนักเพชร", "ราคา", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs tracking-widest uppercase font-sans"
                      style={{ color: "var(--muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const isSelected = selected.has(i);
                  const isDup = p.duplicate;
                  return (
                    <tr key={i}
                      style={{ borderBottom: "1px solid var(--border)", opacity: isDup ? 0.45 : 1 }}
                      className="transition-colors hover:bg-amber-50/20">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDup}
                          onChange={() => {
                            const s = new Set(selected);
                            if (s.has(i)) s.delete(i); else s.add(i);
                            setSelected(s);
                          }}
                          className="w-4 h-4 cursor-pointer"
                          style={{ accentColor: "var(--gold)" }}
                        />
                      </td>
                      <td className="px-4 py-3 font-sans text-xs" style={{ color: "var(--muted)" }}>{p.code}</td>
                      <td className="px-4 py-3 font-sans text-xs" style={{ color: "var(--charcoal)", maxWidth: "200px" }}>
                        {p.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 font-sans"
                          style={{ backgroundColor: "#F5F0E8", color: "var(--gold-dark)", border: "1px solid var(--border)" }}>
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-sans" style={{ color: "var(--charcoal)" }}>
                        {[p.specifications["Metal Color"], p.specifications["Metal"]].filter(Boolean).join(" · ")}
                      </td>
                      <td className="px-4 py-3 text-xs font-sans" style={{ color: "var(--muted)" }}>
                        {p.specifications["Total Carat Weight"] || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-sans font-light" style={{ color: "var(--gold)" }}>
                        {fmt(p.price)}
                      </td>
                      <td className="px-4 py-3">
                        {isDup && (
                          <span className="text-xs font-sans px-2 py-0.5"
                            style={{ backgroundColor: "#FEF3CD", color: "#856404" }}>
                            ซ้ำ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STEP: DONE ── */}
      {step === "done" && (
        <div className="bg-white p-16 text-center" style={{ border: "1px solid var(--border)" }}>
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl tracking-wider mb-2" style={{ color: "var(--charcoal)" }}>
            Import สำเร็จ!
          </h3>
          <p className="text-sm font-sans mb-8" style={{ color: "var(--muted)" }}>
            เพิ่มสินค้าเข้าระบบแล้ว <strong>{importedCount} รายการ</strong>
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => { setStep("upload"); setProducts([]); setSelected(new Set()); }}
              className="px-6 py-3 text-xs tracking-widest uppercase font-sans"
              style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
            >
              Import เพิ่มเติม
            </button>
            <button
              onClick={() => { router.push("/admin"); router.refresh(); }}
              className="px-6 py-3 text-xs tracking-widest uppercase font-sans"
              style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
            >
              ไปที่ Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
