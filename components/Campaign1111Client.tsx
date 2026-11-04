"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CAMPAIGN_TIER_KEYS,
  campaignPrice,
  fillPercent,
  type Campaign1111Config,
  type CampaignTierKey,
} from "@/lib/campaign-1111-config";

export interface CampaignProduct {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  code: string;
}

const PAGE_SIZE = 24;

const PRICE_RANGES = [
  { label: "ทุกราคา", min: 0, max: Infinity },
  { label: "< ฿10,000", min: 0, max: 10000 },
  { label: "฿10,000 – 30,000", min: 10000, max: 30000 },
  { label: "฿30,000 – 50,000", min: 30000, max: 50000 },
  { label: "฿50,000 – 100,000", min: 50000, max: 100000 },
  { label: "฿100,000+", min: 100000, max: Infinity },
];
const LINE_URL = "https://lin.ee/U9D2iyG";
const ACCENT = "#C0392B";

const fmt = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

type Tracker = { fbq?: (...args: unknown[]) => void; gtag?: (...args: unknown[]) => void };

function trackLine(products: CampaignProduct[], label: string) {
  const w = window as unknown as Tracker;
  w.fbq?.("trackCustom", "LineContact", {
    content_ids: products.map((p) => String(p.id)),
    content_name: label,
  });
  w.gtag?.("event", "line_click", { item_id: products.map((p) => p.id).join(","), item_name: label });
  for (const p of products) {
    fetch(`/api/products/${p.id}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "line_click" }),
      keepalive: true,
    }).catch(() => {});
  }
}

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

// Ticks every second on the client only — SSR has no "now" to render
// consistently, so it starts null and fills in after mount.
function Countdown({ endsAt }: { endsAt: string }) {
  const target = useMemo(() => new Date(endsAt).getTime(), [endsAt]);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!endsAt || Number.isNaN(target) || now === null) return null;

  const remaining = target - now;
  if (remaining <= 0) {
    return (
      <p className="text-center text-xs tracking-widest uppercase font-sans mb-6" style={{ color: ACCENT }}>
        แคมเปญสิ้นสุดแล้ว
      </p>
    );
  }

  const units = [
    { n: Math.floor(remaining / 86400000), label: "วัน" },
    { n: Math.floor((remaining % 86400000) / 3600000), label: "ชม." },
    { n: Math.floor((remaining % 3600000) / 60000), label: "นาที" },
    { n: Math.floor((remaining % 60000) / 1000), label: "วิ" },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
      <span className="text-xs font-sans tracking-widest uppercase" style={{ color: "var(--muted)" }}>เหลือเวลา</span>
      {units.map((u) => (
        <div
          key={u.label}
          className="flex flex-col items-center justify-center px-2.5 py-1.5"
          style={{ minWidth: 48, backgroundColor: "var(--charcoal)", color: "white" }}
        >
          <span className="text-lg sm:text-xl font-sans leading-none">{String(u.n).padStart(2, "0")}</span>
          <span className="text-[9px] tracking-wider uppercase font-sans mt-0.5" style={{ color: "var(--gold-light)" }}>{u.label}</span>
        </div>
      ))}
    </div>
  );
}

function Thumb({ src, size, alt }: { src: string; size: number; alt: string }) {
  return (
    <div className="relative flex-shrink-0 overflow-hidden" style={{ width: size, height: size, backgroundColor: "var(--img-bg)" }}>
      {src && <Image src={src} alt={alt} fill className="object-cover" sizes={`${size}px`} />}
    </div>
  );
}

function ProductCard({
  product,
  percent,
  mode,
  selected,
  onToggle,
}: {
  product: CampaignProduct;
  percent: number;
  mode: "buy" | "select";
  selected?: boolean;
  onToggle?: () => void;
}) {
  const sale = campaignPrice(product.price, percent);

  const image = (
    <div className="relative w-full aspect-square overflow-hidden" style={{ backgroundColor: "var(--img-bg)" }}>
      {product.image && (
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
      )}
      <span
        className="absolute top-2 left-2 px-1.5 py-0.5 font-sans font-bold text-white"
        style={{ fontSize: "10px", backgroundColor: ACCENT }}
      >
        -{percent}%
      </span>
      <span
        className="absolute top-2 right-2 px-1.5 py-0.5 font-sans text-white"
        style={{ fontSize: "9px", backgroundColor: "rgba(28,28,28,0.75)" }}
      >
        มีชิ้นเดียว
      </span>
      {selected && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(28,28,28,0.35)" }}>
          <span className="w-10 h-10 rounded-full flex items-center justify-center text-xl text-white" style={{ backgroundColor: "var(--charcoal)" }}>
            ✓
          </span>
        </div>
      )}
    </div>
  );

  const info = (
    <>
      <h3 className="text-xs sm:text-sm tracking-wide mb-1 leading-snug text-left" style={{ color: "var(--charcoal)" }}>
        {product.name}
      </h3>
      <div className="mb-2 text-left">
        <span className="text-xs font-sans line-through" style={{ color: "var(--muted)" }}>{fmt(product.price)}</span>
        <p className="text-base sm:text-xl font-sans tracking-wide" style={{ color: ACCENT }}>{fmt(sale)}</p>
      </div>
    </>
  );

  if (mode === "select") {
    return (
      <div
        className="flex flex-col bg-white overflow-hidden text-left transition-shadow hover:shadow-lg"
        style={{ border: selected ? "2px solid var(--charcoal)" : "1px solid var(--border)" }}
      >
        <Link href={`/products/${product.id}`} target="_blank" rel="noopener noreferrer" className="block">
          {image}
        </Link>
        <div className="flex flex-col flex-1 p-3 sm:p-4">
          {info}
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={selected}
            className="mt-auto py-2 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
            style={
              selected
                ? { backgroundColor: "var(--charcoal)", color: "white" }
                : { border: "1px solid var(--charcoal)", color: "var(--charcoal)", backgroundColor: "white" }
            }
          >
            {selected ? "✓ เลือกแล้ว" : "เลือกชิ้นนี้"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <article className="flex flex-col bg-white overflow-hidden transition-shadow hover:shadow-lg" style={{ border: "1px solid var(--border)" }}>
      <Link href={`/products/${product.id}`} className="block">{image}</Link>
      <div className="flex flex-col flex-1 p-3 sm:p-4">
        <Link href={`/products/${product.id}`} className="hover:underline">{info}</Link>
        <a
          href={LINE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackLine([product], product.name)}
          className="mt-auto flex items-center justify-center gap-2 py-2.5 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#06C755", color: "white" }}
        >
          <LineIcon />
          สอบถามข้อมูล
        </a>
      </div>
    </article>
  );
}

// Category chips + grid + "show more" — shared by every tab. Mix & Match uses
// it in "select" mode, the other two in "buy" mode.
function ProductBrowser({
  products,
  percent,
  mode,
  picked = [],
  onToggle,
}: {
  products: CampaignProduct[];
  percent: number;
  mode: "buy" | "select";
  picked?: number[];
  onToggle?: (p: CampaignProduct) => void;
}) {
  const [category, setCategory] = useState("All");
  const [priceIdx, setPriceIdx] = useState(0);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).filter(Boolean), [products]);
  const priceRange = PRICE_RANGES[priceIdx];
  const filtered = products
    .filter((p) => category === "All" || p.category === category)
    .filter((p) => p.price >= priceRange.min && p.price <= priceRange.max);

  if (products.length === 0) {
    return <p className="text-center text-sm font-sans py-12" style={{ color: "var(--muted)" }}>ยังไม่มีสินค้าในรายการนี้</p>;
  }

  return (
    <div>
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 pb-1">
          {["All", ...categories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { setCategory(c); setVisible(PAGE_SIZE); }}
              className="px-4 py-1.5 text-xs tracking-wider font-sans whitespace-nowrap flex-shrink-0 transition-colors"
              style={
                category === c
                  ? { backgroundColor: "var(--charcoal)", color: "var(--gold-light)", border: "1px solid var(--charcoal)" }
                  : { backgroundColor: "white", color: "var(--muted)", border: "1px solid var(--border)" }
              }
            >
              {c === "All" ? "ทั้งหมด" : c}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mb-5 pb-1">
        <span className="text-xs tracking-wider font-sans whitespace-nowrap flex-shrink-0" style={{ color: "var(--muted)" }}>
          ราคา:
        </span>
        {PRICE_RANGES.map((r, i) => (
          <button
            key={r.label}
            type="button"
            onClick={() => { setPriceIdx(i); setVisible(PAGE_SIZE); }}
            className="px-3 py-1 text-xs rounded-full font-sans whitespace-nowrap flex-shrink-0 transition-colors"
            style={
              priceIdx === i
                ? { backgroundColor: "var(--charcoal)", color: "var(--gold-light)", border: "1px solid var(--charcoal)" }
                : { backgroundColor: "white", color: "var(--muted)", border: "1px solid var(--border)" }
            }
          >
            {r.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm font-sans py-12" style={{ color: "var(--muted)" }}>ไม่พบสินค้าในช่วงราคานี้</p>
      ) : (
      <>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
        {filtered.slice(0, visible).map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            percent={percent}
            mode={mode}
            selected={picked.includes(p.id)}
            onToggle={() => onToggle?.(p)}
          />
        ))}
      </div>

      {filtered.length > visible && (
        <div className="text-center mt-8">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="px-8 py-3 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
            style={{ border: "1px solid var(--charcoal)", color: "var(--charcoal)" }}
          >
            ดูเพิ่มเติม ({filtered.length - visible})
          </button>
        </div>
      )}
      </>
      )}
    </div>
  );
}

// The estimate is rounded on the PAIR TOTAL, not per piece — rounding each
// item up first and then adding would overshoot by up to 200 baht.
function pairEstimate(items: CampaignProduct[], percent: number) {
  const subtotal = items.reduce((sum, p) => sum + p.price, 0);
  const total = campaignPrice(subtotal, percent);
  return { subtotal, total, saved: subtotal - total };
}

function MixMatch({ products, percent }: { products: CampaignProduct[]; percent: number }) {
  const [picked, setPicked] = useState<CampaignProduct[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [stamp, setStamp] = useState("");

  function toggle(p: CampaignProduct) {
    setPicked((prev) => {
      if (prev.some((x) => x.id === p.id)) return prev.filter((x) => x.id !== p.id);
      if (prev.length >= 2) return prev;
      return [...prev, p];
    });
  }

  function openSummary() {
    setStamp(new Date().toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }));
    setShowSummary(true);
  }

  const full = picked.length === 2;
  const est = pairEstimate(picked, percent);

  if (products.length < 2) {
    return <p className="text-center text-sm font-sans py-12" style={{ color: "var(--muted)" }}>ยังมีสินค้าในรายการนี้ไม่ครบ 2 ชิ้น</p>;
  }

  return (
    <div>
      {/* Selection panel — sticks to the top while the grid scrolls under it.
          It's in normal flow (not position:fixed at the bottom) so the two
          picks and the estimated price can't end up off-screen. */}
      <div
        className="sticky top-0 z-30 bg-white mb-5 p-3 sm:p-4"
        style={{ border: "1px solid var(--charcoal)", boxShadow: "0 6px 16px rgba(0,0,0,0.08)" }}
      >
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[0, 1].map((i) => {
            const p = picked[i];
            return p ? (
              <div key={i} className="flex items-center gap-2 p-1.5 min-w-0" style={{ border: "1px solid var(--border)" }}>
                <Thumb src={p.image} size={44} alt={p.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] leading-tight truncate" style={{ color: "var(--charcoal)" }}>{p.name}</p>
                  <p className="text-[11px] font-sans" style={{ color: "var(--muted)" }}>{fmt(p.price)}</p>
                </div>
                <button
                  type="button"
                  aria-label={`เอา ${p.name} ออก`}
                  onClick={() => toggle(p)}
                  className="w-6 h-6 rounded-full text-[10px] flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: "var(--charcoal)" }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                key={i}
                className="flex items-center justify-center text-xs font-sans"
                style={{ height: 55, border: "1px dashed var(--border)", color: "var(--muted)" }}
              >
                ชิ้นที่ {i + 1}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {full ? (
              <>
                <p className="text-[11px] font-sans" style={{ color: "var(--muted)" }}>
                  <span className="line-through">{fmt(est.subtotal)}</span> · ราคาหลังลด ~{percent}%
                </p>
                <p className="text-2xl font-sans leading-tight" style={{ color: ACCENT }}>{fmt(est.total)}</p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-sans" style={{ color: "var(--muted)" }}>ราคาหลังลด ~{percent}%</p>
                <p className="text-sm font-sans" style={{ color: "var(--charcoal)" }}>เลือกอีก {2 - picked.length} ชิ้นเพื่อดูราคา</p>
              </>
            )}
          </div>
          <button
            type="button"
            disabled={!full}
            onClick={openSummary}
            className="px-5 py-3 text-xs tracking-widest uppercase font-sans transition-opacity disabled:opacity-40 flex-shrink-0"
            style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
          >
            ดูสรุป
          </button>
        </div>
      </div>

      <ProductBrowser products={products} percent={percent} mode="select" picked={picked.map((p) => p.id)} onToggle={toggle} />

      {showSummary && full && (
        <SummarySheet items={picked} percent={percent} stamp={stamp} onClose={() => setShowSummary(false)} />
      )}
    </div>
  );
}

// Opaque full-screen sheet so a phone screenshot contains only the summary.
function SummarySheet({
  items,
  percent,
  stamp,
  onClose,
}: {
  items: CampaignProduct[];
  percent: number;
  stamp: string;
  onClose: () => void;
}) {
  const est = pairEstimate(items, percent);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: "var(--ivory)" }}>
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white p-5" style={{ border: "1px solid var(--border)" }}>
          <div className="text-center pb-4 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="text-sm tracking-[0.25em]" style={{ color: "var(--charcoal)" }}>SUPATIDA</p>
            <p className="text-xs tracking-[0.3em] uppercase font-sans mt-1" style={{ color: ACCENT }}>11.11 · Mix &amp; Match</p>
            <p className="text-[11px] font-sans mt-1" style={{ color: "var(--muted)" }}>{stamp}</p>
          </div>

          <div className="space-y-4 mb-5">
            {items.map((p, i) => (
              <div key={p.id} className="flex gap-3">
                <Thumb src={p.image} size={72} alt={p.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-sans tracking-wider" style={{ color: "var(--muted)" }}>ชิ้นที่ {i + 1}</p>
                  <p className="text-sm leading-snug" style={{ color: "var(--charcoal)" }}>{p.name}</p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: "var(--muted)" }}>
                    {p.code || `#${p.id}`} · {fmt(p.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4 text-sm font-sans" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex justify-between" style={{ color: "var(--muted)" }}>
              <span>ราคารวมปกติ</span>
              <span>{fmt(est.subtotal)}</span>
            </div>
            <div className="flex justify-between items-end pt-1" style={{ color: "var(--charcoal)" }}>
              <span>ราคาหลังลด ~{percent}%</span>
              <span className="text-2xl" style={{ color: ACCENT }}>{fmt(est.total)}</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: "#2E7D32" }}>
              <span>ประหยัด</span>
              <span>{fmt(est.saved)}</span>
            </div>
          </div>

          <p className="text-[11px] font-sans mt-4 leading-relaxed" style={{ color: "var(--muted)" }}>
            * แคมเปญ 11.11 ชำระเงินผ่านการโอนชำระเท่านั้น
          </p>
        </div>

        <p className="text-center text-xs font-sans mt-4" style={{ color: "var(--charcoal)" }}>
          📸 แคปหน้าจอนี้ แล้วส่งให้แอดมินทาง LINE ได้เลยค่ะ
        </p>

        <a
          href={LINE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackLine(items, `Mix & Match: ${items.map((p) => p.name).join(" + ")}`)}
          className="mt-4 flex items-center justify-center gap-2 py-3 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#06C755", color: "white" }}
        >
          <LineIcon />
          เปิด LINE ส่งให้แอดมิน
        </a>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-3 text-xs tracking-widest uppercase font-sans"
          style={{ border: "1px solid var(--border)", color: "var(--muted)", backgroundColor: "white" }}
        >
          กลับไปแก้ไขการเลือก
        </button>
      </div>
    </div>
  );
}

