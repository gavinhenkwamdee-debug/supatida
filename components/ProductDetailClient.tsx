"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import SlidingBanner from "./SlidingBanner";
import type { Product } from "@/lib/db";

const LINE_OA = "@supatida";

const DIAMOND_SVG = (
  <svg viewBox="0 0 80 80" className="w-20 h-20 opacity-20" fill="none">
    <polygon points="40,8 72,30 60,68 20,68 8,30" stroke="#C4A265" strokeWidth="1.5" fill="none" />
    <polygon points="40,8 72,30 40,40" stroke="#C4A265" strokeWidth="1" fill="none" />
    <polygon points="8,30 40,40 20,68" stroke="#C4A265" strokeWidth="1" fill="none" />
    <polygon points="72,30 60,68 40,40" stroke="#C4A265" strokeWidth="1" fill="none" />
  </svg>
);

function LineButton({ product }: { product: Product }) {
  const priceFormatted = new Intl.NumberFormat("th-TH", {
    style: "currency", currency: "THB", maximumFractionDigits: 0,
  }).format(product.price);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if ((window as any).fbq) {
      (window as any).fbq("track", "Contact", {
        content_ids: [String(product.id)],
        content_name: product.name,
      });
    }
    const productUrl = `https://www.supatidajewelry.com/products/${product.id}`;
    const message = `สอบถามข้อมูลสินค้าชิ้นนี้\n${product.name}\nราคา: ${priceFormatted}\n${productUrl}`;
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const encoded = encodeURIComponent(message);
    const url = isAndroid
      ? `https://line.me/R/oaMessage/${LINE_OA}?text=${encoded}`
      : (isIOS ? `https://line.me/ti/p/${LINE_OA}?text=${encoded}` : `https://lin.ee/U9D2iyG`);
    window.location.href = url;
  }

  return (
    <a
      href="#"
      onClick={handleClick}
      className="flex items-center justify-center gap-3 py-4 text-sm tracking-widest uppercase font-sans transition-opacity hover:opacity-80 w-full"
      style={{ backgroundColor: "#06C755", color: "white" }}
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
      </svg>
      สอบถามข้อมูลสินค้าชิ้นนี้
    </a>
  );
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const [activeImg, setActiveImg] = useState(0);
  const images = product.images.filter(Boolean);

  // Fire ViewContent once per product page
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "ViewContent", {
        content_ids: [String(product.id)],
        content_name: product.name,
        content_type: "product",
        value: product.price,
        currency: "THB",
      });
    }
  }, [product.id]);

  return (
    <div style={{ backgroundColor: "var(--ivory)" }} className="min-h-screen">
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border)" }} className="bg-white sticky top-0 z-40">
        <div style={{ backgroundColor: "#14274E", color: "var(--gold-light)" }}
          className="text-center py-2 text-xs tracking-widest uppercase font-sans">
          Since 2022 · 100% Lab Grown · IGI Certified Option
        </div>
        <SlidingBanner />
        <div className="text-center py-4">
          <Link href="/">
            <h1 className="text-2xl tracking-[0.2em]" style={{ color: "var(--charcoal)" }}>SUPATIDA</h1>
            <p className="text-xs tracking-[0.3em] uppercase mt-0.5 font-sans" style={{ color: "var(--muted)" }}>
              Lab Grown Diamond Jewelry
            </p>
          </Link>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-xs font-sans" style={{ color: "var(--muted)" }}>
          <Link href="/" className="hover:underline" style={{ color: "var(--gold)" }}>Collections</Link>
          <span>›</span>
          <Link href={`/?category=${product.category}`} className="hover:underline" style={{ color: "var(--gold)" }}>
            {product.category}
          </Link>
          <span>›</span>
          <span style={{ color: "var(--charcoal)" }}>{product.name}</span>
        </nav>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left — Images */}
          <div>
            <div className="relative w-full aspect-square overflow-hidden mb-3"
              style={{ backgroundColor: "var(--img-bg)", border: "1px solid var(--border)" }}>
              {images.length > 0 ? (
                <Image
                  src={images[activeImg]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  {DIAMOND_SVG}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className="relative aspect-square overflow-hidden transition-all"
                    style={{
                      border: i === activeImg ? "2px solid var(--gold)" : "1px solid var(--border)",
                      backgroundColor: "var(--img-bg)",
                    }}
                  >
                    <Image src={src} alt={`${i + 1}`} fill className="object-cover" sizes="100px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — Info */}
          <div className="flex flex-col">
            <span className="text-xs tracking-[0.3em] uppercase font-sans mb-2" style={{ color: "var(--gold)" }}>
              {product.category}
            </span>
            <h1 className="text-2xl leading-snug mb-4" style={{ color: "var(--charcoal)", letterSpacing: "0.05em" }}>
              {product.name}
            </h1>

            {!product.soldOut && (
              <p className="text-3xl font-sans font-light mb-4" style={{ color: "var(--gold)" }}>
                {new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(product.price)}
              </p>
            )}

            {product.soldOut && (
              <div className="mb-6 py-3 text-center tracking-[0.3em] text-lg font-sans font-bold"
                style={{ backgroundColor: "#C0392B", color: "white" }}>
                SOLD OUT
              </div>
            )}

            <div className="w-12 h-px mb-6" style={{ backgroundColor: "var(--gold)" }} />

            {product.description && (
              <p className="text-sm leading-relaxed mb-8 font-sans" style={{ color: "var(--muted)" }}>
                {product.description}
              </p>
            )}

            {Object.keys(product.specifications).length > 0 && (
              <div className="mb-8">
                <h2 className="text-xs tracking-[0.3em] uppercase mb-4 font-sans" style={{ color: "var(--charcoal)" }}>
                  Specifications
                </h2>
                <dl className="space-y-2">
                  {Object.entries(product.specifications).filter(([key]) =>
                    !["Product Code", "Diamond Size", "Ring Size"].includes(key)
                  ).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-2 font-sans"
                      style={{ borderBottom: "1px solid var(--border)" }}>
                      <dt className="text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>{key}</dt>
                      <dd className="text-xs font-medium" style={{ color: "var(--charcoal)" }}>{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="mt-auto">
              <LineButton product={product} />
              <p className="text-center text-xs mt-3 font-sans" style={{ color: "var(--muted)" }}>
                ทีมงานพร้อมให้คำปรึกษาทุกวัน 9:00 – 21:00 น.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}
        className="text-center py-8 mt-16 text-xs tracking-widest uppercase font-sans">
        © {new Date().getFullYear()} Supatida · Lab Grown Diamond Jewelry
      </footer>
    </div>
  );
}
