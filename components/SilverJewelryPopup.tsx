"use client";

import { useEffect, useState, useRef } from "react";
import type { SilverPopupConfig } from "@/lib/silverJewelryTypes";

export default function SilverJewelryPopup({ config }: { config: SilverPopupConfig }) {
  const [visible, setVisible] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    if (!config.enabled || triggered.current) return;

    if (config.triggerType === "delay") {
      const t = setTimeout(() => {
        triggered.current = true;
        setVisible(true);
      }, config.delaySeconds * 1000);
      return () => clearTimeout(t);
    }

    function onScroll() {
      if (triggered.current) return;
      const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrolled >= config.scrollPercent) {
        triggered.current = true;
        setVisible(true);
        window.removeEventListener("scroll", onScroll);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [config]);

  if (!visible || !config.enabled) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10,16,30,0.75)" }}
      onClick={(e) => e.target === e.currentTarget && setVisible(false)}
    >
      <div
        className="relative overflow-hidden"
        style={{ maxWidth: 520, width: "100%", backgroundColor: "#F3F4F6", border: "1px solid #1B2A4A" }}
      >
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-sm"
          style={{ backgroundColor: "rgba(10,16,30,0.7)", color: "white" }}
        >
          ✕
        </button>

        {config.mediaUrl && (
          <div className="w-full" style={{ backgroundColor: "#0A101E", aspectRatio: "16/10" }}>
            {config.mediaType === "video" ? (
              <video src={config.mediaUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.mediaUrl} alt={config.heading || "Premium Silver"} className="w-full h-full object-cover" />
            )}
          </div>
        )}

        {(config.heading || config.text || config.ctaText) && (
          <div className="px-6 py-6 text-center">
            {config.heading && (
              <p className="text-sm tracking-[0.2em] uppercase font-sans mb-2" style={{ color: "#1B2A4A" }}>
                {config.heading}
              </p>
            )}
            {config.text && (
              <p className="text-sm font-sans leading-relaxed mb-4" style={{ color: "#3F4A5C" }}>
                {config.text}
              </p>
            )}
            {config.ctaText && config.ctaLink && (
              <a
                href={config.ctaLink}
                className="inline-block px-8 py-3 text-xs tracking-[0.2em] uppercase font-sans transition-opacity hover:opacity-85"
                style={{ backgroundColor: "#1B2A4A", color: "#E8EAED" }}
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
