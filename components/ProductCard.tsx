"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/db";

const DIAMOND_SVG = (
  <svg viewBox="0 0 80 80" className="w-24 h-24 opacity-20" fill="none">
    <polygon points="40,8 72,30 60,68 20,68 8,30" stroke="#C4A265" strokeWidth="1.5" fill="none" />
    <polygon points="40,8 72,30 40,40" stroke="#C4A265" strokeWidth="1" fill="none" />
    <polygon points="8,30 40,40 20,68" stroke="#C4A265" strokeWidth="1" fill="none" />
    <polygon points="72,30 60,68 40,40" stroke="#C4A265" strokeWidth="1" fill="none" />
  </svg>
);

const LINE_ICON = (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
  </svg>
);

export default function ProductCard({ product }: { product: Product }) {
  const images = product.images.filter(Boolean);
  const [imgIndex, setImgIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const specs = product.specifications;
  const displaySpecs = [
    { key: "Type", val: product.category },
    specs["Metal"] ? { key: "Metal", val: specs["Metal"] } : null,
    specs["Metal Color"] ? { key: "Metal Color", val: specs["Metal Color"] } : null,
    specs["Total Carat Weight"] ? { key: "Total Carat", val: specs["Total Carat Weight"] } : null,
  ].filter(Boolean) as { key: string; val: string }[];

  const priceFormatted = new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(product.price);

  const productUrl = `https://supatida.vercel.app/products/${product.id}`;
  const lineMessage = `สวัสดีครับ สอบถามข้อมูลสินค้าชิ้นนี้\n${product.name}\nราคา: ${priceFormatted}\n${productUrl}`;
  const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const lineUrl = isMobile
    ? `https://line.me/R/oaMessage/@supatida/?text=${encodeURIComponent(lineMessage)}`
    : `https://lin.ee/U9D2iyG`;

  return (
    <article
      className="group flex flex-col bg-white overflow-hidden transition-shadow duration-300 hover:shadow-xl"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Image — คลิกไปหน้าสินค้า */}
      <Link href={`/products/${product.id}`} className="block">
        <div
          className="relative w-full aspect-square overflow-hidden"
          style={{ backgroundColor: "var(--img-bg)" }}
        >
          {images.length > 0 && !imgError ? (
            <Image
              src={images[imgIndex]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {DIAMOND_SVG}
            </div>
          )}

          {/* Category badge — bottom right */}
          <span
            className="absolute bottom-3 right-3 text-xs px-2 py-1 tracking-widest uppercase font-sans"
            style={{ backgroundColor: "rgba(28,28,28,0.75)", color: "var(--gold-light)" }}
          >
            {product.category}
          </span>

          {/* Badge ribbon — diagonal top-left */}
          {product.badge && (() => {
            const cfg: Record<string, { label: string; bg: string }> = {
              "hot-item":   { label: "Hot Item",   bg: "#B8922A" },
              "best-deal":  { label: "Best Deal",  bg: "#2E7D32" },
              "super-sale": { label: "Super Sale", bg: "#C0392B" },
            };
            const c = cfg[product.badge];
            if (!c) return null;
            return (
              <div className="absolute top-0 left-0 overflow-hidden w-24 h-24 pointer-events-none">
                <div
                  className="absolute font-sans font-bold text-white text-center"
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    backgroundColor: c.bg,
                    width: "110px",
                    padding: "5px 0",
                    top: "18px",
                    left: "-28px",
                    transform: "rotate(-45deg)",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.25)",
                  }}
                >
                  {c.label}
                </div>
              </div>
            );
          })()}

          {/* Image dots */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setImgIndex(i); }}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ background: i === imgIndex ? "var(--gold)" : "rgba(255,255,255,0.6)" }}
                />
              ))}
            </div>
          )}

          {/* Sold Out overlay */}
          {product.soldOut && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
              <span className="text-2xl tracking-[0.2em] font-sans font-bold"
                style={{ color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                SOLD OUT
              </span>
            </div>
          )}

          {/* View detail overlay */}
          {!product.soldOut && (
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ backgroundColor: "rgba(28,28,28,0.35)" }}
            >
              <span className="text-xs tracking-widest uppercase font-sans px-4 py-2"
                style={{ backgroundColor: "white", color: "var(--charcoal)" }}>
                ดูรายละเอียด
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 sm:p-5">
        <Link href={`/products/${product.id}`}>
          <h2 className="text-xs sm:text-base tracking-wide mb-1 leading-snug hover:underline"
            style={{ color: "var(--charcoal)" }}>
            {product.name}
          </h2>
        </Link>

        {!product.soldOut && (
          <p className="text-sm sm:text-xl font-sans font-light tracking-wide mb-2 sm:mb-3" style={{ color: "var(--gold)" }}>
            {priceFormatted}
          </p>
        )}

        {displaySpecs.length > 0 && (
          <dl
            className="grid grid-cols-2 gap-x-2 gap-y-1 mb-3 pt-2 sm:pt-3 font-sans"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {displaySpecs.map(({ key, val }) => (
              <div key={key}>
                <dt className="text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>{key}</dt>
                <dd className="text-xs mt-0.5" style={{ color: "var(--charcoal)" }}>{val}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* LINE Button */}
        <a
          href={lineUrl}
          target="_blank"
          rel="noopener noreferrer"
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
