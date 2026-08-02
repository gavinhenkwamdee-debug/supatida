"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CustomRing } from "@/lib/customRings";

const THB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

export default function CustomRingsAdmin() {
  const [rings, setRings] = useState<CustomRing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/custom-rings").then((r) => r.json()).then((d) => { setRings(d); setLoading(false); });
  }, []);

  async function handleDelete(ring: CustomRing) {
    if (!confirm(`ลบ "${ring.name}"? ไม่สามารถกู้คืนได้`)) return;
    const res = await fetch(`/api/admin/custom-rings/${ring.id}`, { method: "DELETE" });
    if (res.ok) setRings((prev) => prev.filter((r) => r.id !== ring.id));
    else alert("ลบไม่สำเร็จ");
  }

  if (loading) return <div className="p-8 text-sm font-sans" style={{ color: "var(--muted)" }}>Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl tracking-wider" style={{ color: "var(--charcoal)" }}>Custom Rings</h1>
          <p className="text-xs font-sans mt-1" style={{ color: "var(--muted)" }}>
            แหวนที่ลูกค้าสามารถออกแบบเองได้ — หน้าแยกต่างหาก ไม่ปนกับสินค้าทั่วไป
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/admin" className="text-xs tracking-widest uppercase underline font-sans self-center" style={{ color: "var(--muted)" }}>
            ← Back
          </a>
          <Link href="/admin/custom-rings/new"
            className="px-5 py-2.5 text-xs tracking-widest uppercase transition-opacity hover:opacity-80 font-sans"
            style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}>
            + Add Ring
          </Link>
        </div>
      </div>

      {rings.length === 0 ? (
        <div className="bg-white p-12 text-center" style={{ border: "1px solid var(--border)" }}>
          <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>ยังไม่มีแหวนที่ปรับแต่งได้ — เพิ่มอันแรกได้เลย</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rings.map((ring) => (
            <div key={ring.id} className="bg-white p-4 flex items-center gap-4" style={{ border: "1px solid var(--border)" }}>
              <div className="relative flex-shrink-0 overflow-hidden" style={{ width: 64, height: 64, backgroundColor: "var(--img-bg)" }}>
                {ring.baseImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ring.baseImage} alt="" className="w-full h-full object-contain" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm tracking-wide" style={{ color: "var(--charcoal)" }}>{ring.name}</p>
                <p className="text-xs font-sans mt-0.5" style={{ color: "var(--muted)" }}>
                  {THB(ring.basePrice)} · {ring.enabled ? "เปิดใช้งาน" : "ปิดอยู่"}
                </p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Link href={`/custom-rings/${ring.id}`} target="_blank" className="text-xs tracking-wider uppercase underline" style={{ color: "var(--muted)" }}>View ↗</Link>
                <Link href={`/admin/custom-rings/${ring.id}/edit`} className="text-xs tracking-wider uppercase underline" style={{ color: "var(--gold-dark)" }}>Edit</Link>
                <button onClick={() => handleDelete(ring)} className="text-xs tracking-wider uppercase underline" style={{ color: "#C0392B" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
