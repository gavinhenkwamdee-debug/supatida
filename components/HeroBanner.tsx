"use client";

import { useEffect, useState, useRef } from "react";

interface BannerSlide {
  imageUrl: string;
  link?: string;
}

export default function HeroBanner({ slides }: { slides: BannerSlide[] }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[current];

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      setCurrent((c) =>
        diff > 0 ? (c + 1) % slides.length : (c - 1 + slides.length) % slides.length
      );
    }
    touchStartX.current = null;
  }

  const imgDesktop = slide.link ? (
    <a href={slide.link} className="block w-full h-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={slide.imageUrl} alt="Banner" className="w-full h-full object-cover object-center" />
    </a>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={slide.imageUrl} alt="Banner" className="w-full h-full object-cover object-center" />
  );

  const imgMobile = slide.link ? (
    <a href={slide.link} className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={slide.imageUrl} alt="Banner" className="w-full h-auto block" />
    </a>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={slide.imageUrl} alt="Banner" className="w-full h-auto block" />
  );

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Desktop: fixed 3:1 ratio */}
      <div className="hidden md:block" style={{ aspectRatio: "3/1" }}>
        {imgDesktop}
      </div>

      {/* Mobile: natural ratio, no crop */}
      <div className="block md:hidden">
        {imgMobile}
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
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
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full text-lg"
            style={{ background: "rgba(0,0,0,0.3)", color: "white" }}
          >‹</button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % slides.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full text-lg"
            style={{ background: "rgba(0,0,0,0.3)", color: "white" }}
          >›</button>
        </>
      )}
    </div>
  );
}
