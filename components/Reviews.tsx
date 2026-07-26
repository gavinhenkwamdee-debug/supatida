"use client";

import { useEffect, useState } from "react";
import type { Review } from "@/lib/reviews";
import ReviewFormModal from "./ReviewFormModal";

function Stars({ rating }: { rating: number }) {
  return (
    <div aria-label={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= rating ? "var(--gold)" : "var(--border)" }}>
          {i <= rating ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "วันนี้";
  if (days === 1) return "เมื่อวาน";
  if (days < 30) return `${days} วันที่แล้ว`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} เดือนที่แล้ว`;
  return `${Math.floor(months / 12)} ปีที่แล้ว`;
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white p-5 flex flex-col gap-3" style={{ border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between">
        <Stars rating={review.rating} />
        <span className="text-xs font-sans" style={{ color: "var(--muted)" }}>
          {timeAgo(review.createdAt)}
        </span>
      </div>

      {review.imageUrl && (
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3", backgroundColor: "var(--img-bg)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={review.imageUrl} alt="Review" className="w-full h-full object-cover" />
        </div>
      )}

      <p className="text-sm font-sans leading-relaxed" style={{ color: "var(--charcoal)" }}>
        {review.text}
      </p>

      <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: "1px solid var(--border)" }}>
        <span className="text-sm tracking-wide" style={{ color: "var(--charcoal)" }}>{review.name}</span>
        {review.category && (
          <span className="text-xs px-2 py-1 tracking-wide font-sans"
            style={{ backgroundColor: "#F5F0E8", color: "var(--gold-dark)", border: "1px solid var(--border)" }}>
            {review.category}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Reviews() {
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/settings/reviews")
      .then((r) => r.json())
      .then((d) => {
        setEnabled(!!d.enabled);
        setLoaded(true);
        if (d.enabled) {
          fetch("/api/reviews")
            .then((r) => r.json())
            .then((list: Review[]) => setReviews(list))
            .catch(() => {});
        }
      })
      .catch(() => setLoaded(true));
  }, []);

  function handleSubmitted() {
    setModalOpen(false);
  }

  if (!loaded || !enabled) return null;

  return (
    <section id="reviews" className="max-w-6xl mx-auto px-4 py-16" style={{ scrollMarginTop: "180px" }}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl tracking-wider" style={{ color: "var(--charcoal)" }}>
          รีวิวจากลูกค้า
        </h2>
        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
        >
          + เขียนรีวิว
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white p-12 text-center" style={{ border: "1px solid var(--border)" }}>
          <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>
            ยังไม่มีรีวิว เป็นคนแรกที่รีวิวสิ!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}

      {modalOpen && (
        <ReviewFormModal onClose={() => setModalOpen(false)} onSubmitted={handleSubmitted} />
      )}
    </section>
  );
}
