"use client";

import { useEffect, useMemo, useState } from "react";
import type { Review, ReviewStatus } from "@/lib/reviews";

const TABS: { label: string; value: ReviewStatus | "all" }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= rating ? "var(--gold)" : "var(--border)" }}>
          {i <= rating ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

function ReviewRow({
  review,
  onChanged,
  onDeleted,
}: {
  review: Review;
  onChanged: (r: Review) => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function setStatus(status: ReviewStatus) {
    setBusy(true);
    const res = await fetch(`/api/admin/reviews/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) onChanged(await res.json());
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm(`ลบรีวิวของ "${review.name}"? ไม่สามารถกู้คืนได้`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/reviews/${review.id}`, { method: "DELETE" });
    if (res.ok) onDeleted();
    setBusy(false);
  }

  return (
    <div className="bg-white p-4 flex gap-4" style={{ border: "1px solid var(--border)" }}>
      {review.imageUrl && (
        <div className="relative flex-shrink-0 overflow-hidden" style={{ width: 90, height: 90, backgroundColor: "var(--img-bg)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={review.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm tracking-wide" style={{ color: "var(--charcoal)" }}>{review.name}</span>
          <Stars rating={review.rating} />
          <span className="text-xs px-2 py-0.5 font-sans" style={{ backgroundColor: "#F5F0E8", color: "var(--gold-dark)", border: "1px solid var(--border)" }}>
            {review.type === "preorder" ? "ก่อนสั่งทำ" : "หลังซื้อสินค้า"}
          </span>
          {review.category && (
            <span className="text-xs px-2 py-0.5 font-sans" style={{ backgroundColor: "#F5F0E8", color: "var(--gold-dark)", border: "1px solid var(--border)" }}>
              {review.category}
            </span>
          )}
          <span
            className="text-xs px-2 py-0.5 font-sans rounded"
            style={{
              backgroundColor: review.status === "approved" ? "#2E7D32" : review.status === "rejected" ? "#C0392B" : "#B8922A",
              color: "white",
            }}
          >
            {review.status}
          </span>
        </div>
        <p className="text-sm font-sans leading-relaxed" style={{ color: "var(--charcoal)" }}>{review.text}</p>
        <p className="text-xs font-sans mt-1" style={{ color: "var(--muted)" }}>
          {new Date(review.createdAt).toLocaleString("th-TH")}
        </p>

        <div className="flex gap-3 mt-2">
          {review.status !== "approved" && (
            <button onClick={() => setStatus("approved")} disabled={busy}
              className="text-xs tracking-wider uppercase underline disabled:opacity-50" style={{ color: "#2E7D32" }}>
              Approve
            </button>
          )}
          {review.status !== "rejected" && (
            <button onClick={() => setStatus("rejected")} disabled={busy}
              className="text-xs tracking-wider uppercase underline disabled:opacity-50" style={{ color: "var(--muted)" }}>
              Reject
            </button>
          )}
          <button onClick={handleDelete} disabled={busy}
            className="text-xs tracking-wider uppercase underline disabled:opacity-50" style={{ color: "#C0392B" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsAdmin() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ReviewStatus | "all">("pending");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/reviews").then((r) => r.json()).then((d) => { setReviews(d); setLoading(false); });
    fetch("/api/settings/reviews").then((r) => r.json()).then((d) => setEnabled(!!d.enabled));
  }, []);

  async function toggleEnabled() {
    setSaving(true);
    const next = !enabled;
    await fetch("/api/settings/reviews", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: next }) });
    setEnabled(next);
    setSaving(false);
  }

  const filtered = useMemo(
    () => (tab === "all" ? reviews : reviews.filter((r) => r.status === tab)),
    [reviews, tab]
  );

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  if (loading) return <div className="p-8 text-sm font-sans" style={{ color: "var(--muted)" }}>Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl tracking-wider" style={{ color: "var(--charcoal)" }}>Reviews</h1>
          <p className="text-xs font-sans mt-1" style={{ color: "var(--muted)" }}>
            จัดการรีวิวจากลูกค้า — ต้อง Approve ก่อนถึงจะขึ้นหน้าเว็บ
          </p>
        </div>
        <a href="/admin" className="text-xs tracking-widest uppercase underline font-sans" style={{ color: "var(--muted)" }}>
          ← Back
        </a>
      </div>

      {/* Toggle */}
      <div className="bg-white p-6 mb-6 flex items-center justify-between" style={{ border: "1px solid var(--border)" }}>
        <div>
          <p className="text-sm tracking-wide" style={{ color: "var(--charcoal)" }}>แสดง Reviews Section</p>
          <p className="text-xs font-sans mt-0.5" style={{ color: "var(--muted)" }}>
            เปิด/ปิดการแสดง section รีวิวบน Homepage
          </p>
        </div>
        <button
          onClick={toggleEnabled}
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

      {/* Tabs */}
      <div className="flex mb-4" style={{ border: "1px solid var(--border)" }}>
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className="flex-1 py-2.5 text-xs tracking-wide font-sans transition-colors"
            style={{
              backgroundColor: tab === t.value ? "var(--charcoal)" : "white",
              color: tab === t.value ? "var(--gold-light)" : "var(--muted)",
            }}
          >
            {t.label}{t.value === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-12 text-center" style={{ border: "1px solid var(--border)" }}>
          <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>ไม่มีรีวิวในหมวดนี้</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <ReviewRow
              key={r.id}
              review={r}
              onChanged={(updated) => setReviews((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
              onDeleted={() => setReviews((prev) => prev.filter((x) => x.id !== r.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
