"use client";

import { useEffect, useState } from "react";
import type { Customer, PointTransaction, CrmTier } from "@/lib/crm";

type CustomerRow = Customer & { tier: string };

export default function CrmAdmin() {
  const [tab, setTab] = useState<"customers" | "tiers">("customers");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl tracking-wider" style={{ color: "var(--charcoal)" }}>CRM / Points</h1>
          <p className="text-xs font-sans mt-1" style={{ color: "var(--muted)" }}>
            สมาชิก แต้มสะสม และระดับสิทธิพิเศษ
          </p>
        </div>
        <a href="/admin" className="text-xs tracking-widest uppercase underline font-sans" style={{ color: "var(--muted)" }}>
          ← Back
        </a>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab("customers")}
          className="px-4 py-2 text-xs tracking-widest uppercase font-sans"
          style={{
            backgroundColor: tab === "customers" ? "var(--charcoal)" : "white",
            color: tab === "customers" ? "var(--gold-light)" : "var(--charcoal)",
            border: "1px solid var(--border)",
          }}
        >
          สมาชิก
        </button>
        <button
          type="button"
          onClick={() => setTab("tiers")}
          className="px-4 py-2 text-xs tracking-widest uppercase font-sans"
          style={{
            backgroundColor: tab === "tiers" ? "var(--charcoal)" : "white",
            color: tab === "tiers" ? "var(--gold-light)" : "var(--charcoal)",
            border: "1px solid var(--border)",
          }}
        >
          ระดับสิทธิพิเศษ
        </button>
      </div>

      {tab === "customers" ? <CustomersTab /> : <TiersTab />}
    </div>
  );
}

function CustomersTab() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CustomerRow | null>(null);

  function load(q?: string) {
    fetch(`/api/admin/crm/customers${q ? `?search=${encodeURIComponent(q)}` : ""}`)
      .then((r) => r.json())
      .then((d) => setCustomers(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search);
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อหรือเบอร์โทร"
          className="flex-1 px-3 py-2 text-sm font-sans outline-none"
          style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
        />
        <button type="submit" className="px-4 py-2 text-xs tracking-widest uppercase font-sans" style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}>
          ค้นหา
        </button>
      </form>

      {loading ? (
        <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>Loading…</p>
      ) : customers.length === 0 ? (
        <div className="bg-white p-12 text-center" style={{ border: "1px solid var(--border)" }}>
          <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>ยังไม่มีสมาชิก</p>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="w-full bg-white p-4 flex items-center justify-between text-left hover:opacity-80 transition-opacity"
              style={{ border: "1px solid var(--border)" }}
            >
              <div>
                <p className="text-sm tracking-wide" style={{ color: "var(--charcoal)" }}>{c.name}</p>
                <p className="text-xs font-sans mt-0.5" style={{ color: "var(--muted)" }}>{c.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-sans" style={{ color: "var(--gold-dark)" }}>{c.tier}</p>
                <p className="text-xs font-sans mt-0.5" style={{ color: "var(--muted)" }}>{c.points.toLocaleString()} แต้ม</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <CustomerDetailModal
          customerId={selected.id}
          onClose={() => setSelected(null)}
          onUpdated={() => load(search)}
        />
      )}
    </div>
  );
}

