"use client";

import { useEffect, useState } from "react";
import type { BannerConfig } from "@/lib/settings";
import { DEFAULT_BANNER } from "@/lib/settings";

export default function BannerAdmin() {
  const [config, setConfig] = useState<BannerConfig>(DEFAULT_BANNER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newMsg, setNewMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings/banner").then((r) => r.json()).then((d) => {
      setConfig(d);
      setLoading(false);
    });
  }, []);

  async function save(patch: Partial<BannerConfig>) {
    setSaving(true);
    const updated = { ...config, ...patch };
    const res = await fetch("/api/settings/banner", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const data = await res.json();
      setConfig(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  function addMessage() {
    if (!newMsg.trim()) return;
    const msgs = [...config.messages, newMsg.trim()];
    setConfig((c) => ({ ...c, messages: msgs }));
    setNewMsg("");
  }

  function removeMessage(i: number) {
    const msgs = config.messages.filter((_, idx) => idx !== i);
    setConfig((c) => ({ ...c, messages: msgs }));
  }

  function updateMessage(i: number, val: string) {
    const msgs = [...config.messages];
    msgs[i] = val;
    setConfig((c) => ({ ...c, messages: msgs }));
  }

  if (loading) return (
    <div className="p-8 text-sm font-sans" style={{ color: "var(--muted)" }}>Loading…</div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl tracking-wider" style={{ color: "var(--charcoal)" }}>Sliding Banner</h1>
          <p className="text-xs font-sans mt-1" style={{ color: "var(--muted)" }}>
            จัดการ banner ที่โชว์ใต้แถบ navy บนหน้าเว็บ
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
            <p className="text-sm tracking-wide" style={{ color: "var(--charcoal)" }}>แสดง Banner</p>
            <p className="text-xs font-sans mt-0.5" style={{ color: "var(--muted)" }}>
              เปิด/ปิดการแสดง banner บนหน้าบ้าน
            </p>
          </div>
          <button
            onClick={() => save({ ...config, enabled: !config.enabled })}
            disabled={saving}
            className="relative w-14 h-7 rounded-full transition-colors duration-200 disabled:opacity-50"
            style={{ backgroundColor: config.enabled ? "var(--gold)" : "#D1D5DB" }}
          >
            <span
              className="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
              style={{ left: config.enabled ? "30px" : "4px" }}
            />
          </button>
        </div>

        {config.enabled && (
          <div className="mt-4 p-3 rounded text-xs font-sans text-center"
            style={{ backgroundColor: "var(--gold)", color: "white" }}>
            Preview: {config.messages[0] || "–"}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="bg-white p-6 mb-4" style={{ border: "1px solid var(--border)" }}>
        <h2 className="text-xs tracking-widest uppercase mb-4 font-sans" style={{ color: "var(--muted)" }}>
          ข้อความ ({config.messages.length} รายการ)
        </h2>

        <div className="space-y-2 mb-4">
          {config.messages.map((msg, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs w-5 text-right flex-shrink-0 font-sans" style={{ color: "var(--muted)" }}>
                {i + 1}.
              </span>
              <input
                value={msg}
                onChange={(e) => updateMessage(i, e.target.value)}
                className="flex-1 px-3 py-2 text-sm font-sans outline-none"
                style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
              />
              <button
                onClick={() => removeMessage(i)}
                className="text-xs px-2 py-2 font-sans flex-shrink-0"
                style={{ color: "#C0392B" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="flex gap-2">
          <input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMessage()}
            placeholder="เพิ่มข้อความใหม่…"
            className="flex-1 px-3 py-2 text-sm font-sans outline-none"
            style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
          />
          <button
            onClick={addMessage}
            className="px-4 py-2 text-xs tracking-widest uppercase font-sans"
            style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Speed */}
      <div className="bg-white p-6 mb-6" style={{ border: "1px solid var(--border)" }}>
        <label className="text-xs tracking-widest uppercase font-sans block mb-3" style={{ color: "var(--muted)" }}>
          ความเร็วสลับข้อความ: {config.speed} วินาที
        </label>
        <input
          type="range" min={2} max={10} step={1}
          value={config.speed}
          onChange={(e) => setConfig((c) => ({ ...c, speed: Number(e.target.value) }))}
          className="w-full"
          style={{ accentColor: "var(--gold)" }}
        />
        <div className="flex justify-between text-xs font-sans mt-1" style={{ color: "var(--muted)" }}>
          <span>เร็ว (2s)</span><span>ช้า (10s)</span>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={() => save(config)}
        disabled={saving}
        className="w-full py-3 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
      >
        {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
      </button>
    </div>
  );
}
