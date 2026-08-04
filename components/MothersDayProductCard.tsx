"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/db";
import { getOriginalPrice, getDiscountPercent } from "@/lib/pricing";

const LINE_ICON = (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
  </svg>
);

export default function MothersDayProductCard({ product, promoPrice }: { product: Product; promoPrice: number }) {
  const fmt = (n: number) => new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);
  const firstImage = product.images.find(Boolean) || "";
  const originalPrice = getOriginalPrice(product.id, product.price);
  const originalDiscountPct = getDiscountPercent(product.id);

  function handleLineClick() {
    if ((window as any).fbq) {
      (window as any).fbq("trackCustom", "LineContact", { content_ids: [String(product.id)], content_name: product.name });
    }
    if ((window as any).gtag) {
      (window as any).gtag("event", "line_click", { item_id: String(product.id), item_name: product.name, item_category: product.category });
    }
    fetch(`/api/products/${product.id}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "line_click" }),
      keepalive: true,
    }).catch(() => {});
  }

  return (
    <article
      className="group flex flex-col bg-white overflow-hidden transition-shadow duration-300 hover:shadow-xl"
      style={{ border: "1px solid var(--border)" }}
    >
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative w-full aspect-square overflow-hidden" style={{ backgroundColor: "var(--img-bg)" }}>
          {firstImage && (
            <Image src={firstImage} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
          )}
          <span
            className="absolute bottom-2 right-2 px-1.5 py-0.5 tracking-wider uppercase font-sans"
            style={{ fontSize: "9px", backgroundColor: "rgba(28,28,28,0.65)", color: "var(--gold-light)" }}
          >
            {product.category}
          </span>
          <span
            className="absolute top-2 left-2 px-2 py-1 tracking-wider uppercase font-sans font-bold"
            style={{ fontSize: "10px", backgroundColor: "#0284C7", color: "white" }}
          >
            -12% Mother&apos;s Day
          </span>
          {product.soldOut && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
              <span className="text-xl tracking-[0.2em] font-sans font-bold"
                style={{ color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                SOLD OUT
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-3 sm:p-5">
        <Link href={`/products/${product.id}`}>
          <h2 className="text-xs sm:text-base tracking-wide mb-1 leading-snug hover:underline" style={{ color: "var(--charcoal)" }}>
            {product.name}
          </h2>
        </Link>

        {!product.soldOut && (
          <div className="mb-2 sm:mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-sans line-through" style={{ color: "var(--muted)" }}>{fmt(originalPrice)}</span>
              <span className="text-xs font-sans px-1.5 py-0.5 font-bold" style={{ backgroundColor: "#C0392B", color: "white", fontSize: "9px" }}>
                -{originalDiscountPct}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className="text-xs sm:text-sm font-sans line-through" style={{ color: "var(--muted)" }}>{fmt(product.price)}</span>
              <span className="text-xs font-sans px-1.5 py-0.5 font-bold" style={{ backgroundColor: "#0284C7", color: "white", fontSize: "9px" }}>
                -12%
              </span>
            </div>
            <p className="text-sm sm:text-xl font-sans font-light tracking-wide mt-1" style={{ color: "#0284C7" }}>{fmt(promoPrice)}</p>
          </div>
        )}

        <a
          href="https://lin.ee/U9D2iyG"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleLineClick}
          className="mt-auto flex items-center justify-center gap-2 py-2.5 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#06C755", color: "white" }}
        >
          {LINE_ICON}
          สอบถามข้อมูล
        </a>
      </div>
    </article>
  );
}
