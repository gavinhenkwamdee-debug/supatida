"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ABOUT_PAGES, DEFAULT_ABOUT, type AboutConfig, type AboutPageSlug, type AboutSection } from "@/lib/about-config";

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 1600;
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

function ImageField({ image, onUploaded, onClear }: { image: string; onUploaded: (url: string) => void; onClear: () => void }) {
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);
      const res = await fetch("/api/upload-about", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onUploaded(data.url);
    } catch {
      alert("อัพโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>รูปภาพ</label>
      {image ? (
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0 overflow-hidden" style={{ width: 140, height: 105 }}>
            <Image src={image} alt="" fill className="object-cover" sizes="140px" />
          </div>
          <button type="button" onClick={onClear} className="text-xs font-sans underline" style={{ color: "#C0392B" }}>
            ลบรูป
          </button>
        </div>
      ) : (
        <label
          className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-sans cursor-pointer"
          style={{ border: "1px dashed var(--border)", color: "var(--muted)", backgroundColor: "#FAF8F4" }}
        >
          {uploading ? "กำลังอัพโหลด…" : "+ อัพโหลดรูป"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={handleChange} disabled={uploading} />
        </label>
      )}
    </div>
  );
}

const fieldClass = "w-full px-3 py-2 text-sm font-sans outline-none";
const fieldStyle = { border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" };
const labelClass = "text-xs font-sans block mb-1";
const labelStyle = { color: "var(--muted)" };

export default function AboutAdmin() {
  const [config, setConfig] = useState<AboutConfig>(DEFAULT_ABOUT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<AboutPageSlug>("owner");

  useEffect(() => {
    fetch("/api/settings/about")
      .then((r) => r.json())
      .then((d) => { setConfig(d); setLoading(false); });
  }, []);

  async function save(next?: AboutConfig) {
    setSaving(true);
    const res = await fetch("/api/settings/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next ?? config),
    });
    if (res.ok) {
      const data = await res.json();
      setConfig(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  function toggleEnabled() {
    const next = { ...config, enabled: !config.enabled };
    setConfig(next);
    save(next);
  }

  if (loading) return (
    <div className="p-8 text-sm font-sans" style={{ color: "var(--muted)" }}>Loading…</div>
  );

  const section = config[activeTab];

  // A computed key ([activeTab]) against a union-typed object doesn't let
  // TypeScript verify the write matches that branch's shape, even though it
  // always does by construction here — the cast documents that.
  function updateField(patch: Partial<AboutSection>) {
    setConfig((c) => ({ ...c, [activeTab]: { ...c[activeTab], ...patch } }) as AboutConfig);
  }

  // Image changes save immediately (like the enabled toggle) instead of
  // waiting for "Save Changes" — losing an upload because the admin didn't
  // notice it still needed a manual save is the worse failure mode here.
  function updateFieldAndSave(patch: Partial<AboutSection>) {
    const next = { ...config, [activeTab]: { ...config[activeTab], ...patch } } as AboutConfig;
    setConfig(next);
    save(next);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl tracking-wider" style={{ color: "var(--charcoal)" }}>About Us</h1>
          <p className="text-xs font-sans mt-1" style={{ color: "var(--muted)" }}>
            แก้ไขเนื้อหาหน้า About Us ที่ลูกค้าเห็นบนเว็บ
          </p>
        </div>
        <a href="/admin" className="text-xs tracking-widest uppercase underline font-sans" style={{ color: "var(--muted)" }}>
          ← Back
        </a>
      </div>

      {/* Show/hide toggle */}
      <div className="bg-white p-6 mb-6" style={{ border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm tracking-wide" style={{ color: "var(--charcoal)" }}>แสดงเมนู About Us</p>
            <p className="text-xs font-sans mt-0.5" style={{ color: "var(--muted)" }}>
              ปิดไว้ได้ระหว่างที่ยังแก้ไขเนื้อหาไม่เสร็จ — ลูกค้าจะยังไม่เห็นเมนูนี้บนเว็บ
              (แต่ยังเข้าหน้า About Us ได้ตรงๆ ผ่านลิงก์ ถ้ามีคนรู้ URL)
            </p>
          </div>
          <button
            onClick={toggleEnabled}
            disabled={saving}
            className="relative w-14 h-7 rounded-full transition-colors duration-200 disabled:opacity-50 flex-shrink-0"
            style={{ backgroundColor: config.enabled ? "var(--gold)" : "#D1D5DB" }}
          >
            <span
              className="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
              style={{ left: config.enabled ? "30px" : "4px" }}
            />
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {ABOUT_PAGES.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => setActiveTab(p.slug)}
            className="px-3 py-2 text-xs tracking-wide font-sans transition-colors"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: activeTab === p.slug ? "var(--charcoal)" : "white",
              color: activeTab === p.slug ? "var(--gold-light)" : "var(--charcoal)",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 mb-6 space-y-4" style={{ border: "1px solid var(--border)" }}>
        <div>
          <label className={labelClass} style={labelStyle}>หัวข้อ</label>
          <input
            className={fieldClass}
            style={fieldStyle}
            value={section.title}
            onChange={(e) => updateField({ title: e.target.value })}
          />
        </div>

        <div>
          <label className={labelClass} style={labelStyle}>เนื้อหา</label>
          <textarea
            className={fieldClass}
            style={{ ...fieldStyle, resize: "vertical", minHeight: "140px" }}
            value={section.body}
            onChange={(e) => updateField({ body: e.target.value })}
            placeholder="พิมพ์เนื้อหา — ขึ้นบรรทัดใหม่ได้ตามต้องการ"
          />
        </div>

        <ImageField
          image={section.image}
          onUploaded={(url) => updateFieldAndSave({ image: url })}
          onClear={() => updateFieldAndSave({ image: "" })}
        />

        {activeTab === "location" && (
          <>
            <div>
              <label className={labelClass} style={labelStyle}>ที่อยู่</label>
              <textarea
                className={fieldClass}
                style={{ ...fieldStyle, resize: "vertical", minHeight: "70px" }}
                value={config.location.address}
                onChange={(e) => setConfig((c) => ({ ...c, location: { ...c.location, address: e.target.value } }))}
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>เวลาทำการ</label>
              <textarea
                className={fieldClass}
                style={{ ...fieldStyle, resize: "vertical", minHeight: "50px" }}
                value={config.location.hours}
                onChange={(e) => setConfig((c) => ({ ...c, location: { ...c.location, hours: e.target.value } }))}
                placeholder="เช่น ทุกวัน 10:00 - 20:00"
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>ลิงก์แผนที่ (Google Maps Embed URL)</label>
              <input
                className={fieldClass}
                style={fieldStyle}
                value={config.location.mapEmbedUrl}
                onChange={(e) => setConfig((c) => ({ ...c, location: { ...c.location, mapEmbedUrl: e.target.value } }))}
                placeholder="https://www.google.com/maps/embed?..."
              />
              <p className="text-xs font-sans mt-1" style={{ color: "var(--muted)" }}>
                จาก Google Maps → Share → Embed a map → คัดลอกค่าใน src=&quot;...&quot;
              </p>
            </div>
          </>
        )}

        {activeTab === "appointment" && (
          <div>
            <label className={labelClass} style={labelStyle}>ลิงก์ LINE สำหรับนัดหมาย</label>
            <input
              className={fieldClass}
              style={fieldStyle}
              value={config.appointment.lineUrl}
              onChange={(e) => setConfig((c) => ({ ...c, appointment: { ...c.appointment, lineUrl: e.target.value } }))}
            />
          </div>
        )}
      </div>

      <button
        onClick={() => save()}
        disabled={saving}
        className="w-full py-3 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
      >
        {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
      </button>
    </div>
  );
}
