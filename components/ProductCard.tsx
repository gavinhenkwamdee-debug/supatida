"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/db";

const DIAMOND_SVG = (
  <svg viewBox="0 0 80 80" className="w-24 h-24 opacity-20" fill="none">
    <polygon
      points="40,8 72,30 60,68 20,68 8,30"
      stroke="#C4A265"
      strokeWidth="1.5"
      fill="none"
    />
    <polygon
      points="40,8 72,30 40,40"
      stroke="#C4A265"
      strokeWidth="1"
      fill="none"
    />
    <polygon
      points="8,30 40,40 20,68"
      stroke="#C4A265"
      strokeWidth="1"
      fill="none"
    />
    <polygon
      points="72,30 60,68 40,40"
      stroke="#C4A265"
      strokeWidth="1"
      fill="none"
    />
  </svg>
);

export default function ProductCard({ product }: { product: Product }) {
  const images = product.images.filter(Boolean);
  const [imgIndex, setImgIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const topSpecs = Object.entries(product.specifications).slice(0, 4);

  return (
    <article
      className="group flex flex-col bg-white overflow-hidden transition-shadow duration-300 hover:shadow-xl"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Image area */}
      <div
        className="relative w-full aspect-square overflow-hidden"
        style={{ backgroundColor: "#F5F2ED" }}
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
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
            {DIAMOND_SVG}
          </div>
        )}

        {/* Category badge */}
        <span
          className="absolute top-3 left-3 text-xs px-2 py-1 tracking-widest uppercase font-sans"
          style={{
            backgroundColor: "rgba(28,28,28,0.75)",
            color: "var(--gold-light)",
          }}
        >
          {product.category}
        </span>

        {/* Image thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIndex(i)}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  background: i === imgIndex ? "var(--gold)" : "rgba(255,255,255,0.6)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-5">
        <h2
          className="text-base tracking-wide mb-1 leading-snug"
          style={{ color: "var(--charcoal)" }}
        >
          {product.name}
        </h2>

        <p
          className="text-xl font-sans font-light tracking-wide mb-3"
          style={{ color: "var(--gold)" }}
        >
          {new Intl.NumberFormat("th-TH", {
            style: "currency",
            currency: "THB",
            maximumFractionDigits: 0,
          }).format(product.price)}
        </p>

        {topSpecs.length > 0 && (
          <dl
            className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-auto pt-3 font-sans"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {topSpecs.map(([key, val]) => (
              <div key={key}>
                <dt
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "var(--muted)" }}
                >
                  {key}
                </dt>
                <dd
                  className="text-xs mt-0.5"
                  style={{ color: "var(--charcoal)" }}
                >
                  {val}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <a
          href="https://lin.ee/U9D2iyG"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 py-2.5 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#06C755", color: "white" }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
          สนใจทักไลน์
        </a>
      </div>
    </article>
  );
}
