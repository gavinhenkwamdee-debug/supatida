"use client";

import { useEffect, useState, useRef } from "react";
import type { PopupConfig } from "@/lib/popup-config";

export default function PopupBanner({ page }: { page: "home" | "product" }) {
  const [config, setConfig] = useState<PopupConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    fetch("/api/settings/popup")
      .then((r) => r.json())
      .then((c: PopupConfig) => {
        if (!c.enabled) return;
        const matchPage =
          c.pages === "all" ||
          (c.pages === "home" && page === "home") ||
          (c.pages === "products" && page === "product");
        if (!matchPage) return;
        setConfig(c);
      })
      .catch(() => {});
  }, [page]);

  useEffect(() => {
    if (!config || triggered.current) return;

    if (config.triggerType === "delay") {
      const t = setTimeout(() => {
        triggered.current = true;
        setVisible(true);
      }, config.delaySeconds * 1000);
      return () => clearTimeout(t);
    }

    if (config.triggerType === "scroll") {
      function onScroll() {
        if (triggered.current) return;
        const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (scrolled >= config!.scrollPercent) {
          triggered.current = true;
          setVisible(true);
          window.removeEventListener("scroll", onScroll);
        }
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }
  }, [config]);

  if (!visible || !config) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && setVisible(false)}
    >
      <div
        className="relative bg-white overflow-hidden"
        style={{ maxWidth: Math.min(config.imageWidth + 40, 600), width: "100%" }}
      >
        {/* Close */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-sm"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "white" }}
        >
          ✕
        </button>

        {/* Image */}
        {config.imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={config.imageUrl}
            alt="Promotion"
            style={{
              width: "100%",
              height: config.imageHeight,
              objectFit: "cover",
              display: "block",
            }}
          />
        )}

        {/* Text + CTA */}
        {(config.text || config.ctaText) && (
          <div className="px-6 py-5 text-center">
            {config.text && (
              <p className="text-sm font-sans leading-relaxed mb-4" style={{ color: "var(--charcoal)" }}>
                {config.text}
              </p>
            )}
            {config.ctaText && config.ctaLink && (
              <a
                href={config.ctaLink}
                className="inline-block px-8 py-3 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
                style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
                onClick={() => setVisible(false)}
              >
                {config.ctaText}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
