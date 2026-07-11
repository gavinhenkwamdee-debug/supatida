"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import Link from "next/link";

const CATEGORIES = ["All", "Rings", "Necklaces", "Earrings", "Bracelets", "Pendants"];

const PRICE_RANGES = [
  { label: "All Prices", min: "", max: "" },
  { label: "Below ฿10,000", min: "0", max: "10000" },
  { label: "฿10,000 – ฿30,000", min: "10000", max: "30000" },
  { label: "฿30,000 – ฿50,000", min: "30000", max: "50000" },
  { label: "฿50,000 – ฿100,000", min: "50000", max: "100000" },
  { label: "฿100,000+", min: "100000", max: "" },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") || "All";
  const activeMin = searchParams.get("minPrice") || "";
  const activeMax = searchParams.get("maxPrice") || "";

  const setParam = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const activePriceLabel = PRICE_RANGES.find(
    (r) => r.min === activeMin && r.max === activeMax
  )?.label || "All Prices";

  return (
    <header style={{ borderBottom: "1px solid var(--border)" }} className="bg-white sticky top-0 z-40">
      {/* Top bar */}
      <div
        style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
        className="text-center py-2 text-xs tracking-widest uppercase font-sans"
      >
        Ethically Created · IGI Certified · Free Shipping
      </div>

      {/* Brand */}
      <div className="text-center py-5">
        <Link href="/" className="block">
          <p
            className="text-xs tracking-[0.4em] uppercase mb-1 font-sans"
            style={{ color: "var(--gold)" }}
          >
            Est. 2024
          </p>
          <h1
            className="text-3xl tracking-[0.15em]"
            style={{ color: "var(--charcoal)", letterSpacing: "0.2em" }}
          >
            SUPATIDA
          </h1>
          <p
            className="text-xs tracking-[0.3em] uppercase mt-1 font-sans"
            style={{ color: "var(--muted)" }}
          >
            Lab Grown Diamond Jewelry
          </p>
        </Link>
      </div>

      {/* Category nav — horizontal scroll on mobile */}
      <nav
        style={{ borderTop: "1px solid var(--border)" }}
        className="flex gap-1 px-4 py-2 overflow-x-auto scrollbar-hide"
      >
        <div className="flex gap-1 mx-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setParam({ category: cat === "All" ? "" : cat })}
              className="px-3 py-2 text-xs tracking-widest uppercase transition-all font-sans whitespace-nowrap flex-shrink-0"
              style={{
                color: activeCategory === cat ? "var(--gold)" : "var(--muted)",
                borderBottom: activeCategory === cat ? "2px solid var(--gold)" : "2px solid transparent",
                background: "none",
                cursor: "pointer",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* Price filter — horizontal scroll on mobile */}
      <div
        style={{ borderTop: "1px solid var(--border)", backgroundColor: "#F9F7F3" }}
        className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide"
      >
        <span
          className="text-xs uppercase tracking-widest self-center font-sans flex-shrink-0"
          style={{ color: "var(--muted)" }}
        >
          Price:
        </span>
        {PRICE_RANGES.map((r) => {
          const isActive = activePriceLabel === r.label;
          return (
            <button
              key={r.label}
              onClick={() => setParam({ minPrice: r.min, maxPrice: r.max })}
              className="px-3 py-1 text-xs rounded-full transition-all font-sans whitespace-nowrap flex-shrink-0"
              style={{
                background: isActive ? "var(--charcoal)" : "white",
                color: isActive ? "var(--gold-light)" : "var(--muted)",
                border: "1px solid",
                borderColor: isActive ? "var(--charcoal)" : "var(--border)",
                cursor: "pointer",
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
