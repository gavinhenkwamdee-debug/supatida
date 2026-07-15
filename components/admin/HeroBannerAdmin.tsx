"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import type { HeroBannerConfig, HeroBannerSlide } from "@/lib/hero-banner-config";

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

export default function HeroBannerAdmin() {
  const [slides, setSlides] = useState<HeroBannerSlide[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings/hero-banner")
      .then((r) => r.json())
      .then((d) => { setSlides(d.slides || []); setEnabled(d.enabled !== false); setLoading(false); });
  }, []);

  async function saveConfig(newSlides: HeroBannerSlide[], newEnabled: boolean) {
    setSaving(true);
    await fetch("/api/settings/hero-banner", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slides: newSlides, enabled: newEnabled }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  function saveSlides(newSlides: HeroBannerSlide[]) {
    return saveConfig(newSlides, enabled);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const newSlides = [...slides];
    for (const file of files) {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);
      const res = await fetch("/api/upload-banner", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        newSlides.push({ imageUrl: data.url });
      }
    }
    setSlides(newSlides);
    await saveSlides(newSlides);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeSlide(i: number) {
    const updated = slides.filter((_, idx) => idx !== i);
    setSlides(updated);
    saveSlides(updated);
  }

  function moveSlide(i: number, dir: -1 | 1) {
    const updated = [...slides];
    const j = i + dir;
    if (j < 0 || j >= updated.length) return;
    [updated[i], updated[j]] = [updated[j], updated[i]];
    setSlides(updated);
    saveSlides(updated);
  }

  function updateLink(i: number, link: string) {
    const updated = [...slides];
    updated[i] = { ...updated[i], link: link || undefined };
    setSlides(updated);
  }

  if (loading) return (
    <div className="p-8 text-sm font-sans" style={{ color: "var(--muted)" }}>Loading…</div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl tracking-wider" style={{ color: "var(--charcoal)" }}>Hero Banner</h1>
          <p className="text-xs font-sans mt-1" style={{ color: "var(--muted)" }}>
            รูปภาพ Banner ขนาดใหญ่บน Homepage — สไลด์อัตโนมัติทุก 4 วินาที
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
            <p className="text-sm tracking-wide" style={{ color: "var(--charcoal)" }}>แสดง Hero Banner</p>
            <p className="text-xs font-sans mt-0.5" style={{ color: "var(--muted)" }}>
              เปิด/ปิดการแสดง Banner บน Homepage โดยไม่ต้องลบรูป
            </p>
          </div>
          <button
            onClick={() => { const next = !enabled; setEnabled(next); saveConfig(slides, next); }}
            disabled={saving}
            className="relative w-14 h-7 rounded-full transition-colors duration-200 disabled:opacity-50"
            style={{ backgroundColor: enabled ? "var(--gold)" : "#D1D5DB" }}
          >
            <span
              className="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
              style={{ left: enabled ? "30px" : "4px" }}
            />
          </button>
        </div>
      </div>

      {/* Upload */}
      <div className="bg-white p-6 mb-6" style={{ border: "1px solid var(--border)" }}>
        <h2 className="text-xs tracking-widest uppercase mb-4 font-sans" style={{ color: "var(--muted)" }}>
          เพิ่มรูปใหม่
        </h2>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full py-8 text-sm font-sans tracking-wide border-2 border-dashed transition-colors hover:opacity-80 disabled:opacity-50"
          style={{
            borderColor: "var(--border)",
            color: "var(--muted)",
            backgroundColor: "#FAF8F4",
          }}
        >
          {uploading ? "กำลัง upload…" : "+ คลิกเพื่อเลือกรูปภาพ (รองรับหลายรูปพร้อมกัน)"}
        </button>
        <p className="text-xs font-sans mt-2" style={{ color: "var(--muted)" }}>
          แนะนำขนาด 1920×700px ขึ้นไป · รองรับ JPG, PNG, WebP
        </p>
      </div>

      {/* Slides list */}
      {slides.length === 0 ? (
        <div className="bg-white p-12 text-center" style={{ border: "1px solid var(--border)" }}>
          <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>ยังไม่มีรูป Banner — เพิ่มรูปด้านบนได้เลย</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xs tracking-widest uppercase font-sans" style={{ color: "var(--muted)" }}>
            สไลด์ทั้งหมด ({slides.length})
          </h2>
          {slides.map((slide, i) => (
            <div key={i} className="bg-white p-4 flex gap-4 items-start" style={{ border: "1px solid var(--border)" }}>
              {/* Preview */}
              <div className="relative flex-shrink-0 overflow-hidden" style={{ width: 120, height: 50 }}>
                <Image src={slide.imageUrl} alt="" fill className="object-cover" sizes="120px" />
              </div>

              {/* Link input */}
              <div className="flex-1 min-w-0">
                <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>
                  Link (ไม่บังคับ)
                </label>
                <input
                  value={slide.link || ""}
                  onChange={(e) => updateLink(i, e.target.value)}
                  onBlur={() => saveSlides(slides)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 text-xs font-sans outline-none"
                  style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
                />
                <p className="text-xs font-mono mt-1 truncate" style={{ color: "var(--muted)", fontSize: "10px" }}>
                  {slide.imageUrl}
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                <div className="flex gap-1">
                  <button
                    onClick={() => moveSlide(i, -1)}
                    disabled={i === 0 || saving}
                    className="w-7 h-7 text-xs flex items-center justify-center disabled:opacity-30"
                    style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
                    title="เลื่อนขึ้น"
                  >↑</button>
                  <button
                    onClick={() => moveSlide(i, 1)}
                    disabled={i === slides.length - 1 || saving}
                    className="w-7 h-7 text-xs flex items-center justify-center disabled:opacity-30"
                    style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
                    title="เลื่อนลง"
                  >↓</button>
                </div>
                <button
                  onClick={() => removeSlide(i)}
                  className="w-full py-1 text-xs font-sans"
                  style={{ border: "1px solid #C0392B", color: "#C0392B" }}
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => saveConfig(slides, enabled)}
            disabled={saving}
            className="w-full py-3 text-xs tracking-widest uppercase font-sans mt-4 transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
          >
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
