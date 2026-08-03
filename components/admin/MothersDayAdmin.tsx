"use client";

import { useEffect, useRef, useState } from "react";
import type { MothersDayConfig } from "@/lib/mothersday-config";

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

export default function MothersDayAdmin() {
  const [enabled, setEnabled] = useState(false);
  const [bannerImage, setBannerImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings/mothersday")
      .then((r) => r.json())
      .then((d: MothersDayConfig) => { setEnabled(d.enabled); setBannerImage(d.bannerImage); setLoading(false); });
  }, []);

  async function saveConfig(nextEnabled: boolean, nextBanner: string) {
    setSaving(true);
    await fetch("/api/settings/mothersday", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: nextEnabled, bannerImage: nextBanner }),
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
        await saveConfig(enabled, data.url);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (loading) return (
    <div className="p-8 text-sm font-sans" style={{ color: "var(--muted)" }}>Loading…</div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl tracking-wider" style={{ color: "var(--charcoal)" }}>Mother&apos;s Day Promotion</h1>
          <p className="text-xs font-sans mt-1" style={{ color: "var(--muted)" }}>
            แท็บโปรโมชั่นวันแม่ พร้อม Hero Banner และรายการสินค้าลด 12%
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
            <p className="text-sm tracking-wide" style={{ color: "var(--charcoal)" }}>แสดงแท็บวันแม่</p>
            <p className="text-xs font-sans mt-0.5" style={{ color: "var(--muted)" }}>
              เปิด/ปิดแท็บ + หน้าโปรโมชั่นวันแม่บนหน้าเว็บ
            </p>
          </div>
          <button
            onClick={() => { const next = !enabled; setEnabled(next); saveConfig(next, bannerImage); }}
            disabled={saving}
            className="relative w-14 h-7 rounded-full transition-colors duration-200 disabled:opacity-50"
            style={{ backgroundColor: enabled ? "#DB2777" : "#D1D5DB" }}
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
          Hero Banner วันแม่
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

      <div className="bg-white p-6" style={{ border: "1px solid var(--border)" }}>
        <p className="text-xs font-sans" style={{ color: "var(--muted)" }}>
          {saved ? "✓ บันทึกแล้ว" : "รายการสินค้าและส่วนลด 12% ถูกกำหนดไว้ในโค้ดสำหรับโปรโมชั่นนี้ (7–12 ส.ค. 2569) — ถ้าต้องการเปลี่ยนรายการสินค้า แจ้งได้เลยครับ"}
        </p>
      </div>
    </div>
  );
}
