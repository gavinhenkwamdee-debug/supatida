"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SilverSectionConfig, SilverProduct, SilverTier } from "@/lib/silverJewelryTypes";
import { SILVER_TIERS } from "@/lib/silverJewelryTypes";
import SilverProductCard from "@/components/SilverProductCard";
import SilverJewelryPopup from "@/components/SilverJewelryPopup";

const TIER_ACCENT: Record<SilverTier, string> = {
  starter: "#8A93A3",
  elegance: "#3C4A66",
  luxury: "#1B2A4A",
};

export default function SilverJewelryPageClient({
  config,
  products,
}: {
  config: SilverSectionConfig;
  products: SilverProduct[];
}) {
  const banner = config.banner;

  const availableTiers = useMemo(
    () =>
      SILVER_TIERS.filter(
        (tier) => config.tiers[tier].enabled && products.some((p) => p.tier === tier)
      ),
    [config.tiers, products]
  );

  const [selectedTier, setSelectedTier] = useState<SilverTier | null>(null);
  const activeTier = selectedTier && availableTiers.includes(selectedTier) ? selectedTier : availableTiers[0];
  const activeProducts = activeTier ? products.filter((p) => p.tier === activeTier) : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#E7E9EC" }}>
      {/* Minimal standalone header — deliberately distinct from the main site */}
      <header className="px-6 py-5" style={{ backgroundColor: "#0F1626" }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm tracking-[0.3em] uppercase font-sans" style={{ color: "#E7E9EC" }}>
            SUPATIDA
          </Link>
          <span
            className="text-[11px] tracking-[0.35em] uppercase font-sans px-3 py-1"
            style={{ border: "1px solid #3C4A66", color: "#AEB6C4" }}
          >
            Premium Silver
          </span>
        </div>
      </header>

      {/* Banner */}
      {banner.enabled && banner.mediaUrl && (
        <BannerBlock banner={banner} />
      )}

      {/* Section intro */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-6 text-center">
        <p className="text-xs tracking-[0.4em] uppercase font-sans mb-3" style={{ color: "#6B7686" }}>
          Supatida Silver Collection
        </p>
        <h1 className="text-3xl sm:text-4xl tracking-wide" style={{ color: "#1B2A4A" }}>
          PREMIUM SILVER
        </h1>
        <p className="text-sm font-sans mt-3 max-w-xl mx-auto" style={{ color: "#5A6474" }}>
          เครื่องประดับเงินแท้ 925 สามระดับ ตั้งแต่ความเรียบง่ายไปจนถึงความหรูหราเหนือระดับ
        </p>
      </div>

      {/* Tier tabs */}
      {activeTier && (
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="flex items-center gap-2 mb-2 border-b" style={{ borderColor: "#D4D8DD" }}>
            {availableTiers.map((tier) => {
              const isActive = tier === activeTier;
              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className="px-5 py-3 text-xs tracking-[0.3em] uppercase font-sans transition-colors"
                  style={{
                    color: isActive ? TIER_ACCENT[tier] : "#9AA2AF",
                    borderBottom: isActive ? `2px solid ${TIER_ACCENT[tier]}` : "2px solid transparent",
                    marginBottom: -1,
                    fontWeight: isActive ? 700 : 400,
                  }}
                >
                  {config.tiers[tier].label}
                </button>
              );
            })}
          </div>
          {config.tiers[activeTier].tagline && (
            <p className="text-xs font-sans mt-4" style={{ color: "#6B7686" }}>
              {config.tiers[activeTier].tagline}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {activeProducts.map((p) => (
              <SilverProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <SilverJewelryPopup config={config.popup} />
    </div>
  );
}

function BannerBlock({ banner }: { banner: SilverSectionConfig["banner"] }) {
  const content =
    banner.mediaType === "video" ? (
      <video src={banner.mediaUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={banner.mediaUrl} alt="Premium Silver" className="w-full h-full object-cover" />
    );

  const inner = (
    <div className="relative w-full" style={{ aspectRatio: "21/9", backgroundColor: "#0F1626" }}>
      {content}
    </div>
  );

  if (banner.link) {
    return (
      <a href={banner.link} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }
  return inner;
}