function CustomerDetailModal({ customerId, onClose, onUpdated }: { customerId: number; onClose: () => void; onUpdated: () => void }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [tier, setTier] = useState<CrmTier | null>(null);
  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fetch(`/api/admin/crm/customers/${customerId}`)
      .then((r) => r.json())
      .then((d) => {
        setCustomer(d.customer);
        setTransactions(d.transactions);
        setTier(d.tier);
      });
  }

  useEffect(load, [customerId]);

  async function handleAddPoints(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const value = Number(points);
    if (!value) {
      setError("กรอกจำนวนแต้ม (ใส่ค่าติดลบเพื่อหักแต้ม)");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/crm/customers/${customerId}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: value, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      setPoints("");
      setNote("");
      load();
      onUpdated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="bg-white w-full max-w-md max-h-[85vh] overflow-y-auto" style={{ border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        {!customer ? (
          <p className="p-6 text-sm font-sans" style={{ color: "var(--muted)" }}>Loading…</p>
        ) : (
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg tracking-wide" style={{ color: "var(--charcoal)" }}>{customer.name}</h3>
                <p className="text-xs font-sans mt-0.5" style={{ color: "var(--muted)" }}>{customer.phone}</p>
              </div>
              <button onClick={onClose} className="text-sm" style={{ color: "var(--muted)" }}>✕</button>
            </div>

            <div className="flex items-center justify-between p-3 mb-5" style={{ backgroundColor: "#FAF8F4", border: "1px solid var(--border)" }}>
              <span className="text-xs font-sans" style={{ color: "var(--muted)" }}>ระดับ: <strong style={{ color: "var(--gold-dark)" }}>{tier?.name}</strong></span>
              <span className="text-sm font-sans" style={{ color: "var(--charcoal)" }}>{customer.points.toLocaleString()} แต้ม</span>
            </div>

            <form onSubmit={handleAddPoints} className="space-y-2 mb-6">
              <p className="text-xs tracking-widest uppercase font-sans" style={{ color: "var(--gold-dark)" }}>เพิ่ม / หักแต้ม</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="เช่น 200 หรือ -50"
                  className="w-32 px-2 py-1.5 text-xs font-sans outline-none"
                  style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
                />
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="หมายเหตุ เช่น ซื้อแหวน Ring Silver"
                  className="flex-1 px-2 py-1.5 text-xs font-sans outline-none"
                  style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
                />
              </div>
              {error && <p className="text-xs font-sans" style={{ color: "#C0392B" }}>{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-xs tracking-widest uppercase font-sans disabled:opacity-50"
                style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
              >
                {saving ? "กำลังบันทึก…" : "บันทึก"}
              </button>
            </form>

            <p className="text-xs tracking-widest uppercase font-sans mb-2" style={{ color: "var(--gold-dark)" }}>ประวัติแต้ม</p>
            {transactions.length === 0 ? (
              <p className="text-xs font-sans" style={{ color: "var(--muted)" }}>ยังไม่มีประวัติ</p>
            ) : (
              <div className="space-y-1.5">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-xs font-sans">
                    <span style={{ color: "var(--muted)" }}>
                      {new Date(t.createdAt).toLocaleDateString("th-TH")} {t.note && `· ${t.note}`}
                    </span>
                    <span style={{ color: t.points >= 0 ? "var(--gold-dark)" : "#C0392B" }}>
                      {t.points >= 0 ? "+" : ""}{t.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TiersTab() {
  const [tiers, setTiers] = useState<CrmTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/crm/tiers")
      .then((r) => r.json())
      .then((d) => setTiers(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  function updateTier(index: number, patch: Partial<CrmTier>) {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
    setSaved(false);
  }

  function addTier() {
    setTiers((prev) => [...prev, { name: "", minPoints: 0, discountPercent: 0, perks: [] }]);
  }

  function removeTier(index: number) {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/crm/tiers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tiers),
      });
      if (res.ok) setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>Loading…</p>;

  return (
    <div>
      <p className="text-xs font-sans mb-4" style={{ color: "var(--muted)" }}>
        กำหนดแต้มขั้นต่ำ ส่วนลด และสิทธิพิเศษของแต่ละระดับ (เรียงจากน้อยไปมาก)
      </p>
      <div className="space-y-3 mb-4">
        {tiers.map((tier, i) => (
          <div key={i} className="bg-white p-4" style={{ border: "1px solid var(--border)" }}>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>ชื่อระดับ</label>
                <input
                  value={tier.name}
                  onChange={(e) => updateTier(i, { name: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs font-sans outline-none"
                  style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
                />
              </div>
              <div>
                <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>แต้มขั้นต่ำ</label>
                <input
                  type="number"
                  value={tier.minPoints}
                  onChange={(e) => updateTier(i, { minPoints: Number(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 text-xs font-sans outline-none"
                  style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
                />
              </div>
              <div>
                <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>ส่วนลด (%)</label>
                <input
                  type="number"
                  value={tier.discountPercent}
                  onChange={(e) => updateTier(i, { discountPercent: Number(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 text-xs font-sans outline-none"
                  style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>สิทธิพิเศษอื่นๆ (คั่นด้วยเครื่องหมาย ,)</label>
              <input
                value={tier.perks.join(", ")}
                onChange={(e) => updateTier(i, { perks: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="เช่น ขัดแหวนฟรี, จัดส่งฟรี"
                className="w-full px-2 py-1.5 text-xs font-sans outline-none"
                style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
              />
            </div>
            <button
              type="button"
              onClick={() => removeTier(i)}
              className="mt-2 text-xs tracking-wider uppercase underline font-sans"
              style={{ color: "#C0392B" }}
            >
              ลบระดับ
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={addTier} className="text-xs tracking-wider uppercase underline font-sans" style={{ color: "var(--gold-dark)" }}>
          + เพิ่มระดับ
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
        >
          {saving ? "กำลังบันทึก…" : "บันทึก"}
        </button>
        {saved && <span className="text-xs font-sans" style={{ color: "var(--gold-dark)" }}>บันทึกแล้ว ✓</span>}
      </div>
    </div>
  );
}
