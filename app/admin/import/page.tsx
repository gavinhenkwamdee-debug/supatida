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
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(n);

// ── Thai → English maps (client-side) ────────────────────
const CATEGORY_MAP: Record<string, string> = {
  แหวน: "Rings",
  ต่างหู: "Earrings",
  สร้อยข้อมือ: "Bracelets",
  สร้อยคอ: "Necklaces",
  จี้: "Pendants",
  กำไล: "Bracelets",
};
const METAL_COLOR_MAP: Record<string, string> = {
  ทองซีด: "Yellow Gold",
  โรสโกลด์: "Rose Gold",
  ทองคำขาว: "White Gold",
  เงิน: "Silver",
  แพลทินัม: "Platinum",
};
const METAL_TYPE_MAP: Record<string, string> = {
  "14K": "14K Gold", "18K": "18K Gold", "10K": "10K Gold",
  "10k": "10K Gold", "9K": "9K Gold", PT950: "Platinum 950", Silver: "Silver",
};

const COL = {
  CODE: 0, CATEGORY: 1, STATUS: 2, ITEM_ID: 4,
  METAL_COLOR: 5, SIZE: 7, DIAMOND_SIZE: 8, DIAMOND_FACE: 9,
  DIAMOND_COUNT: 10, DIAMOND_WEIGHT: 11, METAL_TYPE: 14, PRICE: 32,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRows(rows: any[][]): Omit<PreviewProduct, "duplicate">[] {
  const results: Omit<PreviewProduct, "duplicate">[] = [];
  for (const row of rows) {
    const status = String(row[COL.STATUS] || "").trim();
    if (status !== "ขาย") continue;
    const code = String(row[COL.CODE] || "").trim();
    if (!code) continue;

    const catTh = String(row[COL.CATEGORY] || "").trim();
    const colorTh = String(row[COL.METAL_COLOR] || "").trim();
    const typeTh = String(row[COL.METAL_TYPE] || "").trim();

    const category = CATEGORY_MAP[catTh] || "Rings";
    const metalColor = METAL_COLOR_MAP[colorTh] || colorTh;
    const metalType = METAL_TYPE_MAP[typeTh] || typeTh;

    const rawPrice = row[COL.PRICE];
    const price = typeof rawPrice === "number"
      ? rawPrice
      : parseFloat(String(rawPrice || "0").replace(/[^0-9.]/g, ""));
    if (!price || price <= 0) continue;

    // Auto name
    const name = [metalColor, metalType, "Diamond", category.replace(/s$/, "")]
      .filter(Boolean).join(" ");

    const specs: Record<string, string> = {};
    if (metalColor) specs["Metal Color"] = metalColor;
    if (metalType) specs["Metal"] = metalType;
    const dw = row[COL.DIAMOND_WEIGHT];
    if (dw) specs["Total Carat Weight"] = `${dw} ct`;
    const dc = row[COL.DIAMOND_COUNT];
    if (dc) specs["Number of Diamonds"] = String(dc);
    const ds = row[COL.DIAMOND_SIZE];
    if (ds) specs["Diamond Size"] = String(ds);
    const df = row[COL.DIAMOND_FACE];
    if (df) specs["Diamond Face"] = `${df} mm`;
    const sz = row[COL.SIZE];
    if (sz && catTh === "แหวน") specs["Ring Size"] = String(sz);
    const itemId = row[COL.ITEM_ID];
    if (itemId) specs["Item ID"] = String(itemId);

    results.push({ code, name, category, price, specifications: specs });
  }
  return results;
}

export default function ImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<PreviewProduct[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importedCount, setImportedCount] = useState(0);

  // ── Parse file in browser (no upload needed) ─────────────
  async function handleFile(file: File) {
    setLoading(true);
    setError("");
    try {
      // Dynamically import xlsx so it only loads client-side
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellFormula: false, cellHTML: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      const parsed = parseRows(rows.slice(1));

      // Check duplicates via API
      const existingRes = await fetch("/api/products");
      const existing = await existingRes.json();
      const existingItemIds = new Set(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existing.map((p: any) => p.specifications?.["Item ID"] || "").filter(Boolean)
      );

      const preview: PreviewProduct[] = parsed.map((p) => ({
        ...p,
        duplicate: existingItemIds.has(p.specifications["Item ID"] || "__"),
      }));

      setProducts(preview);
      const sel = new Set<number>();
      preview.forEach((p, i) => { if (!p.duplicate) sel.add(i); });
      setSelected(sel);
      setStep("preview");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "อ่านไฟล์ไม่ได้ ลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  // ── Send only clean JSON to server ───────────────────────
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
      setError(e instanceof Error ? e.message : "Import ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  const nonDupCount = products.filter((p) => !p.duplicate).length;

  function toggleAll() {
    if (selected.size === nonDupCount) {
      setSelected(new Set());
    } else {
      const sel = new Set<number>();
      products.forEach((p, i) => { if (!p.duplicate) sel.add(i); });
      setSelected(sel);
    }
  }

  const labelStyle = { color: "var(--muted)" };

  return (
    <div>
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
        อัปโหลดไฟล์ Stock Excel — ระบบ import เฉพาะรายการสถานะ <strong>ขาย</strong>
      </p>

      {/* ── UPLOAD ── */}
      {step === "upload" && (
        <div
          className="bg-white p-10 text-center"
          style={{ border: "2px dashed var(--border)" }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
        >
          <div className="text-4xl mb-4">📊</div>
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
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
          <p className="text-xs mt-4 font-sans" style={labelStyle}>
            รองรับ .xlsx และ .xls · ไฟล์ขนาดใหญ่ได้ (parse ใน browser)
          </p>
          {error && <p className="text-xs mt-3 font-sans" style={{ color: "#C0392B" }}>{error}</p>}
        </div>
      )}

      {/* ── PREVIEW ── */}
      {step === "preview" && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "รายการทั้งหมด", value: products.length },
              { label: "เลือก Import", value: selected.size },
              { label: "ข้าม (ซ้ำ)", value: products.length - nonDupCount },
            ].map((s) => (
              <div key={s.label} className="bg-white p-4 text-center" style={{ border: "1px solid var(--border)" }}>
                <p className="text-2xl font-light mb-1" style={{ color: "var(--charcoal)" }}>{s.value}</p>
                <p className="text-xs uppercase tracking-widest font-sans" style={labelStyle}>{s.label}</p>
              </div>
            ))}
          </div>

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

          <div className="bg-white overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "#FAF8F4" }}>
                  <th className="w-10 px-4 py-3"></th>
                  {["รหัส", "ชื่อสินค้า (Auto)", "หมวด", "โลหะ", "น้ำหนักเพชร", "ราคา", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs tracking-widest uppercase font-sans"
                      style={labelStyle}>{h}</th>
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
                      className="hover:bg-amber-50/20 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={isSelected} disabled={isDup}
                          onChange={() => {
                            const s = new Set(selected);
                            s.has(i) ? s.delete(i) : s.add(i);
                            setSelected(s);
                          }}
                          className="w-4 h-4 cursor-pointer"
                          style={{ accentColor: "var(--gold)" }} />
                      </td>
                      <td className="px-4 py-3 text-xs font-sans" style={labelStyle}>{p.code}</td>
                      <td className="px-4 py-3 text-xs font-sans" style={{ color: "var(--charcoal)", maxWidth: "200px" }}>
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
                      <td className="px-4 py-3 text-xs font-sans" style={labelStyle}>
                        {p.specifications["Total Carat Weight"] || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-sans font-light" style={{ color: "var(--gold)" }}>
                        {fmt(p.price)}
                      </td>
                      <td className="px-4 py-3">
                        {isDup && (
                          <span className="text-xs font-sans px-2 py-0.5"
                            style={{ backgroundColor: "#FEF3CD", color: "#856404" }}>ซ้ำ</span>
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

      {/* ── DONE ── */}
      {step === "done" && (
        <div className="bg-white p-16 text-center" style={{ border: "1px solid var(--border)" }}>
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl tracking-wider mb-2" style={{ color: "var(--charcoal)" }}>Import สำเร็จ!</h3>
          <p className="text-sm font-sans mb-8" style={labelStyle}>
            เพิ่มสินค้าเข้าระบบแล้ว <strong>{importedCount} รายการ</strong>
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => { setStep("upload"); setProducts([]); setSelected(new Set()); }}
              className="px-6 py-3 text-xs tracking-widest uppercase font-sans"
              style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
              Import เพิ่มเติม
            </button>
            <button onClick={() => { router.push("/admin"); router.refresh(); }}
              className="px-6 py-3 text-xs tracking-widest uppercase font-sans"
              style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}>
              ไปที่ Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
