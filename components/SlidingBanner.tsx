"use client";

import { useEffect, useState, useRef } from "react";
import type { BannerConfig } from "@/lib/banner-config";

export default function SlidingBanner() {
  const [config, setConfig] = useState<BannerConfig | null>(null);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/settings/banner")
      .then((r) => r.json())
      .then(setConfig);
  }, []);

  useEffect(() => {
    if (!config?.enabled || config.messages.length <= 1) return;
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % config.messages.length);
        setAnimating(false);
      }, 400);
    }, (config.speed || 4) * 1000);
    return () => clearInterval(interval);
  }, [config]);

  if (!config?.enabled || config.messages.length === 0) return null;

  return (
    <div
      className="w-full text-center py-2.5 font-sans text-xs tracking-widest overflow-hidden"
      style={{ backgroundColor: "var(--gold)", color: "white" }}
    >
      <span
        style={{
          display: "inline-block",
          transition: "opacity 0.4s ease, transform 0.4s ease",
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(-8px)" : "translateY(0)",
        }}
      >
        {config.messages[current]}
      </span>

      {config.messages.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-1.5">
          {config.messages.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setAnimating(false); }}
              className="w-1 h-1 rounded-full transition-all"
              style={{ background: i === current ? "white" : "rgba(255,255,255,0.4)" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
