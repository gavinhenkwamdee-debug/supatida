"use client";

import { useState, useEffect, useRef } from "react";
import type { PopupConfig } from "@/lib/popup-config";
import { DEFAULT_POPUP } from "@/lib/popup-config";

export default function PopupAdmin() {
  const [config, setConfig] = useState<PopupConfig>(DEFAULT_POPUP);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings/popup").then(r => r.json()).then(setConfig).catch(() => {});
  }, []);

  async function save(updated: PopupConfig) {
    setSaving(true);
    await fetch("/api/settings/popup", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function update(patch: Partial<PopupConfig>) {
    setConfig(c => ({ ...c, ...patch }));
  }

  async function handleUpload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload-banner", { method: "POST", body: formData });
    const data = await res.json();
    if (data.url) update({ imageUrl: data.url });
    setUploading(false);
  }

  const fieldClass = "w-full px-3 py-2 text-sm font-sans outline-none";
  const fieldStyle = { border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" };
  const labelClass = "block text-xs tracking-widest uppercase mb-1 font-sans";
  const labelStyle = { color: "var(--muted)" };

  return (
    <div className="max-w-xl space-y-6">

      {/* Enable toggle */}
      <div className="flex items-center justify-between p-4 bg-white" style={{ border: "1px solid var(--border)" }}>
        <div>
          <p className="text-sm font-sans font-medium" style={{ color: "var(--charcoal)" }}>Popup Banner</p>
          <p className="text-xs font-sans mt-0.5" style={{ color: "var(--muted)" }}>เปิด/ปิด popup ทั้งหมด</p>
        </div>
        <button
          onClick={() => update({ enabled: !config.enabled })}
          className="px-4 py-2 text-xs tracking-widest uppercase font-sans transition-all"
          style={{
            backgroundColor: config.enabled ? "#14532D" : "#6B7280",
            color: "white",
          }}
        >
          {config.enabled ? "ON" : "OFF"}
        </button>
      </div>

      {/* Pages */}
      <div>
        <label className={labelClass} style={labelStyle}>แสดงหน้าไหน</label>
        <select
          className={fieldClass} style={fieldStyle}
          value={config.pages}
          onChange={e => update({ pages: e.target.value as PopupConfig["pages"] })}
        >
          <option value="all">ทุกหน้า</option>
          <option value="home">หน้าแรกเท่านั้น</option>
          <option value="products">หน้า product เท่านั้น</option>
        </select>
      </div>

      {/* Trigger */}
      <div>
        <label className={labelClass} style={labelStyle}>Trigger</label>
        <div className="flex gap-2 mb-3">
          {(["delay", "scroll"] as const).map(t => (
            <button
              key={t}
              onClick={() => update({ triggerType: t })}
              className="flex-1 py-2 text-xs tracking-wider uppercase font-sans transition-all"
              style={{
                border: "1px solid",
                borderColor: config.triggerType === t ? "var(--charcoal)" : "var(--border)",
                backgroundColor: config.triggerType === t ? "var(--charcoal)" : "white",
                color: config.triggerType === t ? "white" : "var(--muted)",
              }}
            >
              {t === "delay" ? "⏱ หน่วงเวลา" : "📜 scroll"}
            </button>
          ))}
        </div>

        {config.triggerType === "delay" && (
          <div className="flex items-center gap-3">
            <input
              type="number" min={0} max={300}
              className={fieldClass} style={{ ...fieldStyle, flex: 1 }}
              value={config.delaySeconds}
              onChange={e => update({ delaySeconds: Number(e.target.value) })}
            />
            <span className="text-sm font-sans flex-shrink-0" style={{ color: "var(--muted)" }}>วินาที</span>
          </div>
        )}

        {config.triggerType === "scroll" && (
          <div className="flex items-center gap-3">
            <input
              type="number" min={0} max={100}
              className={fieldClass} style={{ ...fieldStyle, flex: 1 }}
              value={config.scrollPercent}
              onChange={e => update({ scrollPercent: Number(e.target.value) })}
            />
            <span className="text-sm font-sans flex-shrink-0" style={{ color: "var(--muted)" }}>% ของหน้า</span>
          </div>
        )}
      </div>

      {/* Image */}
      <div>
        <label className={labelClass} style={labelStyle}>รูปภาพ</label>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs font-sans mb-1 block" style={{ color: "var(--muted)" }}>กว้าง (px)</label>
            <input type="number" min={100} max={1200}
              className={fieldClass} style={fieldStyle}
              value={config.imageWidth}
              onChange={e => update({ imageWidth: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-xs font-sans mb-1 block" style={{ color: "var(--muted)" }}>สูง (px)</label>
            <input type="number" min={100} max={1200}
              className={fieldClass} style={fieldStyle}
              value={config.imageHeight}
              onChange={e => update({ imageHeight: Number(e.target.value) })}
            />
          </div>
        </div>

        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />

        {config.imageUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.imageUrl} alt="popup" className="w-full object-cover" style={{ height: 180 }} />
            <button
              onClick={() => update({ imageUrl: "" })}
              className="absolute top-2 right-2 px-2 py-1 text-xs"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white" }}
            >
              ลบ
            </button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full py-8 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-70 disabled:opacity-40"
            style={{ border: "1px dashed var(--border)", color: "var(--muted)" }}
          >
            {uploading ? "กำลังอัพโหลด…" : "+ อัพโหลดรูป"}
          </button>
        )}
      </div>

      {/* Text */}
      <div>
        <label className={labelClass} style={labelStyle}>ข้อความ (ไม่บังคับ)</label>
        <textarea
          className={fieldClass} style={{ ...fieldStyle, resize: "vertical", minHeight: 80 }}
          value={config.text}
          onChange={e => update({ text: e.target.value })}
          placeholder="โปรโมชั่นพิเศษ! ลด 15% ทุกชิ้น..."
          rows={3}
        />
      </div>

      {/* CTA */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} style={labelStyle}>ปุ่ม CTA (ไม่บังคับ)</label>
          <input
            className={fieldClass} style={fieldStyle}
            value={config.ctaText}
            onChange={e => update({ ctaText: e.target.value })}
            placeholder="ดูโปรโมชั่น"
          />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Link</label>
          <input
            className={fieldClass} style={fieldStyle}
            value={config.ctaLink}
            onChange={e => update({ ctaLink: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Save */}
      <button
        onClick={() => save(config)}
        disabled={saving}
        className="w-full py-3 text-xs tracking-widest uppercase font-sans transition-opacity disabled:opacity-60"
        style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
      >
        {saved ? "✓ บันทึกแล้ว" : saving ? "กำลังบันทึก…" : "บันทึก"}
      </button>
    </div>
  );
}
