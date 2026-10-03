"use client";

import { useState } from "react";
import Image from "next/image";
import type { SilverProduct } from "@/lib/silverJewelryTypes";

const LINE_ICON = (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

const fmt = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

export default function SilverProductCard({ product }: { product: SilverProduct }) {
  const images = product.images.filter(Boolean);
  const [imgError, setImgError] = useState(false);

  return (
    <article
      className="group flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1"
      style={{ backgroundColor: "#FFFFFF", border: "1px solid #D4D8DD" }}
    >
      <div className="relative w-full aspect-square overflow-hidden" style={{ backgroundColor: "#EEF0F3" }}>
        {images.length > 0 && !imgError ? (
          <Image
            src={images[0]}
            alt={product.name}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 80 80" className="w-16 h-16 opacity-25" fill="none">
              <circle cx="40" cy="40" r="28" stroke="#1B2A4A" strokeWidth="1.5" />
              <circle cx="40" cy="40" r="16" stroke="#1B2A4A" strokeWidth="1" />
            </svg>
          </div>
        )}

        {product.soldOut && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(16,24,40,0.55)" }}>
            <span className="text-xs tracking-[0.2em] uppercase font-sans font-bold" style={{ color: "white" }}>
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        <p className="text-xs tracking-wide mb-1" style={{ color: "#1B2A4A" }}>{product.name}</p>
        {(product.metal || product.size) && (
          <p className="text-[11px] font-sans mb-2" style={{ color: "#6B7686" }}>
            {[product.metal, product.size].filter(Boolean).join(" · ")}
          </p>
        )}
        {!product.soldOut && (
          <p className="text-sm font-sans font-light tracking-wide mb-3" style={{ color: "#1B2A4A" }}>
            {fmt(product.price)}
          </p>
        )}
        <a
          href="https://lin.ee/U9D2iyG"
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
