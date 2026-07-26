"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReviewForm from "./ReviewForm";
import type { ReviewType } from "@/lib/reviews";

export default function WriteReviewPageClient({ type }: { type: ReviewType }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/settings/reviews")
      .then((r) => r.json())
      .then((d) => setEnabled(!!d.enabled))
      .catch(() => setEnabled(false));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "var(--ivory)" }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl tracking-[0.2em]" style={{ color: "var(--charcoal)" }}>SUPATIDA</h1>
            <p className="text-xs tracking-[0.3em] uppercase mt-1 font-sans" style={{ color: "var(--muted)" }}>
              Lab Grown Diamond Jewelry
            </p>
          </Link>
        </div>

        {enabled === null ? (
          <p className="text-center text-sm font-sans" style={{ color: "var(--muted)" }}>Loading…</p>
        ) : enabled ? (
          <ReviewForm type={type} />
        ) : (
          <div className="bg-white p-10 text-center" style={{ border: "1px solid var(--border)" }}>
            <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>
              ขณะนี้ยังไม่เปิดรับรีวิว ขออภัยในความไม่สะดวกค่ะ
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
