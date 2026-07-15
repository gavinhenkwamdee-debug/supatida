"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface BannerSlide {
  imageUrl: string;
  link?: string;
}

export default function HeroBanner({ slides }: { slides: BannerSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % slides.length);
        setAnimating(false);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/7", maxHeight: "520px" }}>
      <div
        style={{
          transition: "opacity 0.5s ease",
          opacity: animating ? 0 : 1,
          position: "absolute", inset: 0,
        }}
      >
        {slide.link ? (
          <a href={slide.link}>
            <Image src={slide.imageUrl} alt="Banner" fill className="object-cover" priority sizes="100vw" />
          </a>
        ) : (
          <Image src={slide.imageUrl} alt="Banner" fill className="object-cover" priority sizes="100vw" />
        )}
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setAnimating(false); }}
              className="w-2 h-2 rounded-full transition-all"
              style={{ background: i === current ? "white" : "rgba(255,255,255,0.45)" }}
            />
          ))}
        </div>
      )}

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + slides.length) % slides.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: "rgba(0,0,0,0.3)", color: "white" }}
          >‹</button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % slides.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: "rgba(0,0,0,0.3)", color: "white" }}
          >›</button>
        </>
      )}
    </div>
  );
}
