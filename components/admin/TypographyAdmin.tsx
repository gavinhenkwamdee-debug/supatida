"use client";

import { useState, useEffect } from "react";
import {
  DEFAULT_TYPOGRAPHY,
  FONT_LABELS,
  FONT_STACK,
  type TypographyConfig,
  type FontChoice,
} from "@/lib/typography-config";

const FONT_CHOICES = Object.keys(FONT_LABELS) as FontChoice[];

export default function TypographyAdmin() {
  const [config, setConfig] = useState<TypographyConfig>(DEFAULT_TYPOGRAPHY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/typography").then((r) => r.json()).then(setConfig).catch(() => {});
  }, []);

  async function save(updated: TypographyConfig) {
    setSaving(true);
    await fetch("/api/settings/typography", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function update(patch: Partial<TypographyConfig>) {
    setConfig((c) => ({ ...c, ...patch }));
  }

  const fieldClass = "w-full px-3 py-2 text-sm font-sans outline-none";
  const fieldStyle = { border: "1px solid var(--border)", color: "var(--charcoal)", backgroundColor: "white" };
  const labelClass = "block text-xs tracking-widest uppercase mb-1 font-sans";
  const labelStyle = { color: "var(--muted)" };

  return (
    <div className="max-w-xl space-y-6">
      <p className="text-xs font-sans" style={{ color: "var(--muted)" }}>
        เลือกฟอนต์แยกกันได้ 2 จุด — <strong>หัวข้อ</strong> ใช้กับชื่อแบรนด์/หัวข้อสินค้าทั้งเว็บ และ
        <strong> เนื้อหา</strong> ใช้กับป้าย/ข้อความทั่วไปทั้งเว็บ เปลี่ยนแล้วมีผลทันทีทุกหน้า
      </p>

      {/* Heading font */}
      <div>
        <label className={labelClass} style={labelStyle}>ฟอนต์หัวข้อ (Heading)</label>
        <select
          className={fieldClass}
          style={fieldStyle}
          value={config.headingFont}
          onChange={(e) => update({ headingFont: e.target.value as FontChoice })}
        >
          {FONT_CHOICES.map((f) => (
            <option key={f} value={f}>{FONT_LABELS[f]}</option>
          ))}
        </select>
        <div
          className="mt-3 p-4"
          style={{ border: "1px solid var(--border)", backgroundColor: "white", fontFamily: FONT_STACK[config.headingFont] }}
        >
          <p className="text-2xl tracking-[0.15em]" style={{ color: "var(--charcoal)" }}>SUPATIDA</p>
          <p className="text-lg mt-1" style={{ color: "var(--charcoal)" }}>White Gold 14K Solitaire Ring</p>
        </div>
      </div>

      {/* Body font */}
      <div>
        <label className={labelClass} style={labelStyle}>ฟอนต์เนื้อหา (Body)</label>
        <select
          className={fieldClass}
          style={fieldStyle}
          value={config.bodyFont}
          onChange={(e) => update({ bodyFont: e.target.value as FontChoice })}
        >
          {FONT_CHOICES.map((f) => (
            <option key={f} value={f}>{FONT_LABELS[f]}</option>
          ))}
        </select>
        <div
          className="mt-3 p-4 text-sm"
          style={{ border: "1px solid var(--border)", backgroundColor: "white", fontFamily: FONT_STACK[config.bodyFont], color: "var(--charcoal)" }}
        >
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "var(--muted)" }}>Ring Size</p>
          <p>เครื่องประดับเพชรแล็บกรอนคุณภาพสูง รับรองมาตรฐาน IGI ราคาสมเหตุสมผล</p>
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
