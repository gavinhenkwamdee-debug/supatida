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
      </div>
    </article>
  );
}