export default function Campaign1111Client({
  config,
  productsByTier,
  initialTab,
  isAdminPreview = false,
}: {
  config: Campaign1111Config;
  productsByTier: Record<CampaignTierKey, CampaignProduct[]>;
  initialTab: CampaignTierKey;
  isAdminPreview?: boolean;
}) {
  const [tab, setTab] = useState<CampaignTierKey>(initialTab);

  function selectTab(key: CampaignTierKey) {
    setTab(key);
    window.history.replaceState(null, "", `?tab=${key}`);
  }

  const tier = config.tiers[tab];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--ivory)" }}>
      {isAdminPreview && (
        <div className="sticky top-0 z-50 text-center py-2 px-4 text-xs tracking-widest uppercase font-sans font-bold"
          style={{ backgroundColor: "#C0392B", color: "white" }}>
          🔒 พรีวิวสำหรับแอดมิน — ลูกค้ายังมองไม่เห็นหน้านี้ (แคมเปญยังปิดอยู่)
        </div>
      )}

      <div className="text-center py-5" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "white" }}>
        <Link href="/" className="inline-block">
          <h1 className="text-2xl tracking-[0.2em]" style={{ color: "var(--charcoal)" }}>SUPATIDA</h1>
          <p className="text-xs tracking-[0.3em] uppercase mt-1 font-sans" style={{ color: "var(--muted)" }}>Lab Grown Diamond Jewelry</p>
        </Link>
      </div>

      {!config.enabled && !isAdminPreview ? (
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>โปรโมชั่นนี้ปิดใช้งานชั่วคราว</p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-8">
          {config.bannerImage && (
            <div className="relative w-full mb-8 overflow-hidden" style={{ aspectRatio: "3/1", backgroundColor: "var(--img-bg)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.bannerImage} alt="11.11" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="text-center mb-8">
            <p className="text-xs tracking-[0.4em] uppercase font-sans mb-1" style={{ color: ACCENT }}>Campaign</p>
            <h2 className="text-5xl sm:text-6xl tracking-wider" style={{ color: "var(--charcoal)" }}>11.11</h2>
          </div>

          <Countdown endsAt={config.endsAt} />

          {config.urgencyNote && (
            <p className="text-center text-xs sm:text-sm font-sans mb-8 max-w-lg mx-auto" style={{ color: ACCENT }}>
              ⚠️ {config.urgencyNote}
            </p>
          )}

          <div role="tablist" className="grid grid-cols-3 gap-2 sm:gap-3 mb-8 max-w-3xl mx-auto">
            {CAMPAIGN_TIER_KEYS.map((key) => {
              const t = config.tiers[key];
              const active = key === tab;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => selectTab(key)}
                  className="flex flex-col items-center justify-center py-3 px-1 transition-colors"
                  style={
                    active
                      ? { backgroundColor: "var(--charcoal)", color: "var(--gold-light)", border: "1px solid var(--charcoal)" }
                      : { backgroundColor: "white", color: "var(--charcoal)", border: "1px solid var(--border)" }
                  }
                >
                  <span className="text-2xl sm:text-3xl font-sans font-light leading-none">{t.percent}%</span>
                  <span className="text-[10px] sm:text-xs tracking-wider uppercase font-sans mt-1.5 leading-tight text-center">{t.name}</span>
                </button>
              );
            })}
          </div>

          <div className="text-center mb-8 max-w-xl mx-auto">
            <h3 className="text-lg sm:text-xl" style={{ color: "var(--charcoal)" }}>
              {fillPercent(tier.headline, tier.percent)}
            </h3>
            <p className="text-sm font-sans mt-2" style={{ color: "var(--muted)" }}>
              {fillPercent(tier.description, tier.percent)}
            </p>
            <div className="mx-auto mt-4 w-16 h-px" style={{ backgroundColor: ACCENT }} />
          </div>

          {/* Mix & Match stays mounted (just hidden) so a customer's two picks
              survive a peek at the other tabs; the buy-mode tabs remount so
              each starts on its own first page / category. */}
          <div hidden={tab !== "mixmatch"}>
            <MixMatch products={productsByTier.mixmatch} percent={config.tiers.mixmatch.percent} />
          </div>
          {tab !== "mixmatch" && (
            <ProductBrowser key={tab} products={productsByTier[tab]} percent={tier.percent} mode="buy" />
          )}
        </div>
      )}
    </div>
  );
}
