"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CustomRing, CustomRingDetail } from "@/lib/customRings";
import type { CustomRingsBannerConfig } from "@/lib/custom-rings-banner-config";

const THB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

async function compressBannerImage(file: File): Promise<File> {
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

// The banner photo behind "ออกแบบแหวนของคุณเอง" on /custom-rings — a single
// image, not a slideshow like the homepage Hero Banner, so its own small
// section here instead of a separate admin page.
function CustomRingsBannerAdmin() {
  const [imageUrl, setImageUrl] = useState("");
  const [hideOverlayText, setHideOverlayText] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/settings/custom-rings-banner")
      .then((r) => r.json())
      .then((d: CustomRingsBannerConfig) => {
        setImageUrl(d.imageUrl || "");
        setHideOverlayText(Boolean(d.hideOverlayText));
        setLoading(false);
      });
  }, []);

  async function save(next: { imageUrl: string; hideOverlayText: boolean }) {
    setImageUrl(next.imageUrl);
    setHideOverlayText(next.hideOverlayText);
    await fetch("/api/settings/custom-rings-banner", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressBannerImage(file);
      const formData = new FormData();
      formData.append("file", compressed);
      const res = await fetch("/api/upload-custom-ring", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) await save({ imageUrl: data.url, hideOverlayText });
      else alert(data.error || "อัพโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (loading) return null;

  return (
    <div className="bg-white p-6 mb-6" style={{ border: "1px solid var(--border)" }}>
      <h2 className="text-sm tracking-wide mb-1" style={{ color: "var(--charcoal)" }}>Banner หน้ารวมแหวน</h2>
      <p className="text-xs font-sans mb-4" style={{ color: "var(--muted)" }}>
        รูปภาพด้านบนสุดของหน้า &ldquo;ออกแบบแหวนของคุณเอง&rdquo; — ถ้าไม่ใส่รูปจะใช้พื้นหลังไล่สีทองแทน แนะนำรูปแนวกว้าง (เช่น 2100×900px)
      </p>

      {imageUrl ? (
        <div className="relative mb-3 overflow-hidden" style={{ aspectRatio: "21/9", backgroundColor: "var(--img-bg)", border: "1px solid var(--border)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ) : null}

      <div className="flex gap-3 mb-3">
        <label
          className="px-4 py-2.5 text-xs tracking-widest uppercase font-sans cursor-pointer transition-opacity hover:opacity-80"
          style={{ border: "1px solid var(--charcoal)", color: "var(--charcoal)" }}
        >
          {uploading ? "กำลังอัพโหลด…" : imageUrl ? "เปลี่ยนรูป" : "+ อัพโหลดรูป Banner"}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
        </label>
        {imageUrl && (
          <button
            type="button"
            onClick={() => save({ imageUrl: "", hideOverlayText })}
            className="px-4 py-2.5 text-xs tracking-widest uppercase font-sans"
            style={{ border: "1px solid #C0392B", color: "#C0392B" }}
          >
            ลบรูป
          </button>
        )}
      </div>

      <label className="flex items-start gap-2 text-xs font-sans cursor-pointer" style={{ color: "var(--charcoal)" }}>
        <input
          type="checkbox"
          checked={hideOverlayText}
          onChange={(e) => save({ imageUrl, hideOverlayText: e.target.checked })}
          className="mt-0.5"
        />
        <span>
          รูปนี้มีข้อความอยู่ในรูปแล้ว (ซ่อนหัวข้อ/คำโปรยที่เว็บเขียนทับให้อัตโนมัติ)
          <br />
          <span style={{ color: "var(--muted)" }}>ติ๊กถ้ารูป banner เป็นกราฟิกสำเร็จที่มีตัวหนังสือในภาพอยู่แล้ว ไม่งั้นข้อความจะทับกัน</span>
        </span>
      </label>
    </div>
  );
}

export default function CustomRingsAdmin() {
  const router = useRouter();
  const [rings, setRings] = useState<CustomRing[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/custom-rings").then((r) => r.json()).then((d) => { setRings(d); setLoading(false); });
  }, []);

  async function handleDelete(ring: CustomRing) {
    if (!confirm(`ลบ "${ring.name}"? ไม่สามารถกู้คืนได้`)) return;
    const res = await fetch(`/api/admin/custom-rings/${ring.id}`, { method: "DELETE" });
    if (res.ok) setRings((prev) => prev.filter((r) => r.id !== ring.id));
    else alert("ลบไม่สำเร็จ");
  }

  // Copies the whole ring — groups, choices, images, hand-tuned overlay/swatch
  // positions included. Unlike product photos, /api/upload-custom-ring never
  // deletes the file a slot previously pointed at when it's replaced, so two
  // rings sharing an image URL after duplicating is safe.
  async function handleDuplicate(ring: CustomRing) {
    setDuplicatingId(ring.id);
    try {
      const detailRes = await fetch(`/api/admin/custom-rings/${ring.id}`);
      if (!detailRes.ok) throw new Error();
      const detail: CustomRingDetail = await detailRes.json();

      const createRes = await fetch("/api/admin/custom-rings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${detail.name} (copy)`, basePrice: detail.basePrice }),
      });
      if (!createRes.ok) throw new Error();
      const created = await createRes.json();

      const putRes = await fetch(`/api/admin/custom-rings/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${detail.name} (copy)`,
          description: detail.description,
          basePrice: detail.basePrice,
          baseImage: detail.baseImage,
          enabled: detail.enabled,
          groups: detail.groups,
        }),
      });
      if (!putRes.ok) throw new Error();

      router.push(`/admin/custom-rings/${created.id}/edit`);
    } catch {
      alert("Duplicate ไม่สำเร็จ");
      setDuplicatingId(null);
    }
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

      <CustomRingsBannerAdmin />

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
                <button onClick={() => handleDuplicate(ring)} disabled={duplicatingId === ring.id} className="text-xs tracking-wider uppercase underline disabled:opacity-50" style={{ color: "var(--muted)" }}>
                  {duplicatingId === ring.id ? "Duplicating…" : "Duplicate"}
                </button>
                <button onClick={() => handleDelete(ring)} className="text-xs tracking-wider uppercase underline" style={{ color: "#C0392B" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
